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

## Need Help?

- Join our [Discord Community](https://discord.gg/fF6cdJFWnM)
- Follow us on [Twitter](https://x.com/smoothsend)