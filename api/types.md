# Type Definitions

Complete TypeScript type definitions for the SmoothSend SDK.

## Core Types

### SupportedChain

```typescript
type SupportedChain = 'avalanche' | 'aptos-testnet';
```

Currently supported blockchain networks:
- `avalanche`: Avalanche Fuji Testnet (EVM-compatible)
- `aptos-testnet`: Aptos Testnet (Move-based blockchain)

### ChainEcosystem

```typescript
type ChainEcosystem = 'evm' | 'aptos';
```

Chain ecosystem types for routing to correct relayers.

### ChainConfig

```typescript
interface ChainConfig {
  name: string;           // Chain identifier
  displayName: string;    // Human-readable name
  chainId: number;        // Network chain ID
  rpcUrl: string;         // RPC endpoint URL
  relayerUrl: string;     // Relayer service URL
  explorerUrl: string;    // Block explorer URL
  tokens: string[];       // Supported token symbols
  nativeCurrency: {
    name: string;         // Native currency name
    symbol: string;       // Native currency symbol
    decimals: number;     // Native currency decimals
  };
}
```

## Transfer Types

### TransferRequest

```typescript
interface TransferRequest {
  from: string;           // Sender wallet address
  to: string;             // Recipient wallet address
  token: string;          // Token symbol (e.g., 'USDC') or contract address
  amount: string;         // Amount in smallest unit (e.g., wei, satoshi)
  chain: SupportedChain;  // Target blockchain
}
```

### TransferQuote

```typescript
interface TransferQuote {
  amount: string;         // Original transfer amount
  relayerFee: string;     // Fee charged by relayer
  total: string;          // Total amount (amount + fee)
  feePercentage: number;  // Fee as percentage (e.g., 2.5)
  contractAddress: string; // Token contract address
  aptosTransactionData?: any; // Aptos-specific transaction data
}
```

### TransferResult

```typescript
interface TransferResult {
  success: boolean;       // Whether transfer succeeded
  txHash: string;         // Blockchain transaction hash
  blockNumber?: number;   // Block number where tx was included
  gasUsed?: string;       // Gas consumed by transaction
  transferId?: string;    // Internal transfer tracking ID
  explorerUrl?: string;   // Block explorer URL for transaction
  fee?: string;          // Actual fee paid
  executionTime?: number; // Total execution time in milliseconds
}
```

### BatchTransferRequest

```typescript
interface BatchTransferRequest {
  transfers: TransferRequest[]; // Array of transfer requests
  chain: SupportedChain;       // Target chain (must be same for all)
}
```

## Configuration Types

### SmoothSendConfig

```typescript
interface SmoothSendConfig {
  timeout?: number;           // Request timeout in milliseconds
  retries?: number;           // Number of retry attempts
  useDynamicConfig?: boolean; // Enable dynamic config fetching
  configCacheTtl?: number;    // Config cache TTL in milliseconds
  relayerUrls?: {
    evm?: string;             // Custom EVM relayer URL
    aptos?: string;           // Custom Aptos relayer URL
  };
  customChainConfigs?: Partial<Record<SupportedChain, Partial<ChainConfig>>>;
}
```

## Token and Balance Types

### TokenInfo

```typescript
interface TokenInfo {
  symbol: string;         // Token symbol (e.g., 'USDC')
  address: string;        // Contract address
  decimals: number;       // Token decimals
  name: string;          // Full token name
}
```

### TokenBalance

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

## Response Types

### SuccessResponse

```typescript
interface SuccessResponse {
  success: true;
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  success: false;
  error: string;          // Error message
  details?: string[];     // Additional error details
  requestId?: string;     // Request tracking ID
}
```

### TransferQuoteResponse

```typescript
interface TransferQuoteResponse extends SuccessResponse {
  chainName: string;      // Chain name
  token: string;          // Token symbol
  amount: string;         // Transfer amount
  relayerFee: string;     // Relayer fee
  total: string;          // Total amount
  feePercentage: number;  // Fee percentage
  contractAddress: string; // Token contract
}
```

### RelayTransferResponse

```typescript
interface RelayTransferResponse extends SuccessResponse {
  transferId: string;     // Transfer tracking ID
  txHash: string;         // Transaction hash
  blockNumber: number;    // Block number
  gasUsed: string;        // Gas consumed
  explorerUrl: string;    // Explorer URL
  fee: string;           // Fee paid
  executionTime: number;  // Execution time in ms
}
```

## Event Types

### TransferEvent

```typescript
interface TransferEvent {
  type: 'transfer_initiated' | 'transfer_signed' | 'transfer_submitted' | 
        'transfer_confirmed' | 'transfer_failed';
  data: any;              // Event-specific data
  timestamp: number;      // Event timestamp
}
```

### EventListener

```typescript
type EventListener = (event: TransferEvent) => void;
```

## Health and Status Types

### HealthResponse

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;        // Service version
  uptime: number;         // Service uptime in seconds
  chainId: number;        // Connected chain ID
  blockNumber: number;    // Latest block number
}
```

### TransferStatusResponse

```typescript
interface TransferStatusResponse {
  transferId: string;     // Transfer ID
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;        // Transaction hash (if available)
  blockNumber?: number;   // Block number (if confirmed)
  gasUsed?: string;       // Gas used (if confirmed)
  fee?: string;          // Fee paid (if confirmed)
  createdAt: string;      // Creation timestamp
  confirmedAt?: string;   // Confirmation timestamp
}
```

### GasEstimateResponse

```typescript
interface GasEstimateResponse {
  gasLimit: string;       // Estimated gas limit
  gasPrice: string;       // Current gas price
  estimatedCost: string;  // Estimated cost in native currency
}
```

### DomainSeparatorResponse

```typescript
interface DomainSeparatorResponse {
  domainSeparator: string; // EIP-712 domain separator
  chainId: number;         // Chain ID
  contractAddress: string; // Contract address
}
```

## Error Types

### SmoothSendError

```typescript
interface SmoothSendError extends Error {
  code: string;           // Error code
  details?: any;          // Additional error details
}
```

### Common Error Codes

```typescript
type ErrorCode = 
  | 'INSUFFICIENT_BALANCE'    // User doesn't have enough tokens
  | 'INVALID_ADDRESS'         // Invalid wallet address format
  | 'UNSUPPORTED_TOKEN'       // Token not supported on chain
  | 'NETWORK_ERROR'           // Connection or network issue
  | 'RELAYER_ERROR'           // Relayer service error
  | 'SIGNATURE_REJECTED'      // User rejected signature
  | 'TRANSACTION_FAILED'      // Transaction failed on chain
  | 'INVALID_AMOUNT'          // Invalid amount format
  | 'CHAIN_NOT_SUPPORTED'     // Chain not supported
  | 'TIMEOUT_ERROR'           // Request timed out
  | 'CONFIGURATION_ERROR';    // Configuration issue
```

## Signature Types

### SignatureData

```typescript
interface SignatureData {
  signature: string;      // Hex-encoded signature
  messageHash: string;    // Hash of signed message
  signer: string;        // Signer address
}
```

### SignedTransferData

```typescript
interface SignedTransferData {
  request: TransferRequest; // Original transfer request
  signature: SignatureData; // Signature data
  nonce: string;           // Transaction nonce
  deadline: number;        // Signature deadline
}
```

## Chain Information Types

### ChainInfo

```typescript
interface ChainInfo {
  name: string;           // Chain identifier
  displayName: string;    // Human-readable name
  chainId: number;        // Network chain ID
  explorerUrl: string;    // Block explorer URL
  tokens: string[];       // Supported token symbols
}
```

## Dynamic Configuration Types

### DynamicChainConfig

```typescript
interface DynamicChainConfig {
  name: string;           // Chain name
  displayName: string;    // Display name
  chainId: number;        // Chain ID
  rpcUrl: string;         // RPC URL
  explorerUrl: string;    // Explorer URL
  tokens: TokenInfo[];    // Supported tokens with full info
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  relayerConfig: {
    feePercentage: number; // Default fee percentage
    minFee: string;        // Minimum fee amount
    maxFee: string;        // Maximum fee amount
  };
}
```

## Chain Adapter Interface

### IChainAdapter

```typescript
interface IChainAdapter {
  getQuote(request: TransferRequest): Promise<TransferQuote>;
  transfer(request: TransferRequest, signer: any): Promise<TransferResult>;
  getBalance(address: string, token?: string): Promise<TokenBalance[]>;
  validateAddress(address: string): boolean;
  getChainInfo(): ChainInfo;
}
```

## Constants

### Chain Ecosystem Mapping

```typescript
const CHAIN_ECOSYSTEM_MAP: Record<SupportedChain, ChainEcosystem> = {
  'avalanche': 'evm',
  'aptos-testnet': 'aptos'
};
```

### Token Decimals

```typescript
const TOKEN_DECIMALS: Record<string, number> = {
  'USDC': 6,
  'USDT': 6,
  'AVAX': 18,
  // ... other tokens
};
```

## Usage Examples

### Type Guards

```typescript
function isSuccessResponse(response: any): response is SuccessResponse {
  return response.success === true;
}

function isErrorResponse(response: any): response is ErrorResponse {
  return response.success === false;
}
```

### Type Assertions

```typescript
// Ensure type safety when working with responses
const response = await api.getQuote(request);
if (isSuccessResponse(response)) {
  // TypeScript knows this is a success response
  console.log('Quote:', response.amount);
} else {
  // TypeScript knows this is an error response
  console.error('Error:', response.error);
}
```

### Generic Types

```typescript
// For custom implementations
interface CustomTransferRequest<T = any> extends TransferRequest {
  metadata?: T;
}

// Usage
const customRequest: CustomTransferRequest<{ userId: string }> = {
  from: '0x...',
  to: '0x...',
  token: 'USDC',
  amount: '1000000',
  chain: 'avalanche',
  metadata: { userId: 'user123' }
};
```
