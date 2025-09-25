# SmoothSend Integration Guide

A comprehensive guide to integrating SmoothSend SDK into your dApp, addressing common challenges and providing best practices.

## Table of Contents

1. [Quick Setup](#quick-setup)
2. [Chain Identifiers](#chain-identifiers)
3. [Amount Formatting](#amount-formatting)
4. [Transaction Flow](#transaction-flow)
5. [Error Handling](#error-handling)
6. [Advanced Patterns](#advanced-patterns)
7. [Troubleshooting](#troubleshooting)

## Quick Setup

### 1. Install the SDK

```bash
npm install @smoothsend/sdk
# or
yarn add @smoothsend/sdk
```

### 2. Basic Integration

```typescript
import { SmoothSendSDK } from '@smoothsend/sdk';

const smoothSend = new SmoothSendSDK({
  timeout: 30000,
  retries: 3
});

// Simple transfer
const result = await smoothSend.transfer({
  from: userAddress,
  to: recipientAddress,
  token: 'USDC',
  amount: '1000000', // 1 USDC in smallest units
  chain: 'avalanche' // Use exact chain identifier
}, signer);
```

## Chain Identifiers

### ⚠️ Critical: Use Exact Identifiers

**Supported Chain Identifiers:**
- `'avalanche'` - Avalanche Fuji Testnet
- `'aptos-testnet'` - Aptos Testnet

```typescript
// ✅ CORRECT
const avalancheRequest = {
  chain: 'avalanche' as const,
  // ... other fields
};

const aptosRequest = {
  chain: 'aptos-testnet' as const,
  // ... other fields
};

// ❌ WRONG - These will cause "Chain not supported" errors
const wrongRequests = [
  { chain: 'aptos' },           // Should be 'aptos-testnet'
  { chain: 'avalanche-fuji' },  // Should be 'avalanche'
  { chain: 'aptos-mainnet' },   // Should be 'aptos-testnet'
  { chain: 'ethereum' },        // Not supported yet
];
```

### Chain-Specific Examples

#### Avalanche (EVM)
```typescript
const avalancheTransfer = {
  from: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000', // 1 USDC
  chain: 'avalanche' as const
};
```

#### Aptos (Move)
```typescript
const aptosTransfer = {
  from: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000', // 1 USDC
  chain: 'aptos-testnet' as const
};
```

## Amount Formatting

### ⚠️ Critical: Use Smallest Token Units

**Amounts must be provided in the smallest token units (like wei for ETH), NOT in decimal format.**

### Token Decimal Reference

| Token | Decimals | Example |
|-------|----------|---------|
| USDC | 6 | 1 USDC = 1,000,000 units |
| USDT | 6 | 1 USDT = 1,000,000 units |
| AVAX | 18 | 1 AVAX = 1,000,000,000,000,000,000 units |
| APT | 8 | 1 APT = 100,000,000 units |

### Conversion Examples

```typescript
import { ethers } from 'ethers';

// ❌ WRONG - Decimal format will fail
const wrongAmount = '0.5';

// ✅ CORRECT - Convert to smallest units
const correctAmount = '500000'; // 0.5 USDC

// Helper functions for conversion
const usdcAmount = ethers.parseUnits('0.5', 6).toString(); // "500000"
const avaxAmount = ethers.parseUnits('0.1', 18).toString(); // "100000000000000000"
const aptAmount = (1.5 * Math.pow(10, 8)).toString(); // "150000000"

// Utility function for any token
function convertToSmallestUnits(amount: string, decimals: number): string {
  return ethers.parseUnits(amount, decimals).toString();
}
```

### Common Conversion Patterns

```typescript
// Pattern 1: Using ethers.js
const amount = ethers.parseUnits('1.5', 6).toString(); // USDC

// Pattern 2: Manual calculation
const amount = (1.5 * Math.pow(10, 6)).toString(); // USDC

// Pattern 3: Using SDK utility
import { getTokenDecimals } from '@smoothsend/sdk';
const decimals = getTokenDecimals('USDC'); // 6
const amount = ethers.parseUnits('1.5', decimals).toString();
```

## Transaction Flow

### 1. Simple Flow (Recommended)

```typescript
// ✅ ONE METHOD CALL - Handles everything internally
const result = await smoothSend.transfer(transferRequest, signer);
```

**Internal Steps:**
1. `getQuote()` - Validate and get fees
2. `prepareTransfer()` - Prepare signature data
3. Sign with wallet (EIP-712 for EVM, Ed25519 for Aptos)
4. `executeTransfer()` - Submit to relayer
5. Return transaction result

### 2. Advanced Flow (Step-by-Step)

```typescript
// Step 1: Get quote and validate
const quote = await smoothSend.getQuote(transferRequest);
console.log(`Fee: ${quote.relayerFee} ${transferRequest.token}`);

// Step 2: Prepare signature data
const signatureData = await smoothSend.prepareTransfer(transferRequest, quote);

// Step 3: Sign with wallet (chain-specific)
let signedData;
if (transferRequest.chain === 'avalanche') {
  // EVM signing (EIP-712)
  const signature = await signer.signTypedData(
    signatureData.domain,
    signatureData.types,
    signatureData.message
  );
  signedData = {
    signature,
    transferData: {
      chainName: 'avalanche-fuji',
      from: transferRequest.from,
      to: transferRequest.to,
      tokenSymbol: transferRequest.token,
      amount: transferRequest.amount,
      relayerFee: quote.relayerFee,
      nonce: signatureData.message.nonce,
      deadline: signatureData.message.deadline,
    },
    signatureType: 'EIP712' as const
  };
} else if (transferRequest.chain === 'aptos-testnet') {
  // Aptos signing (Ed25519)
  const signedTransaction = await signer.signTransaction(signatureData.message);
  signedData = {
    signature: 'serialized',
    transferData: {
      transactionBytes: signedTransaction.transactionBytes,
      authenticatorBytes: signedTransaction.authenticatorBytes,
      functionName: 'smoothsend_transfer'
    },
    signatureType: 'Ed25519' as const
  };
}

// Step 4: Execute the transfer
const result = await smoothSend.executeTransfer(signedData, transferRequest.chain);
```

### 3. Event Monitoring

```typescript
// Listen to transaction events
smoothSend.addEventListener((event) => {
  switch (event.type) {
    case 'transfer_initiated':
      console.log('🔄 Transfer started');
      break;
    case 'transfer_signed':
      console.log('✍️ Transaction signed by user');
      break;
    case 'transfer_submitted':
      console.log('📤 Transaction submitted to relayer');
      break;
    case 'transfer_confirmed':
      console.log('✅ Transfer confirmed:', event.data.result.txHash);
      break;
    case 'transfer_failed':
      console.log('❌ Transfer failed:', event.data.error);
      break;
  }
});

// Execute transfer with monitoring
await smoothSend.transfer(transferRequest, signer);
```

## Error Handling

### Common Error Codes

```typescript
try {
  const result = await smoothSend.transfer(transferRequest, signer);
} catch (error) {
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      console.error('Not enough tokens for transfer + fees');
      break;
    case 'SIGNATURE_REJECTED':
      console.error('User cancelled the transaction');
      break;
    case 'UNSUPPORTED_TOKEN':
      console.error('Token not supported on this chain');
      break;
    case 'INVALID_ADDRESS':
      console.error('Invalid wallet address format');
      break;
    case 'NETWORK_ERROR':
      console.error('Connection issue with relayer');
      break;
    case 'RELAYER_ERROR':
      console.error('Relayer service error');
      break;
    case 'TRANSACTION_FAILED':
      console.error('Transaction failed on chain');
      break;
    default:
      console.error('Unexpected error:', error.message);
  }
}
```

### Aptos-Specific Errors

```typescript
// Aptos signature validation errors
if (error.code === 'APTOS_MISSING_PUBLIC_KEY') {
  console.error('Signer must implement publicKey() method');
} else if (error.code === 'APTOS_INVALID_SIGNATURE_FORMAT') {
  console.error('Signature must be a valid hex string');
} else if (error.code === 'APTOS_ADDRESS_MISMATCH') {
  console.error('Public key does not match the sender address');
}
```

### Balance Validation

```typescript
// Always check quote first to see total cost
const quote = await smoothSend.getQuote(transferRequest);
console.log(`Transfer: ${quote.amount}, Fee: ${quote.relayerFee}, Total: ${quote.total}`);

// Ensure user has enough for transfer + fees
const requiredBalance = BigInt(quote.total);
const userBalance = BigInt(userTokenBalance);
if (userBalance < requiredBalance) {
  throw new Error('Insufficient balance for transfer + fees');
}
```

## Advanced Patterns

### 1. Batch Transfers

```typescript
// Avalanche supports native batch transfers
const batchRequest = {
  transfers: [
    {
      from: userAddress,
      to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
      token: 'USDC',
      amount: '1000000',
      chain: 'avalanche' as const
    },
    {
      from: userAddress,
      to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d4',
      token: 'USDT',
      amount: '2000000',
      chain: 'avalanche' as const
    }
  ],
  chain: 'avalanche' as const
};

const results = await smoothSend.batchTransfer(batchRequest, signer);
```

### 2. Balance Checking (Aptos Only)

```typescript
// Get all balances (Aptos chains only)
const balances = await smoothSend.getBalance('aptos-testnet', userAddress);

// Get specific token balance
const usdcBalance = await smoothSend.getBalance('aptos-testnet', userAddress, 'USDC');
```

### 3. Custom Configuration

```typescript
const smoothSend = new SmoothSendSDK({
  timeout: 30000,
  retries: 3,
  useDynamicConfig: true, // Enable dynamic config (default)
  configCacheTtl: 300000, // Cache TTL in ms (5 minutes)
  customChainConfigs: {
    avalanche: {
      relayerUrl: 'https://custom-relayer.com'
    }
  }
});
```

### 4. React Integration

```tsx
import React, { useState, useEffect } from 'react';
import { SmoothSendSDK } from '@smoothsend/sdk';

function TransferComponent() {
  const [sdk] = useState(new SmoothSendSDK());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleTransfer = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const transferRequest = {
        from: userAddress,
        to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
        token: 'USDC',
        amount: '1000000', // 1 USDC
        chain: 'avalanche' as const
      };

      const result = await sdk.transfer(transferRequest, signer);
      setResult(result);
    } catch (error) {
      setError(error.message);
    }
    
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Sending...' : 'Send 1 USDC'}
      </button>
      
      {error && <div className="error">Error: {error}</div>}
      
      {result && (
        <div>
          <p>Transfer successful!</p>
          <p>Tx: <a href={result.explorerUrl} target="_blank">{result.txHash}</a></p>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### Issue 1: "Chain 'aptos' is not supported"

**Problem:** Using incorrect chain identifier.

**Solution:**
```typescript
// ❌ Wrong
chain: 'aptos'

// ✅ Correct  
chain: 'aptos-testnet'
```

### Issue 2: "amount fails to match the required pattern: /^\d+$/"

**Problem:** Using decimal amounts instead of smallest token units.

**Solution:**
```typescript
// ❌ Wrong - Decimal format
amount: '0.5'

// ✅ Correct - Smallest units
amount: '500000'  // 0.5 USDC (6 decimals)

// Helper function
import { ethers } from 'ethers';
const amount = ethers.parseUnits('0.5', 6).toString(); // "500000"
```

### Issue 3: Transaction Flow Confusion

**Problem:** Unsure about the sequence of method calls.

**Solution:** Use the unified `transfer()` method:

```typescript
// ✅ SIMPLEST - One method call handles everything
const result = await smoothSend.transfer(transferRequest, signer);

// ✅ ADVANCED - Step by step for custom control
const quote = await smoothSend.getQuote(transferRequest);
const signatureData = await smoothSend.prepareTransfer(transferRequest, quote);
// ... sign with wallet ...
const result = await smoothSend.executeTransfer(signedData, transferRequest.chain);
```

### Issue 4: Aptos Signature Errors

**Problem:** Aptos transactions require specific signature format.

**Solution:**
```typescript
// Ensure your Aptos wallet returns serialized data
const signedTransaction = await aptosWallet.signTransaction(signatureData.message);

// Required fields for Aptos
const signedData = {
  signature: 'serialized',
  transferData: {
    transactionBytes: signedTransaction.transactionBytes,    // Required
    authenticatorBytes: signedTransaction.authenticatorBytes, // Required
    functionName: 'smoothsend_transfer'
  },
  signatureType: 'Ed25519' as const
};
```

### Issue 5: Insufficient Balance Errors

**Problem:** Not accounting for relayer fees.

**Solution:**
```typescript
// Always check quote first to see total cost
const quote = await smoothSend.getQuote(transferRequest);
console.log(`Transfer: ${quote.amount}, Fee: ${quote.relayerFee}, Total: ${quote.total}`);

// Ensure user has enough for transfer + fees
const requiredBalance = BigInt(quote.total);
const userBalance = BigInt(userTokenBalance);
if (userBalance < requiredBalance) {
  throw new Error('Insufficient balance for transfer + fees');
}
```

## Best Practices

1. **Always use exact chain identifiers** - `'avalanche'` and `'aptos-testnet'`
2. **Convert amounts to smallest units** - Use `ethers.parseUnits()` or manual calculation
3. **Use the unified `transfer()` method** - It handles the entire flow automatically
4. **Check quotes first** - Always validate fees and balances before executing
5. **Handle errors gracefully** - Provide meaningful error messages to users
6. **Monitor events** - Use event listeners for real-time transaction updates
7. **Validate addresses** - Use `validateAddress()` before making requests

## Need Help?

- [Quick Start Guide](./quick-start.md) - Your first gasless transaction
- [API Reference](./api/) - Complete API documentation
- [Discord Community](https://discord.gg/fF6cdJFWnM) - Get help from the community
- [Twitter](https://x.com/smoothsend) - Follow for updates
