# Aptos Integration Guide

## Overview

The Aptos adapter enables gasless transactions on Aptos blockchain using native transaction signing with USDC fee payments.

## Supported Networks

| Network | Chain ID | Relayer URL |
|---------|----------|-------------|
| Mainnet | 1 | https://smoothsend.xyz |
| Testnet | 2 | https://testnet.smoothsend.xyz |

## Supported Coins

- **APT**: Native Aptos Coin
- **USDC**: USD Coin on Aptos
- **USDT**: Tether USD on Aptos
- **Custom Coins**: Any coin following Aptos coin standard

## Setup

### Install Dependencies

```bash
npm install @aptos-labs/ts-sdk @smoothsend/sdk
```

### Basic Configuration

```typescript
import { SmoothSendSDK } from '@smoothsend/sdk';
import { Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';

const sdk = new SmoothSendSDK();

// For testnet
const testnetSdk = new SmoothSendSDK({
  customChainConfigs: {
    aptos: {
      relayerUrl: 'https://testnet.smoothsend.xyz'
    }
  }
});
```

## Wallet Integration

### Petra Wallet Integration

```typescript
// Check if Petra is installed
const isPetraInstalled = () => {
  return typeof window !== 'undefined' && 'aptos' in window;
};

// Connect to Petra
const connectPetra = async () => {
  if (!isPetraInstalled()) {
    throw new Error('Petra wallet not installed');
  }

  try {
    const response = await window.aptos.connect();
    console.log('Connected to Petra:', response.address);
    return response;
  } catch (error) {
    throw new Error('Failed to connect to Petra wallet');
  }
};

// Sign and submit transaction via Petra
const transferViaPetra = async (request) => {
  const account = await connectPetra();
  
  // Get transaction payload from SDK
  const quote = await sdk.getQuote(request);
  const signatureData = await sdk.prepareTransfer(request, quote);
  
  // Submit transaction via Petra
  const transaction = await window.aptos.signAndSubmitTransaction(signatureData.message);
  
  return {
    success: true,
    txHash: transaction.hash,
    explorerUrl: `https://explorer.aptoslabs.com/txn/${transaction.hash}`
  };
};
```

### Pontem Wallet Integration

```typescript
const connectPontem = async () => {
  if (typeof window.pontem === 'undefined') {
    throw new Error('Pontem wallet not installed');
  }

  const response = await window.pontem.connect();
  return response;
};
```

### Private Key Integration (Server/Testing)

```typescript
import { Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';

// Create account from private key
const privateKey = new Ed25519PrivateKey('0x...');
const account = Account.fromPrivateKey({ privateKey });

console.log('Account address:', account.accountAddress.toString());
```

## Transfer Examples

### Simple APT Transfer

```typescript
const transferAPT = async (from, to, amount) => {
  try {
    const privateKey = new Ed25519PrivateKey('0x...');
    
    // Get quote
    const quote = await sdk.getQuote({
      from,
      to,
      token: 'APT',
      amount: (parseFloat(amount) * 100000000).toString(), // Convert to octas
      chain: 'aptos'
    });

    console.log('Transfer fee:', parseFloat(quote.relayerFee) / 1000000, 'USDC');
    console.log('Total USDC required:', parseFloat(quote.total) / 1000000);

    // Execute transfer
    const result = await sdk.transfer({
      from,
      to,
      token: 'APT',
      amount: (parseFloat(amount) * 100000000).toString(),
      chain: 'aptos'
    }, privateKey);

    console.log('Success! TX:', result.txHash);
    console.log('Explorer:', result.explorerUrl);
    
    return result;
  } catch (error) {
    console.error('Transfer failed:', error.message);
    throw error;
  }
};

// Usage
await transferAPT(
  '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
  '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  '1.5' // 1.5 APT
);
```

### USDC Transfer

```typescript
const transferUSDC = async (from, to, amount) => {
  const privateKey = new Ed25519PrivateKey('0x...');
  
  const result = await sdk.transfer({
    from,
    to,
    token: 'USDC',
    amount: (parseFloat(amount) * 1000000).toString(), // Convert to micro USDC
    chain: 'aptos'
  }, privateKey);

  return result;
};
```

### Custom Coin Transfer

```typescript
const transferCustomCoin = async (coinType, from, to, amount, decimals) => {
  const privateKey = new Ed25519PrivateKey('0x...');
  
  const result = await sdk.transfer({
    from,
    to,
    token: coinType, // Full coin type: "0x1::coin::CoinType"
    amount: (parseFloat(amount) * Math.pow(10, decimals)).toString(),
    chain: 'aptos'
  }, privateKey);

  return result;
};

// Usage
await transferCustomCoin(
  '0x1::aptos_coin::AptosCoin',
  '0x...',
  '0x...',
  '10',
  8
);
```

## Advanced Features

### Balance Checking

```typescript
const checkBalances = async (address) => {
  // Get all coin balances
  const balances = await sdk.getBalance('aptos', address);
  
  console.log('Coin balances:');
  balances.forEach(balance => {
    const formatted = parseFloat(balance.balance) / Math.pow(10, balance.decimals);
    console.log(`${balance.symbol}: ${formatted}`);
  });

  // Get specific coin balance
  const aptBalance = await sdk.getBalance('aptos', address, 'APT');
  if (aptBalance.length > 0) {
    const formatted = parseFloat(aptBalance[0].balance) / 100000000; // APT has 8 decimals
    console.log('APT balance:', formatted);
  }
};
```

### Account Information

```typescript
const getAccountInfo = async (address) => {
  const nonce = await sdk.getNonce('aptos', address);
  console.log('Account sequence number:', nonce);
  
  // Additional account info using Aptos SDK directly
  const { aptosClient } = sdk.getAdapter('aptos');
  const accountInfo = await aptosClient.getAccountInfo({
    accountAddress: address
  });
  
  console.log('Account info:', accountInfo);
};
```

### Transaction Monitoring

```typescript
const monitorTransaction = async (txHash) => {
  console.log('Monitoring transaction:', txHash);
  
  // Check status via SDK
  const status = await sdk.getTransactionStatus('aptos', txHash);
  console.log('Transaction status:', status);
  
  // Poll for confirmation
  let confirmed = false;
  let attempts = 0;
  const maxAttempts = 30;
  
  while (!confirmed && attempts < maxAttempts) {
    try {
      const status = await sdk.getTransactionStatus('aptos', txHash);
      if (status.success) {
        console.log('✅ Transaction confirmed!');
        confirmed = true;
      } else {
        console.log('⏳ Waiting for confirmation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    } catch (error) {
      console.log('Status check failed, retrying...');
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!confirmed) {
    console.log('❌ Transaction confirmation timeout');
  }
};
```

### Event Handling

```typescript
// Listen to Aptos-specific events
sdk.addEventListener((event) => {
  if (event.chain !== 'aptos') return;
  
  console.log(`[Aptos] ${event.type}:`, event.data);
  
  switch (event.type) {
    case 'transfer_initiated':
      updateUI('Preparing Aptos transaction...');
      break;
    case 'transfer_signed':
      updateUI('Transaction signed, submitting...');
      break;
    case 'transfer_submitted':
      updateUI('Waiting for Aptos confirmation...');
      break;
    case 'transfer_confirmed':
      updateUI('✅ Aptos transfer completed!');
      showExplorerLink(event.data.result.explorerUrl);
      break;
    case 'transfer_failed':
      updateUI('❌ Aptos transfer failed');
      showError(event.data.error);
      break;
  }
});
```

## Coin Types Reference

### Standard Coins

```typescript
const APTOS_COINS = {
  APT: '0x1::aptos_coin::AptosCoin',
  USDC: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
  USDT: '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT'
};
```

### Decimals Reference

```typescript
const COIN_DECIMALS = {
  APT: 8,
  USDC: 6,
  USDT: 6
};
```

## Error Handling

### Aptos-Specific Errors

```typescript
const handleAptosTransfer = async (request) => {
  try {
    const result = await sdk.transfer(request, privateKey);
    return result;
  } catch (error) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        if (error.details?.coin === 'USDC') {
          alert('You need USDC to pay for the gasless transaction fee');
        } else {
          alert(`Insufficient ${request.token} balance`);
        }
        break;
      case 'SEQUENCE_NUMBER_TOO_OLD':
        alert('Transaction sequence number is outdated. Please try again.');
        break;
      case 'ACCOUNT_NOT_FOUND':
        alert('Account not found on Aptos network');
        break;
      case 'COIN_NOT_REGISTERED':
        alert(`${request.token} coin is not registered in your account`);
        break;
      default:
        alert(`Aptos transfer failed: ${error.message}`);
    }
    throw error;
  }
};
```

### Retry with Sequence Number Update

```typescript
const transferWithSequenceRetry = async (request, privateKey, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sdk.transfer(request, privateKey);
    } catch (error) {
      if (error.code === 'SEQUENCE_NUMBER_TOO_OLD' && attempt < maxRetries) {
        console.log(`Sequence number error, retrying attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw error;
    }
  }
};
```

## Testing

### Testnet Configuration

```typescript
const testnetSdk = new SmoothSendSDK({
  customChainConfigs: {
    aptos: {
      name: 'Aptos Testnet',
      chainId: '2',
      relayerUrl: 'https://testnet.smoothsend.xyz',
      rpcUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
      explorerUrl: 'https://explorer.aptoslabs.com/?network=testnet'
    }
  }
});
```

### Test Account Creation

```typescript
import { Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';

// Generate new test account
const generateTestAccount = () => {
  const privateKey = Ed25519PrivateKey.generate();
  const account = Account.fromPrivateKey({ privateKey });
  
  console.log('Private key:', privateKey.toString());
  console.log('Address:', account.accountAddress.toString());
  
  return { privateKey, account };
};

// Fund test account (you'll need to use Aptos faucet)
const fundTestAccount = async (address) => {
  console.log(`Fund this address via Aptos faucet: ${address}`);
  console.log('Faucet URL: https://aptoslabs.com/testnet-faucet');
};
```

## Best Practices

1. **Always validate addresses** using SDK validation
2. **Check USDC balance** for fee payments
3. **Handle sequence number conflicts** with retries
4. **Use proper coin types** for custom coins
5. **Monitor transactions** until confirmation
6. **Test on testnet** before mainnet deployment
7. **Handle wallet connection states** properly
8. **Implement proper error handling** for network issues

## Integration Checklist

- [ ] Install Aptos SDK dependencies
- [ ] Configure wallet connection (Petra/Pontem)
- [ ] Implement account management
- [ ] Add coin type mappings
- [ ] Test transfer flows
- [ ] Add error handling
- [ ] Test on Aptos testnet
- [ ] Implement transaction monitoring
- [ ] Deploy to mainnet

## Common Patterns

### React Hook for Aptos Transfers

```typescript
import { useState, useCallback } from 'react';
import { SmoothSendSDK } from '@smoothsend/sdk';

const useAptosTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sdk = new SmoothSendSDK();

  const transfer = useCallback(async (request, privateKey) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await sdk.transfer(request, privateKey);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { transfer, loading, error };
};
```

### Vue.js Composition API

```typescript
import { ref, computed } from 'vue';
import { SmoothSendSDK } from '@smoothsend/sdk';

export const useAptosTransfer = () => {
  const loading = ref(false);
  const error = ref(null);
  const sdk = new SmoothSendSDK();

  const transfer = async (request, privateKey) => {
    loading.value = true;
    error.value = null;
    
    try {
      return await sdk.transfer(request, privateKey);
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    transfer,
    loading: computed(() => loading.value),
    error: computed(() => error.value)
  };
};
```
