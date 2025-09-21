# Avalanche Integration Guide

## Overview

The Avalanche adapter enables gasless transactions on Avalanche C-Chain using EIP-712 signatures and permit-based token approvals. Currently supports Fuji Testnet with dynamic configuration fetching.

## Supported Networks

| Network | Chain ID | Relayer URL |
|---------|----------|-------------|
| Fuji Testnet | 43113 | https://smoothsendevm.onrender.com |

## Supported Tokens

- **USDC**: USD Coin (primary supported token)
- Additional tokens available through dynamic configuration

## Setup

### Install Dependencies

```bash
npm install ethers @smoothsend/sdk
```

### Basic Configuration

```typescript
import { SmoothSendSDK, getChainConfig, chainConfigService } from '@smoothsend/sdk';
import { ethers } from 'ethers';

// Initialize SDK (uses testnet by default)
const sdk = new SmoothSendSDK();

// Get chain configuration
const avalancheConfig = getChainConfig('avalanche');
console.log('Relayer URL:', avalancheConfig.relayerUrl);

// Optional: Fetch dynamic configurations
const dynamicConfigs = await chainConfigService.getAllChainConfigs();
console.log('Available chains:', Object.keys(dynamicConfigs));
```

## Wallet Integration

### MetaMask Integration

```typescript
import { ethers } from 'ethers';

// Connect to MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();

// Execute transfer
const result = await sdk.transfer({
  from: await signer.getAddress(),
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: ethers.parseUnits('10', 6).toString(),
  chain: 'avalanche'
}, signer);

console.log('Transfer successful:', result.txHash);
console.log('Explorer URL:', result.explorerUrl);
```

### WalletConnect Integration

```typescript
import { WalletConnectProvider } from '@walletconnect/ethereum-provider';
import { ethers } from 'ethers';

const provider = await WalletConnectProvider.init({
  projectId: 'your-project-id',
  chains: [43113], // Avalanche Fuji testnet
  showQrModal: true
});

await provider.enable();
const ethersProvider = new ethers.BrowserProvider(provider);
const signer = await ethersProvider.getSigner();
```

### Coinbase Wallet Integration

```typescript
import { CoinbaseWalletSDK } from '@coinbase/wallet-sdk';
import { ethers } from 'ethers';

const coinbaseWallet = new CoinbaseWalletSDK({
  appName: 'Your App',
  appLogoUrl: 'https://example.com/logo.png',
  darkMode: false
});

const ethereum = coinbaseWallet.makeWeb3Provider();
const provider = new ethers.BrowserProvider(ethereum);
const signer = await provider.getSigner();
```

## Transfer Examples

### Simple USDC Transfer

```typescript
const transferUSDC = async (from, to, amount) => {
  try {
    // Get quote first
    const quote = await sdk.getQuote({
      from,
      to,
      token: 'USDC',
      amount: ethers.parseUnits(amount, 6).toString(),
      chain: 'avalanche'
    });

    console.log('Transfer fee:', ethers.formatUnits(quote.relayerFee, 6), 'USDC');
    console.log('Total cost:', ethers.formatUnits(quote.total, 6), 'USDC');

    // Execute transfer
    const result = await sdk.transfer({
      from,
      to,
      token: 'USDC',
      amount: ethers.parseUnits(amount, 6).toString(),
      chain: 'avalanche'
    }, signer);

    console.log('Success! TX:', result.txHash);
    console.log('Explorer:', result.explorerUrl);
    
    return result;
  } catch (error) {
    console.error('Transfer failed:', error.message);
    throw error;
  }
};

// Usage
await transferUSDC(
  '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
  '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  '100' // 100 USDC
);
```

### Batch Transfers

```typescript
const batchTransfer = async (senderAddress, recipients) => {
  const transfers = recipients.map(({ address, token, amount }) => ({
    from: senderAddress,
    to: address,
    token,
    amount: ethers.parseUnits(amount, token === 'USDC' ? 6 : 18).toString(),
    chain: 'avalanche' as const
  }));

  const results = await sdk.batchTransfer({
    transfers,
    chain: 'avalanche'
  }, signer);

  console.log('Batch transfer completed:');
  results.forEach((result, i) => {
    console.log(`Transfer ${i + 1}: ${result.txHash}`);
  });

  return results;
};

// Usage
await batchTransfer('0x...', [
  { address: '0x...', token: 'USDC', amount: '50' },
  { address: '0x...', token: 'USDT', amount: '25' },
  { address: '0x...', token: 'USDC', amount: '75' }
]);
```

### Custom Token Transfer

```typescript
const transferCustomToken = async (tokenAddress, from, to, amount, decimals) => {
  // For custom tokens, use the contract address
  const result = await sdk.transfer({
    from,
    to,
    token: tokenAddress, // Use contract address instead of symbol
    amount: ethers.parseUnits(amount, decimals).toString(),
    chain: 'avalanche'
  }, signer);

  return result;
};
```

## Advanced Features

### Event Monitoring

```typescript
// Listen to transfer events
sdk.addEventListener((event) => {
  console.log(`[${event.chain}] ${event.type}:`, event.data);
  
  switch (event.type) {
    case 'transfer_initiated':
      showLoader('Preparing transfer...');
      break;
    case 'transfer_signed':
      showLoader('Submitting transaction...');
      break;
    case 'transfer_submitted':
      showLoader('Waiting for confirmation...');
      break;
    case 'transfer_confirmed':
      hideLoader();
      showSuccess(`Transfer completed! TX: ${event.data.result.txHash}`);
      break;
    case 'transfer_failed':
      hideLoader();
      showError(`Transfer failed: ${event.data.error}`);
      break;
  }
});
```

### Balance Checking

```typescript
const checkBalances = async (address) => {
  // Get all token balances
  const balances = await sdk.getBalance('avalanche', address);
  
  console.log('Token balances:');
  balances.forEach(balance => {
    const formatted = ethers.formatUnits(balance.balance, balance.decimals);
    console.log(`${balance.symbol}: ${formatted}`);
  });

  // Get specific token balance
  const usdcBalance = await sdk.getBalance('avalanche', address, 'USDC');
  console.log('USDC balance:', ethers.formatUnits(usdcBalance[0].balance, 6));
};
```

### Transaction Status

```typescript
const checkTransaction = async (txHash) => {
  const status = await sdk.getTransactionStatus('avalanche', txHash);
  console.log('Transaction status:', status);
  
  if (status.executed) {
    console.log('✅ Transaction confirmed');
  } else {
    console.log('⏳ Transaction pending');
  }
};
```

## Error Handling

### Common Errors

```typescript
const handleTransfer = async (request) => {
  try {
    const result = await sdk.transfer(request, signer);
    return result;
  } catch (error) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        alert('You don\'t have enough tokens for this transfer');
        break;
      case 'USER_REJECTED':
        console.log('User cancelled the transaction');
        break;
      case 'NETWORK_ERROR':
        alert('Network error. Please check your connection.');
        break;
      case 'QUOTE_ERROR':
        alert('Unable to get transfer quote. Please try again.');
        break;
      default:
        alert(`Transfer failed: ${error.message}`);
    }
    throw error;
  }
};
```

### Retry Logic

```typescript
const transferWithRetry = async (request, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sdk.transfer(request, signer);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};
```

## Best Practices

1. **Always validate addresses** before transfers
2. **Check balances** before attempting transfers
3. **Handle user rejections** gracefully
4. **Implement proper error handling** for network issues
5. **Use event listeners** for better UX
6. **Implement retry logic** for network resilience
