# SmoothSend SDK

A powerful multi-chain SDK for seamless gasless transaction integration in your dApps. Currently supporting Avalanche and Aptos with a unified developer experience and dynamic configuration system.

## Key Features

- **Multi-Chain Ready**: Currently supporting Avalanche and Aptos, with architecture ready for additional chains
- **Gasless Transactions**: Users pay fees in tokens, not native gas
- **Dynamic Configuration**: Chain configurations fetched dynamically from relayers
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Event System**: Real-time transaction status updates
- **Unified API**: Consistent interface across all supported chains
- **Unified Signature Handling**: Automatic EIP-712 (EVM) and Ed25519 (Aptos) signature support
- **Batch Transfers**: Execute multiple transfers in a single transaction (Avalanche)
- **Improved Error Handling**: Enhanced error responses with specific error codes
- **Wallet Integration**: Easy integration with popular wallets

## What is SmoothSend?

SmoothSend SDK enables developers to integrate gasless transactions into their dApps, allowing users to pay transaction fees in tokens rather than native gas. This significantly improves user experience by removing the complexity of managing gas tokens across different chains.

## Supported Chains

| Chain Identifier | Network | Status | Features |
|------------------|---------|--------|----------|
| `avalanche` | Avalanche Fuji Testnet | Active | EIP-712 signatures, Batch transfers, Dynamic config |
| `aptos-testnet` | Aptos Testnet | Active | Ed25519 signatures, Move-based transactions, Dynamic config, Balance queries |

### Chain Identifier Usage

Use the exact chain identifiers shown above in your code:

```typescript
// Correct - Use these exact identifiers
const avalancheRequest = {
  chain: 'avalanche' as const,  // Not 'avalanche-fuji' or 'avalanche-testnet'
  // ... other fields
};

const aptosRequest = {
  chain: 'aptos-testnet' as const,  // Not 'aptos' or 'aptos-mainnet'
  // ... other fields
};

// Incorrect - These will cause "Chain not supported" errors
const wrongRequest = {
  chain: 'aptos',  // Should be 'aptos-testnet'
  // ... other fields
};
```

**Common Mistakes:**
- Using `'aptos'` instead of `'aptos-testnet'`
- Using `'avalanche-fuji'` instead of `'avalanche'`
- Using `'aptos-mainnet'` instead of `'aptos-testnet'`

## Quick Example

:::code-group
```typescript [EVM (Avalanche)]
import { SmoothSendSDK } from '@smoothsend/sdk';

// Initialize the SDK
const smoothSend = new SmoothSendSDK();

// Create a transfer request
const transferRequest = {
  from: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000', // 1 USDC (6 decimals) - always use smallest units!
  chain: 'avalanche' as const // Use exact chain identifier
};

// Execute transfer (with wallet signer)
try {
  const result = await smoothSend.transfer(transferRequest, walletSigner);
  console.log('Transfer successful:', result.txHash);
} catch (error) {
  console.error('Transfer failed:', error.message);
}
```

```typescript [Aptos]
import { SmoothSendSDK } from '@smoothsend/sdk';

// Initialize the SDK
const smoothSend = new SmoothSendSDK();

// Create a transfer request
const transferRequest = {
  from: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000', // 1 USDC (6 decimals) - always use smallest units!
  chain: 'aptos-testnet' as const // Use exact chain identifier
};

// Execute transfer (with wallet signer)
try {
  const result = await smoothSend.transfer(transferRequest, walletSigner);
  console.log('Transfer successful:', result.txHash);
} catch (error) {
  console.error('Transfer failed:', error.message);
}
```
:::

## Quick Reference

### Chain Identifiers
```typescript
// Use these exact identifiers
'avalanche'     // Avalanche Fuji Testnet
'aptos-testnet' // Aptos Testnet
```

### Amount Format
```typescript
// Wrong - Decimal format
amount: '0.5'

// Correct - Smallest token units
amount: '500000'  // 0.5 USDC (6 decimals)
```

### Simple Transfer Flow
```typescript
// Recommended - One method call
const result = await smoothSend.transfer(transferRequest, signer);

// Advanced - Step by step
const quote = await smoothSend.getQuote(transferRequest);
const result = await smoothSend.transfer(transferRequest, signer);
```

## Next Steps

- [Installation](./installation) - Get started with the SDK
- [Quick Start](./quick-start) - Your first gasless transaction
- [Integration Guide](./integration-guide) - Comprehensive integration guide with troubleshooting
- [API Reference](./api/) - Complete API documentation

## Links

- [NPM Package](https://www.npmjs.com/package/@smoothsend/sdk)
- [GitHub](https://github.com/smoothsend)
- [Discord Community](https://discord.gg/fF6cdJFWnM)
- [Twitter](https://x.com/smoothsend)
