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
  useDynamicConfig: true,        // Enable dynamic config (default)
  configCacheTtl: 300000,        // Cache TTL in ms (5 minutes)
  customChainConfigs: {
    avalanche: {
      relayerUrl: 'https://custom-relayer.com'
    }
  }
});
```

**Dynamic Configuration:**

The SDK automatically fetches chain configurations from relayer endpoints when `useDynamicConfig: true` (default). This provides:

- Up-to-date supported tokens
- Current relayer fees
- Live chain status
- Automatic failover to static config

**Configuration Sources:**
- **EVM chains**: `https://smoothsendevm.onrender.com`  
- **Aptos chains**: `https://smoothsendrelayerworking.onrender.com/api/v1/relayer`

**Fallback Behavior:**
If dynamic configuration fails, the SDK automatically falls back to static configuration to ensure reliability.

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

**Possible Errors:**
- `INSUFFICIENT_BALANCE` - User doesn't have enough tokens
- `UNSUPPORTED_TOKEN` - Token not supported on chain
- `INVALID_ADDRESS` - Invalid from/to address
- `NETWORK_ERROR` - Connection issue with relayer

### transfer()

Execute a complete gasless transfer. This is the **recommended method** as it handles the entire transaction flow automatically.

```typescript
transfer(request: TransferRequest, signer: any): Promise<TransferResult>
```

**Internal Flow:**
1. Calls `getQuote()` to validate and get fees
2. Calls `prepareTransfer()` to prepare signature data
3. Handles wallet signing (EIP-712 for EVM, Ed25519 for Aptos)
4. Calls `executeTransfer()` to submit to relayer
5. Returns final transaction result

#### Parameters

- `request`: Transfer request object (same as getQuote)
- `signer`: Chain-specific signer instance
  - **EVM chains (Avalanche)**: Ethers.js signer instance that supports EIP-712 signatures
  - **Aptos chains**: Aptos-compatible signer (e.g., from Petra wallet) that supports Ed25519 signatures and provides `publicKey()` method

**Aptos Signature Handling:**

The SDK includes signature validation and verification for Aptos transactions:

- **Signature validation**: All Aptos signatures are validated for proper hex format
- **Public key requirement**: Aptos transactions require the signer's public key for verification
- **Error handling**: Detailed error messages for signature and public key validation failures
- **Backward compatibility**: Supports public key in multiple locations within signed data

**Unified Signature Handling:**

The SDK automatically detects the chain ecosystem and uses the appropriate signing method:
- **EVM chains**: Uses EIP-712 typed data signing via `signer.signTypedData()`
- **Aptos chains**: Uses Ed25519 transaction signing via `signer.signTransaction()` and requires `signer.publicKey()`

**Aptos Signature Requirements:**
- Signature must be a valid hex string (with or without '0x' prefix)
- Public key must be provided and in valid hex format
- Signer must implement both `signTransaction()` and `publicKey()` methods

No chain-specific logic is required in your application code - the SDK handles all signing differences internally.

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

**Possible Errors:**
- `SIGNATURE_REJECTED` - User cancelled transaction
- `INSUFFICIENT_BALANCE` - Not enough tokens
- `TRANSACTION_FAILED` - Transaction failed on chain
- `RELAYER_ERROR` - Relayer service error

### prepareTransfer()

Prepare signature data for wallet signing. Used internally by `transfer()` but available for advanced use cases.

```typescript
prepareTransfer(request: TransferRequest, quote: TransferQuote): Promise<SignatureData>
```

**When to use:**
- Building custom transaction flows
- Implementing custom signing logic
- Debugging signature issues

**Example:**
```typescript
const quote = await smoothSend.getQuote(transferRequest);
const signatureData = await smoothSend.prepareTransfer(transferRequest, quote);

// For EVM chains (Avalanche)
const signature = await signer.signTypedData(
  signatureData.domain,
  signatureData.types,
  signatureData.message
);

// For Aptos chains
const signedTransaction = await signer.signTransaction(signatureData.message);
```

### executeTransfer()

Execute a pre-signed transfer. Used internally by `transfer()` but available for advanced use cases.

```typescript
executeTransfer(signedData: SignedTransferData, chain: SupportedChain): Promise<TransferResult>
```

**When to use:**
- Custom signature handling
- Batch processing
- Integration with custom wallet implementations

**Example:**
```typescript
const signedData = {
  signature: '0x...',
  transferData: { /* transfer data */ },
  signatureType: 'EIP712' as const
};

const result = await smoothSend.executeTransfer(signedData, 'avalanche');
```

**Aptos-Specific Errors:**
- `APTOS_MISSING_SIGNATURE` - Signature is required for Aptos transactions
- `APTOS_MISSING_PUBLIC_KEY` - Public key is required for Aptos signature verification
- `APTOS_INVALID_SIGNATURE_FORMAT` - Invalid signature format (must be hex string)
- `APTOS_INVALID_PUBLIC_KEY_FORMAT` - Invalid public key format (must be hex string)
- `APTOS_ADDRESS_MISMATCH` - Public key doesn't match the expected address
- `APTOS_SIGNATURE_VERIFICATION_FAILED` - Signature verification failed on relayer

### batchTransfer()

Execute multiple transfers efficiently. Native batch support varies by chain.

```typescript
batchTransfer(request: BatchTransferRequest, signer: any): Promise<TransferResult[]>
```

**Chain Support:**
- **Avalanche**: Native batch transfers in a single transaction
- **Aptos**: Sequential execution (fallback behavior)

**Signature Handling:**

The SDK uses a unified approach that automatically handles chain-specific signing and transaction formatting:
- **EVM chains**: EIP-712 typed data signatures
- **Aptos chains**: Ed25519 transaction signatures with validation

**Aptos Batch Transfer Requirements:**
- Each transfer requires the same signature validation as single transfers
- Public key must be provided for all Aptos batch operations
- Error reporting for each transfer in the batch

The signing process is abstracted away from your application code.

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

Get token balances for an address. **Note**: This method is only available for chains that support balance queries (currently Aptos chains only).

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
}
```

#### Example

```typescript
// Get all balances (Aptos chains only)
const balances = await smoothSend.getBalance('aptos-testnet', '0x742d35cc...');

// Get specific token balance
const usdcBalance = await smoothSend.getBalance('aptos-testnet', '0x742d35cc...', 'USDC');
```

**Supported Chains:**
- Aptos chains (aptos-testnet) - Supported
- EVM chains (avalanche) - Balance functionality not available

**Error Handling:**
If you call this method on an unsupported chain, it will throw a `BALANCE_NOT_SUPPORTED` error.

**Supported Tokens by Chain:**

**Avalanche Fuji:**
- USDC (6 decimals)
- USDT (6 decimals) 
- AVAX (18 decimals)

**Aptos Testnet:**
- APT (8 decimals)
- USDC (6 decimals)

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

Get list of supported chains from initialized adapters.

```typescript
getSupportedChains(): Promise<SupportedChain[]>
```

**Note:** This method returns chains that are actually initialized and available. For a static list of all potentially supported chains, use `SmoothSendSDK.getSupportedChains()`.

#### Example

```typescript
// Instance method - returns initialized chains
const chains = await smoothSend.getSupportedChains();
console.log('Available chains:', chains); // ['avalanche', 'aptos-testnet']

// Static method - returns all potential chains
const allChains = SmoothSendSDK.getSupportedChains();
console.log('All supported chains:', allChains); // ['avalanche', 'aptos-testnet']
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
- `BALANCE_NOT_SUPPORTED` - Balance functionality not available for this chain
- `UNSUPPORTED_CHAIN_ECOSYSTEM` - Chain ecosystem not supported

### Aptos-Specific Error Codes

Error handling for Aptos transactions includes detailed validation errors:

**Signature Validation Errors:**
- `APTOS_MISSING_SIGNATURE` - Signature is required for Aptos transactions
- `APTOS_MISSING_PUBLIC_KEY` - Public key is required for signature verification
- `APTOS_INVALID_SIGNATURE_FORMAT` - Invalid signature format (must be hex string)
- `APTOS_INVALID_PUBLIC_KEY_FORMAT` - Invalid public key format (must be hex string)
- `APTOS_ADDRESS_MISMATCH` - Public key doesn't match the expected address
- `APTOS_SIGNATURE_VERIFICATION_FAILED` - Signature verification failed

**Transaction Errors:**
- `APTOS_MISSING_TRANSACTION_DATA` - Missing transaction data from quote
- `APTOS_INVALID_TRANSACTION_FORMAT` - Invalid transaction format

**Address Validation Errors:**
- `APTOS_EMPTY_ADDRESS` - Address cannot be empty
- `APTOS_INVALID_ADDRESS_FORMAT` - Invalid Aptos address format

**General Aptos Errors:**
- `APTOS_QUOTE_ERROR` - Failed to get quote from Aptos relayer
- `APTOS_EXECUTE_ERROR` - Failed to execute Aptos transfer
- `APTOS_BALANCE_ERROR` - Failed to get balance information
- `APTOS_TOKEN_INFO_ERROR` - Failed to get token information
- `APTOS_STATUS_ERROR` - Failed to get transaction status
- `APTOS_MOVE_CALL_ERROR` - Failed to call Move function
- `APTOS_UNSUPPORTED_TOKEN` - Token not supported on Aptos chain

### Example Error Handling

```typescript
try {
  const result = await smoothSend.transfer(request, signer);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('Not enough tokens');
  } else if (error.code === 'SIGNATURE_REJECTED') {
    console.error('User cancelled transaction');
  } else if (error.code === 'APTOS_MISSING_PUBLIC_KEY') {
    console.error('Aptos signer must provide public key via publicKey() method');
  } else if (error.code === 'APTOS_INVALID_SIGNATURE_FORMAT') {
    console.error('Invalid signature format - must be hex string');
  } else if (error.code === 'APTOS_SIGNATURE_VERIFICATION_FAILED') {
    console.error('Signature verification failed on relayer');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

**Aptos Error Handling:**

For Aptos transactions, the SDK provides detailed validation and error messages:

```typescript
// Example: Handling Aptos-specific errors
try {
  const result = await smoothSend.transfer({
    from: userAddress,
    to: recipientAddress,
    token: 'APT',
    amount: '1000000',
    chain: 'aptos-testnet'
  }, aptosSigner);
} catch (error) {
  switch (error.code) {
    case 'APTOS_MISSING_PUBLIC_KEY':
      console.error('Signer must implement publicKey() method');
      break;
    case 'APTOS_INVALID_PUBLIC_KEY_FORMAT':
      console.error('Public key must be a valid hex string');
      break;
    case 'APTOS_INVALID_SIGNATURE_FORMAT':
      console.error('Signature must be a valid hex string');
      break;
    case 'APTOS_ADDRESS_MISMATCH':
      console.error('Public key does not match the sender address');
      break;
    default:
      console.error('Aptos transfer failed:', error.message);
  }
}
```

## Type Definitions

See [Types Reference](./types) for complete type definitions.
