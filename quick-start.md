# Quick Start

Get up and running with SmoothSend SDK in minutes. This guide will walk you through creating your first gasless transaction.

## Step 1: Initialize the SDK

```typescript
import { SmoothSendSDK } from '@smoothsend/sdk';

const smoothSend = new SmoothSendSDK({
  timeout: 30000,
  retries: 3
});
```

## Step 2: Connect to a Wallet

### Using MetaMask (Browser)

```typescript
import { ethers } from 'ethers';

// Connect to MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const userAddress = await signer.getAddress();
```

### Using a Private Key (Node.js)

```typescript
import { ethers } from 'ethers';

// For testing only - never hardcode private keys in production
const provider = new ethers.JsonRpcProvider('https://api.avax-test.network/ext/bc/C/rpc');
const signer = new ethers.Wallet('your-private-key', provider);
```

## Step 3: Get a Transfer Quote

Before executing a transfer, get a quote to see fees and validate the transaction:

```typescript
const quote = await smoothSend.getQuote({
  from: userAddress,
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000', // 1 USDC (6 decimals)
  chain: 'avalanche'
});

console.log('Transfer amount:', quote.amount);
console.log('Relayer fee:', quote.relayerFee);
console.log('Total cost:', quote.total);
console.log('Fee percentage:', quote.feePercentage);
```

### ⚠️ Critical: Amount Format Requirements

**Amounts must be provided in the smallest token units (like wei for ETH), NOT in decimal format:**

```typescript
// ❌ WRONG - This will fail with "amount fails to match the required pattern: /^\d+$/"
const wrongAmount = '0.5';  // Decimal format not allowed

// ✅ CORRECT - Convert to smallest units
const correctAmount = '500000';  // 0.5 USDC = 500000 units (6 decimals)

// Helper functions for amount conversion:
import { ethers } from 'ethers';

// For USDC (6 decimals): 0.5 USDC = 500000 units
const usdcAmount = ethers.parseUnits('0.5', 6).toString(); // "500000"

// For AVAX (18 decimals): 0.1 AVAX = 100000000000000000 units  
const avaxAmount = ethers.parseUnits('0.1', 18).toString(); // "100000000000000000"

// For APT (8 decimals): 1.5 APT = 150000000 units
const aptAmount = (1.5 * Math.pow(10, 8)).toString(); // "150000000"
```

**Token Decimal Reference:**
- **USDC**: 6 decimals (1 USDC = 1,000,000 units)
- **USDT**: 6 decimals (1 USDT = 1,000,000 units)  
- **AVAX**: 18 decimals (1 AVAX = 1,000,000,000,000,000,000 units)
- **APT**: 8 decimals (1 APT = 100,000,000 units)

## Step 4: Execute the Transfer

```typescript
const transferRequest = {
  from: userAddress,
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000', // 1 USDC (6 decimals)
  chain: 'avalanche' as const
};

try {
  const result = await smoothSend.transfer(transferRequest, signer);
  
  console.log('Transfer successful!');
  console.log('Transaction Hash:', result.txHash);
  console.log('Block Number:', result.blockNumber);
  console.log('Explorer URL:', result.explorerUrl);
  console.log('Gas Used:', result.gasUsed);
} catch (error) {
  console.error('Transfer failed:', error.message);
}
```

## Complete Transaction Flow

Understanding the transaction flow is crucial for proper integration. Here's the complete sequence:

### 1. High-Level Flow (Recommended)

```typescript
// ✅ SIMPLEST APPROACH - Use the unified transfer() method
const result = await smoothSend.transfer(transferRequest, signer);
```

The `transfer()` method handles the entire flow internally:
1. **getQuote()** - Get fee estimates and validate the transaction
2. **prepareTransfer()** - Prepare signature data for your wallet
3. **Sign** - Your wallet signs the transaction data
4. **executeTransfer()** - Submit the signed transaction to the relayer

### 2. Step-by-Step Flow (Advanced)

If you need more control, you can break it down:

```typescript
// Step 1: Get quote and validate
const quote = await smoothSend.getQuote({
  from: userAddress,
  to: recipientAddress,
  token: 'USDC',
  amount: '1000000', // 1 USDC in smallest units
  chain: 'avalanche'
});

// Step 2: Prepare signature data
const signatureData = await smoothSend.prepareTransfer({
  from: userAddress,
  to: recipientAddress,
  token: 'USDC',
  amount: '1000000',
  chain: 'avalanche'
}, quote);

// Step 3: Sign with wallet (chain-specific)
let signedData;
if (request.chain === 'avalanche') {
  // EVM signing (EIP-712)
  const signature = await signer.signTypedData(
    signatureData.domain,
    signatureData.types,
    signatureData.message
  );
  signedData = {
    signature,
    transferData: { /* EVM transfer data */ },
    signatureType: 'EIP712' as const
  };
} else if (request.chain === 'aptos-testnet') {
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
const result = await smoothSend.executeTransfer(signedData, request.chain);
```

### 3. Error Handling in Transaction Flow

```typescript
try {
  // Get quote first to validate
  const quote = await smoothSend.getQuote(transferRequest);
  console.log(`Fee: ${quote.relayerFee} ${transferRequest.token}`);
  
  // Execute transfer
  const result = await smoothSend.transfer(transferRequest, signer);
  console.log('Success! Tx:', result.txHash);
  
} catch (error) {
  // Handle specific errors
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('Not enough tokens for transfer + fees');
  } else if (error.code === 'SIGNATURE_REJECTED') {
    console.error('User cancelled the transaction');
  } else if (error.code === 'UNSUPPORTED_TOKEN') {
    console.error('Token not supported on this chain');
  } else {
    console.error('Transfer failed:', error.message);
  }
}
```

### 4. Event Monitoring During Flow

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

## Complete Example

Here's a complete working example:

```typescript
import { SmoothSendSDK } from '@smoothsend/sdk';
import { ethers } from 'ethers';

async function sendGaslessTransaction() {
  // 1. Initialize SDK
  const smoothSend = new SmoothSendSDK();
  
  // 2. Connect wallet
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();
  
  // 3. Define transfer
const transferRequest = {
  from: userAddress,
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000', // 1 USDC
  chain: 'avalanche' as const // EVM chain - see Aptos example below
};
  
  try {
    // 4. Get quote
    const quote = await smoothSend.getQuote(transferRequest);
    console.log(`Fee: ${quote.relayerFee} USDC (${quote.feePercentage}%)`);
    
    // 5. Execute transfer
    const result = await smoothSend.transfer(transferRequest, signer);
    console.log('Success! Tx:', result.txHash);
    
    return result;
  } catch (error) {
    console.error('Transfer failed:', error);
    throw error;
  }
}

// Call the function
sendGaslessTransaction();
```

## React Component Example

Here's how to integrate SmoothSend into a React component:

```tsx
import React, { useState } from 'react';
import { SmoothSendSDK } from '@smoothsend/sdk';
import { ethers } from 'ethers';

function TransferComponent() {
  const [sdk] = useState(new SmoothSendSDK());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      const transferResult = await sdk.transfer({
        from: userAddress,
        to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
        token: 'USDC',
        amount: '1000000',
        chain: 'avalanche'
      }, signer);

      setResult(transferResult);
    } catch (error) {
      console.error('Transfer failed:', error);
      alert(`Transfer failed: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Sending...' : 'Send 1 USDC'}
      </button>
      
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

## Event Monitoring

Monitor transfer progress with event listeners:

```typescript
// Add event listener
smoothSend.addEventListener((event) => {
  switch (event.type) {
    case 'transfer_initiated':
      console.log('Transfer started');
      break;
    case 'transfer_signed':
      console.log('Transaction signed');
      break;
    case 'transfer_submitted':
      console.log('Transaction submitted');
      break;
    case 'transfer_confirmed':
      console.log('Transfer confirmed:', event.data.result);
      break;
    case 'transfer_failed':
      console.log('Transfer failed:', event.data.error);
      break;
  }
});

// Execute transfer with monitoring
await smoothSend.transfer(transferRequest, signer);
```

## Supported Tokens

### Avalanche Fuji:
- **USDC** - USD Coin (6 decimals)
- **USDT** - Tether USD (6 decimals)
- **AVAX** - Native Avalanche token (18 decimals)

### Aptos Testnet:
- **APT** - Native Aptos token (8 decimals)
- **USDC** - USD Coin (6 decimals)

## Amount Formatting

Always provide amounts in the smallest unit (like wei for ETH, octas for Aptos):

### EVM Chains (Avalanche)
```typescript
import { ethers } from 'ethers';
import { getTokenDecimals } from '@smoothsend/sdk';

// For USDC (6 decimals)
const usdcAmount = ethers.parseUnits('1.5', 6).toString(); // "1500000"

// Or use the utility function
const decimals = getTokenDecimals('USDC'); // 6
const amount = ethers.parseUnits('1.5', decimals).toString();
```

### Aptos Chain
```typescript
// For APT (8 decimals)
const aptAmount = (1.5 * Math.pow(10, 8)).toString(); // "150000000"

// For USDC on Aptos (6 decimals)
const usdcAmount = (1.5 * Math.pow(10, 6)).toString(); // "1500000"
```

## Error Handling

Common errors and how to handle them:

```typescript
try {
  const result = await smoothSend.transfer(transferRequest, signer);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('User does not have enough tokens');
  } else if (error.code === 'INVALID_ADDRESS') {
    console.error('Invalid recipient address');
  } else if (error.code === 'NETWORK_ERROR') {
    console.error('Network connection issue');
  } else if (error.code === 'BALANCE_NOT_SUPPORTED') {
    console.error('Balance functionality not available for this chain');
  } else if (error.code === 'SIGNATURE_REJECTED') {
    console.error('User rejected the transaction signature');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Next Steps

- [API Reference](./api/) - Explore all available methods

## Aptos-Specific Implementation

For Aptos chains, the transaction flow requires serialized transactions:

```typescript
import { SmoothSendSDK } from '@smoothsend/sdk';

async function sendAptosGaslessTransaction() {
  const smoothSend = new SmoothSendSDK();
  
  // Connect to Aptos wallet (e.g., Petra)
  const aptosWallet = window.aptos;
  await aptosWallet.connect();
  const userAddress = await aptosWallet.account();
  
  // 1. Get quote
  const quote = await smoothSend.getQuote({
    from: userAddress.address,
    to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
    token: 'USDC',
    amount: '1000000',
    chain: 'aptos-testnet'
  });
  
  // 2. Prepare transaction
  const signatureData = await smoothSend.prepareTransfer({
    from: userAddress.address,
    to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
    token: 'USDC',
    amount: '1000000',
    chain: 'aptos-testnet'
  }, quote);
  
  // 3. Sign with wallet (must return serialized data)
  const signedTransaction = await aptosWallet.signTransaction(signatureData.message);
  
  // 4. Execute with serialized data
  const result = await smoothSend.executeTransfer({
    signature: 'serialized',
    transferData: {
      transactionBytes: signedTransaction.transactionBytes,
      authenticatorBytes: signedTransaction.authenticatorBytes,
      functionName: 'smoothsend_transfer'
    }
  }, 'aptos-testnet');
  
  console.log('Success! Tx:', result.txHash);
  console.log('Gas paid by:', result.gasFeePaidBy); // 'relayer'
}
```

**Important for Aptos:**
- Wallet must support transaction serialization
- Returns `transactionBytes` and `authenticatorBytes` as number arrays
- Relayer pays all gas fees (true gasless experience)

## Troubleshooting Common Issues

### Issue 1: "Chain 'aptos' is not supported"

**Problem:** Using incorrect chain identifier.

**Solution:**
```typescript
// ❌ Wrong
chain: 'aptos'

// ✅ Correct  
chain: 'aptos-testnet'
```

**Supported chain identifiers:**
- `'avalanche'` (not `'avalanche-fuji'`)
- `'aptos-testnet'` (not `'aptos'`)

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

## Need Help?

- Join our [Discord Community](https://discord.gg/fF6cdJFWnM)
- Follow us on [Twitter](https://x.com/smoothsend)