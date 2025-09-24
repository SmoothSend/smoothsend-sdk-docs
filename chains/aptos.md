# Aptos Integration Guide

## Overview

The Aptos adapter enables gasless transactions on Aptos testnet using Move-based smart contracts and Aptos-specific signature schemes. The SDK provides a unified interface while handling Aptos-specific features like sequence numbers and Move function calls.

## Supported Networks

| Network | Chain ID | Relayer URL |
|---------|----------|-------------|
| Aptos Testnet | 2 | https://smoothsendrelayerworking.onrender.com/api/v1/relayer |

## Supported Tokens

- **USDC**: USD Coin (primary supported token)
- **APT**: Native Aptos token
- Additional tokens available through dynamic configuration

## Setup

### Install Dependencies

```bash
npm install @smoothsend/sdk
# Note: Aptos-specific wallet dependencies will be needed for wallet integration
```

### Basic Configuration

```typescript
import { SmoothSendSDK, getChainConfig } from '@smoothsend/sdk';

// Initialize SDK (includes Aptos testnet support)
const sdk = new SmoothSendSDK();

// Get Aptos chain configuration
const aptosConfig = getChainConfig('aptos-testnet');
console.log('Aptos Relayer URL:', aptosConfig.relayerUrl);
console.log('Aptos RPC URL:', aptosConfig.rpcUrl);
console.log('Supported tokens:', aptosConfig.tokens);
```

## Wallet Integration

### Petra Wallet Integration

```typescript
// Connect to Petra wallet (Aptos wallet)
const connectPetraWallet = async () => {
  if (!window.aptos) {
    throw new Error('Petra wallet not installed');
  }

  try {
    const response = await window.aptos.connect();
    console.log('Connected to Petra:', response.address);
    return response;
  } catch (error) {
    console.error('Failed to connect to Petra:', error);
    throw error;
  }
};

// Execute transfer with Petra
const executeAptosTransfer = async () => {
  const wallet = await connectPetraWallet();
  
  const result = await sdk.transfer({
    from: wallet.address,
    to: '0x8765432109fedcba8765432109fedcba87654321',
    token: 'USDC',
    amount: '1000000', // 1 USDC (6 decimals)
    chain: 'aptos-testnet'
  }, wallet);

  console.log('Transfer successful:', result.txHash);
  console.log('Explorer URL:', result.explorerUrl);
  return result;
};
```

### Martian Wallet Integration

```typescript
// Connect to Martian wallet
const connectMartianWallet = async () => {
  if (!window.martian) {
    throw new Error('Martian wallet not installed');
  }

  try {
    const response = await window.martian.connect();
    console.log('Connected to Martian:', response.address);
    return response;
  } catch (error) {
    console.error('Failed to connect to Martian:', error);
    throw error;
  }
};
```

## Transfer Examples

### Simple USDC Transfer

```typescript
const transferUSDCOnAptos = async (fromAddress, toAddress, amount) => {
  try {
    // Get quote first to show fees
    const quote = await sdk.getQuote({
      from: fromAddress,
      to: toAddress,
      token: 'USDC',
      amount: (parseFloat(amount) * 1000000).toString(), // Convert to 6 decimals
      chain: 'aptos-testnet'
    });

    console.log('Transfer fee:', (parseInt(quote.relayerFee) / 1000000).toFixed(6), 'USDC');
    console.log('Total cost:', (parseInt(quote.total) / 1000000).toFixed(6), 'USDC');

    // Execute transfer
    const wallet = await connectPetraWallet();
    const result = await sdk.transfer({
      from: fromAddress,
      to: toAddress,
      token: 'USDC',
      amount: (parseFloat(amount) * 1000000).toString(),
      chain: 'aptos-testnet'
    }, wallet);

    console.log('Success! TX:', result.txHash);
    console.log('Explorer:', result.explorerUrl);
    
    return result;
  } catch (error) {
    console.error('Aptos transfer failed:', error.message);
    throw error;
  }
};

// Usage
await transferUSDCOnAptos(
  '0x1234567890abcdef1234567890abcdef12345678',
  '0x8765432109fedcba8765432109fedcba87654321',
  '10' // 10 USDC
);
```

### APT Token Transfer

```typescript
const transferAPT = async (fromAddress, toAddress, amount) => {
  try {
    const wallet = await connectPetraWallet();
    
    const result = await sdk.transfer({
      from: fromAddress,
      to: toAddress,
      token: 'APT',
      amount: (parseFloat(amount) * 100000000).toString(), // APT has 8 decimals
      chain: 'aptos-testnet'
    }, wallet);

    console.log('APT transfer successful:', result.txHash);
    return result;
  } catch (error) {
    console.error('APT transfer failed:', error);
    throw error;
  }
};
```

## Advanced Features

### Event Monitoring

```typescript
// Listen to Aptos transfer events
sdk.addEventListener((event) => {
  if (event.chain === 'aptos-testnet') {
    console.log(`[Aptos] ${event.type}:`, event.data);
    
    switch (event.type) {
      case 'transfer_initiated':
        showStatus('Preparing Aptos transfer...');
        break;
      case 'transfer_signed':
        showStatus('Transaction signed with Aptos wallet');
        break;
      case 'transfer_submitted':
        showStatus('Submitting to Aptos network...');
        break;
      case 'transfer_confirmed':
        showStatus('✅ Aptos transfer completed!');
        break;
      case 'transfer_failed':
        showStatus('❌ Aptos transfer failed');
        break;
    }
  }
});
```

### Balance Checking

```typescript
const checkAptosBalances = async (address) => {
  try {
    // Get all token balances on Aptos
    const balances = await sdk.getBalance('aptos-testnet', address);
    
    console.log('Aptos token balances:');
    balances.forEach(balance => {
      const formatted = (parseInt(balance.balance) / Math.pow(10, balance.decimals)).toFixed(6);
      console.log(`${balance.symbol}: ${formatted}`);
    });

    // Get specific USDC balance
    const usdcBalance = await sdk.getBalance('aptos-testnet', address, 'USDC');
    if (usdcBalance.length > 0) {
      const usdcFormatted = (parseInt(usdcBalance[0].balance) / 1000000).toFixed(6);
      console.log('USDC balance:', usdcFormatted);
    }
  } catch (error) {
    console.error('Failed to check Aptos balances:', error);
  }
};
```

### Transaction Status

```typescript
const checkAptosTransaction = async (txHash) => {
  try {
    const status = await sdk.getTransactionStatus('aptos-testnet', txHash);
    console.log('Aptos transaction status:', status);
    
    if (status.executed) {
      console.log('✅ Aptos transaction confirmed');
    } else {
      console.log('⏳ Aptos transaction pending');
    }
  } catch (error) {
    console.error('Failed to check Aptos transaction:', error);
  }
};
```

## Aptos-Specific Features

### Move Contract Interaction

```typescript
// The SDK handles Move contract calls internally
// But you can access Aptos-specific features through the adapter
const aptosAdapter = sdk.getAdapter('aptos-testnet');

// Example: Call a custom Move function (if supported by your relayer)
const callMoveFunction = async () => {
  try {
    const result = await aptosAdapter.callMoveFunction(
      '0x1::coin::transfer',
      ['0x1::aptos_coin::AptosCoin', 'recipient_address', '1000000']
    );
    console.log('Move function result:', result);
  } catch (error) {
    console.error('Move function call failed:', error);
  }
};
```

### Gasless Transaction Benefits

```typescript
// Get Aptos safety stats (beta limits, etc.)
const getSafetyStats = async () => {
  try {
    const aptosAdapter = sdk.getAdapter('aptos-testnet');
    const stats = await aptosAdapter.getSafetyStats();
    console.log('Aptos safety statistics:', stats);
  } catch (error) {
    console.error('Failed to get safety stats:', error);
  }
};
```

## Error Handling

### Common Aptos Errors

```typescript
const handleAptosTransfer = async (request) => {
  try {
    const result = await sdk.transfer(request, wallet);
    return result;
  } catch (error) {
    switch (error.code) {
      case 'APTOS_INSUFFICIENT_BALANCE':
        alert('You don\'t have enough tokens for this Aptos transfer');
        break;
      case 'APTOS_WALLET_ERROR':
        alert('Aptos wallet error. Please try reconnecting.');
        break;
      case 'APTOS_NETWORK_ERROR':
        alert('Aptos network error. Please check your connection.');
        break;
      case 'APTOS_QUOTE_ERROR':
        alert('Unable to get Aptos transfer quote. Please try again.');
        break;
      case 'APTOS_UNSUPPORTED_TOKEN':
        alert(`Token ${request.token} is not supported on Aptos testnet`);
        break;
      default:
        alert(`Aptos transfer failed: ${error.message}`);
    }
    throw error;
  }
};
```

### Address Validation

```typescript
// Validate Aptos addresses
const validateAptosAddress = (address) => {
  const isValid = sdk.validateAddress(address, 'aptos-testnet');
  
  if (!isValid) {
    throw new Error('Invalid Aptos address format');
  }
  
  console.log('✅ Valid Aptos address');
  return true;
};

// Example usage
try {
  validateAptosAddress('0x1234567890abcdef1234567890abcdef12345678');
} catch (error) {
  console.error(error.message);
}
```

## Best Practices

1. **Always validate Aptos addresses** before transfers
2. **Check token balances** before attempting transfers
3. **Handle wallet connection errors** gracefully
4. **Use proper token decimals** (USDC: 6, APT: 8)
5. **Implement retry logic** for network resilience
6. **Monitor transaction events** for better UX
7. **Test with small amounts** on testnet first

## Testnet Resources

### Essential Links
- **Aptos Explorer**: https://explorer.aptoslabs.com/?network=testnet
- **APT Faucet**: https://aptoslabs.com/testnet-faucet
- **Petra Wallet**: https://petra.app/ (Chrome extension)
- **Martian Wallet**: https://martianwallet.xyz/ (Chrome extension)

### Getting Started
1. **Install Petra Wallet** from Chrome Web Store
2. **Create or import** an Aptos account
3. **Get test APT** from the official faucet
4. **Verify network** is set to "Testnet" in wallet
5. **Test connection** with the SDK examples above

### Network Configuration
- **Network**: Aptos Testnet
- **Chain ID**: 2
- **RPC URL**: https://fullnode.testnet.aptoslabs.com/v1
- **REST API**: https://fullnode.testnet.aptoslabs.com/v1

## Migration Notes

- Aptos uses different address formats than EVM chains
- Sequence numbers are used instead of nonces
- Move-based contracts have different interaction patterns
- Gas fees are paid in APT, but the SDK handles gasless transactions
- Transaction finality is typically faster than EVM chains
