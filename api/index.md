# API Reference

Complete reference for the SmoothSend SDK API.

## SmoothSendSDK Class

The main SDK class that provides all functionality for gasless transactions.

### Constructor

```typescript
new SmoothSendSDK(config?: SmoothSendConfig)
```

#### Parameters

- `config` (optional): Configuration object

```typescript
interface SmoothSendConfig {
  timeout?: number;           // Request timeout in ms (default: 30000)
  retries?: number;           // Number of retry attempts (default: 3)
  useDynamicConfig?: boolean; // Use dynamic config fetching (default: true)
  configCacheTtl?: number;    // Config cache TTL in ms (default: 300000)
  relayerUrls?: {
    evm?: string;             // Custom EVM relayer URL
    aptos?: string;           // Custom Aptos relayer URL
  };
  customChainConfigs?: Partial<Record<SupportedChain, Partial<ChainConfig>>>;
}
```

#### Example

```typescript
const smoothSend = new SmoothSendSDK({
  timeout: 30000,
  retries: 3,
  customChainConfigs: {
    avalanche: {
      relayerUrl: 'https://custom-relayer.com'
    }
  }
});
```

## Core Methods

### getQuote()

Get a quote for a transfer including fees and gas estimates.

```typescript
getQuote(request: TransferRequest): Promise<TransferQuote>
```

#### Parameters

```typescript
interface TransferRequest {
  from: string;           // Sender address
  to: string;             // Recipient address
  token: string;          // Token symbol or contract address
  amount: string;         // Amount in smallest unit (wei, etc.)
  chain: SupportedChain;  // Target chain
}
```

#### Returns

```typescript
interface TransferQuote {
  amount: string;         // Transfer amount
  relayerFee: string;     // Fee charged by relayer
  total: string;          // Total amount (amount + fee)
  feePercentage: number;  // Fee as percentage
  contractAddress: string; // Token contract address
}
```

#### Example

```typescript
const quote = await smoothSend.getQuote({
  from: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000',
  chain: 'avalanche'
});

console.log('Fee:', quote.relayerFee);
console.log('Total:', quote.total);
```

### transfer()

Execute a complete gasless transfer.

```typescript
transfer(request: TransferRequest, signer: any): Promise<TransferResult>
```

#### Parameters

- `request`: Transfer request object (same as getQuote)
- `signer`: Ethers.js signer instance for signing transactions

#### Returns

```typescript
interface TransferResult {
  success: boolean;       // Whether transfer succeeded
  txHash: string;         // Transaction hash
  blockNumber?: number;   // Block number (if available)
  gasUsed?: string;       // Gas used (if available)
  transferId?: string;    // Internal transfer ID
  explorerUrl?: string;   // Block explorer URL
  fee?: string;          // Actual fee paid
  executionTime?: number; // Execution time in ms
}
```

#### Example

```typescript
const result = await smoothSend.transfer({
  from: await signer.getAddress(),
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000',
  chain: 'avalanche'
}, signer);

console.log('Transaction:', result.txHash);
console.log('Explorer:', result.explorerUrl);
```

### batchTransfer()

Execute multiple transfers in a single transaction (Avalanche only).

```typescript
batchTransfer(request: BatchTransferRequest, signer: any): Promise<TransferResult[]>
```

#### Parameters

```typescript
interface BatchTransferRequest {
  transfers: TransferRequest[];
  chain: SupportedChain;
}
```

#### Example

```typescript
const results = await smoothSend.batchTransfer({
  transfers: [
    {
      from: userAddress,
      to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
      token: 'USDC',
      amount: '1000000',
      chain: 'avalanche'
    },
    {
      from: userAddress,
      to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d4',
      token: 'USDT',
      amount: '2000000',
      chain: 'avalanche'
    }
  ],
  chain: 'avalanche'
}, signer);

console.log(`Executed ${results.length} transfers`);
```

## Utility Methods

### getBalance()

Get token balances for an address.

```typescript
getBalance(chain: SupportedChain, address: string, token?: string): Promise<TokenBalance[]>
```

#### Parameters

- `chain`: Target chain
- `address`: Wallet address to check
- `token` (optional): Specific token symbol to check

#### Returns

```typescript
interface TokenBalance {
  token: string;          // Token symbol
  balance: string;        // Balance in smallest unit
  decimals: number;       // Token decimals
  symbol: string;         // Token symbol
  name: string;          // Token name
  contractAddress: string; // Token contract address
}
```

#### Example

```typescript
// Get all balances
const balances = await smoothSend.getBalance('avalanche', '0x742d35cc...');

// Get specific token balance
const usdcBalance = await smoothSend.getBalance('avalanche', '0x742d35cc...', 'USDC');
```

### validateAddress()

Validate an address format for a specific chain.

```typescript
validateAddress(chain: SupportedChain, address: string): boolean
```

#### Example

```typescript
const isValid = smoothSend.validateAddress('avalanche', '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2');
console.log('Valid address:', isValid); // true
```

### getSupportedChains()

Get list of supported chains.

```typescript
getSupportedChains(): SupportedChain[]
```

#### Example

```typescript
const chains = smoothSend.getSupportedChains();
console.log('Supported chains:', chains); // ['avalanche', 'aptos-testnet']
```

### getChainConfig()

Get static chain configuration.

```typescript
getChainConfig(chain: SupportedChain): ChainConfig
```

#### Returns

```typescript
interface ChainConfig {
  name: string;           // Chain identifier
  displayName: string;    // Human-readable name
  chainId: number;        // Network chain ID
  rpcUrl: string;         // RPC endpoint
  relayerUrl: string;     // Relayer service URL
  explorerUrl: string;    // Block explorer URL
  tokens: string[];       // Supported tokens
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
```

#### Example

```typescript
const config = smoothSend.getChainConfig('avalanche');
console.log('Chain ID:', config.chainId);
console.log('Relayer URL:', config.relayerUrl);
```

## Event System

### addEventListener()

Listen to transfer events for real-time updates.

```typescript
addEventListener(listener: EventListener): void
```

#### Event Types

```typescript
interface TransferEvent {
  type: 'transfer_initiated' | 'transfer_signed' | 'transfer_submitted' | 
        'transfer_confirmed' | 'transfer_failed';
  data: any;
  timestamp: number;
}
```

#### Example

```typescript
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
```

### removeEventListener()

Remove an event listener.

```typescript
removeEventListener(listener: EventListener): void
```

## Health and Status Methods

### getRelayerHealth()

Check relayer service health.

```typescript
getRelayerHealth(chain: SupportedChain): Promise<HealthResponse>
```

#### Returns

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  chainId: number;
  blockNumber: number;
}
```

### getTransferStatus()

Get status of a specific transfer.

```typescript
getTransferStatus(transferId: string, chain: SupportedChain): Promise<TransferStatusResponse>
```

#### Returns

```typescript
interface TransferStatusResponse {
  transferId: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  fee?: string;
  createdAt: string;
  confirmedAt?: string;
}
```

## Static Utility Functions

These functions can be imported directly without instantiating the SDK.

### getChainConfig()

```typescript
import { getChainConfig } from '@smoothsend/sdk';

const config = getChainConfig('avalanche');
```

### getAllChainConfigs()

```typescript
import { getAllChainConfigs } from '@smoothsend/sdk';

const allConfigs = getAllChainConfigs();
```

### getTokenDecimals()

```typescript
import { getTokenDecimals } from '@smoothsend/sdk';

const decimals = getTokenDecimals('USDC'); // 6
```

## Error Handling

All methods can throw `SmoothSendError` with specific error codes:

```typescript
interface SmoothSendError extends Error {
  code: string;
  details?: any;
}
```

### Common Error Codes

- `INSUFFICIENT_BALANCE` - User doesn't have enough tokens
- `INVALID_ADDRESS` - Invalid wallet address format
- `UNSUPPORTED_TOKEN` - Token not supported on chain
- `NETWORK_ERROR` - Connection or network issue
- `RELAYER_ERROR` - Relayer service error
- `SIGNATURE_REJECTED` - User rejected signature
- `TRANSACTION_FAILED` - Transaction failed on chain

### Example Error Handling

```typescript
try {
  const result = await smoothSend.transfer(request, signer);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('Not enough tokens');
  } else if (error.code === 'SIGNATURE_REJECTED') {
    console.error('User cancelled transaction');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Type Definitions

See [Types Reference](./types) for complete type definitions.
