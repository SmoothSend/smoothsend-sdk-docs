# API Reference

## SmoothSendSDK Class

The main SDK class that provides a unified interface for gasless transactions. Currently supports Avalanche with architecture ready for additional chains.

### Constructor

```typescript
new SmoothSendSDK(config?: SmoothSendConfig)
```

**Parameters:**
- `config` (optional): Configuration object

```typescript
interface SmoothSendConfig {
  timeout?: number;          // Request timeout in ms (default: 30000)
  retries?: number;          // Max retries for failed requests (default: 3)
  customChainConfigs?: Partial<Record<SupportedChain, Partial<ChainConfig>>>;
  useDynamicConfig?: boolean; // Enable fetching config from relayers (default: true)
  configCacheTtl?: number;   // Cache TTL in milliseconds (default: 5 minutes)
}
```

**Example:**
```typescript
const sdk = new SmoothSendSDK({
  timeout: 45000,
  retries: 5,
  customChainConfigs: {
    avalanche: {
      relayerUrl: 'https://custom-avax-relayer.com'
    }
  }
});
```

## Core Methods

### getQuote()

Get a quote for a gasless transfer including fees and estimates.

```typescript
async getQuote(request: TransferRequest): Promise<TransferQuote>
```

**Parameters:**
```typescript
interface TransferRequest {
  from: string;           // Sender address
  to: string;             // Recipient address  
  token: string;          // Token symbol (e.g., 'USDC', 'AVAX')
  amount: string;         // Amount in smallest unit (wei for EVM chains)
  chain: SupportedChain;  // 'avalanche'
}
```

**Returns:**
```typescript
interface TransferQuote {
  amount: string;         // Original transfer amount
  relayerFee: string;     // Fee charged by relayer
  total: string;          // Total amount (amount + fee)
  feePercentage: number;  // Fee as percentage
  contractAddress: string; // Contract address for the transfer
}

// OpenAPI Response Type
interface TransferQuoteResponse extends SuccessResponse {
  chainName: string;
  token: string;
  amount: string;
  relayerFee: string;
  total: string;
  feePercentage: number;
  contractAddress: string;
}
```

**Example:**
```typescript
const quote = await sdk.getQuote({
  from: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: '1000000', // 1 USDC (6 decimals)
  chain: 'avalanche'
});

console.log('Fee:', quote.relayerFee);
console.log('Total cost:', quote.total);
```

### prepareTransfer()

Prepare EIP-712 signature data for a transfer.

```typescript
async prepareTransfer(request: TransferRequest, quote: TransferQuote): Promise<SignatureData>
```

**Parameters:**
- `request`: Transfer request object
- `quote`: Transfer quote from getQuote()

**Returns:**
```typescript
interface SignatureData {
  domain: any;           // EIP-712 domain
  types: any;            // EIP-712 types
  message: any;          // EIP-712 message
  primaryType: string;   // Primary type for signing
}

// OpenAPI Response Type
interface PrepareSignatureResponse extends SuccessResponse {
  typedData: any;        // EIP-712 typed data
  messageHash: string;   // Hash of the message to be signed
  message: string;       // Human-readable message
}
```

**Example:**
```typescript
const quote = await sdk.getQuote(request);
const signatureData = await sdk.prepareTransfer(request, quote);
const signature = await signer.signTypedData(
  signatureData.domain,
  signatureData.types,
  signatureData.message
);
```

### transfer()

Execute a complete gasless transfer flow: quote → prepare → sign → execute.

```typescript
async transfer(request: TransferRequest, signer: any): Promise<TransferResult>
```

**Parameters:**
- `request`: Transfer request object
- `signer`: Wallet signer (ethers.Signer for Avalanche)

**Returns:**
```typescript
interface TransferResult {
  success: boolean;
  txHash: string;         // Transaction hash
  blockNumber?: number;   // Block number where tx was mined
  gasUsed?: string;       // Gas consumed
  transferId?: string;    // Internal transfer ID
  explorerUrl?: string;   // Blockchain explorer URL
  fee?: string;           // Actual relayer fee charged
  executionTime?: number; // Execution time in milliseconds
}

// OpenAPI Response Type
interface RelayTransferResponse extends SuccessResponse {
  transferId: string;
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  explorerUrl: string;
  fee: string;
  executionTime: number;
}
```

**Example (Avalanche):**
```typescript
import { ethers } from 'ethers';
import { getTokenDecimals } from '@smoothsend/sdk';

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Get proper decimals for the token
const usdcDecimals = getTokenDecimals('USDC');

const result = await sdk.transfer({
  from: await signer.getAddress(),
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: ethers.parseUnits('10', usdcDecimals).toString(),
  chain: 'avalanche'
}, signer);

console.log('Transaction:', result.txHash);
console.log('Explorer:', result.explorerUrl);
```

### batchTransfer()

Execute multiple transfers in a single transaction (Avalanche only).

```typescript
async batchTransfer(request: BatchTransferRequest, signer: any): Promise<TransferResult[]>
```

**Parameters:**
```typescript
interface BatchTransferRequest {
  transfers: TransferRequest[];
  chain: SupportedChain; // Must be 'avalanche'
}
```

**Example:**
```typescript
const results = await sdk.batchTransfer({
  transfers: [
    { from: address, to: recipient1, token: 'USDC', amount: '1000000', chain: 'avalanche' },
    { from: address, to: recipient2, token: 'USDT', amount: '2000000', chain: 'avalanche' }
  ],
  chain: 'avalanche'
}, signer);

console.log('Batch results:', results.map(r => r.txHash));
```

## Utility Methods

### getBalance()

Get token balances for an address.

```typescript
async getBalance(chain: SupportedChain, address: string, token?: string): Promise<TokenBalance[]>
```

**Returns:**
```typescript
interface TokenBalance {
  token: string;      // Token contract address or identifier
  balance: string;    // Balance in smallest unit
  decimals: number;   // Token decimals
  symbol: string;     // Token symbol
  name?: string;      // Token name
}
```

**Example:**
```typescript
// Get all balances
const balances = await sdk.getBalance('avalanche', '0x...');

// Get specific token balance
const usdcBalance = await sdk.getBalance('avalanche', '0x...', 'USDC');
```

### validateAddress()

Validate an address format for a specific chain.

```typescript
validateAddress(chain: SupportedChain, address: string): boolean
```

**Example:**
```typescript
const isValid = sdk.validateAddress('avalanche', '0x742d35...');
console.log('Valid address:', isValid); // true
```

### validateAmount()

Validate if an amount is valid for a token.

```typescript
async validateAmount(chain: SupportedChain, amount: string, token: string): Promise<boolean>
```

### getNonce()

Get the current nonce for an address.

```typescript
async getNonce(chain: SupportedChain, address: string): Promise<string>
```

### getTransactionStatus()

Get the status of a transaction.

```typescript
async getTransactionStatus(chain: SupportedChain, txHash: string): Promise<any>
```

## OpenAPI-Aligned Endpoint Methods

### getHealth()

Check if the relayer service is running and healthy.

```typescript
async getHealth(): Promise<HealthResponse>
```

**Returns:**
```typescript
interface HealthResponse extends SuccessResponse {
  status: string;        // 'healthy'
  timestamp: string;     // ISO timestamp
  version: string;       // Service version
}
```

**Example:**
```typescript
const health = await sdk.getHealth();
console.log('Service status:', health.status);
console.log('Version:', health.version);
```

### getSupportedChainsInfo()

Get supported blockchain networks with their configuration details.

```typescript
async getSupportedChainsInfo(): Promise<ChainInfo[]>
```

**Returns:**
```typescript
interface ChainInfo {
  name: string;          // Internal chain name
  displayName: string;   // Human-readable name
  chainId: number;       // EVM chain ID
  explorerUrl: string;   // Block explorer URL
  tokens: string[];      // Supported token symbols
}
```

**Example:**
```typescript
const chains = await sdk.getSupportedChainsInfo();
chains.forEach(chain => {
  console.log(`${chain.displayName} (${chain.name}): ${chain.tokens.join(', ')}`);
});
```

### getSupportedTokensForChain()

Get supported tokens for a specific chain.

```typescript
async getSupportedTokensForChain(chainName: string): Promise<TokenInfo[]>
```

**Parameters:**
- `chainName`: Blockchain network name (e.g., 'avalanche-fuji')

**Returns:**
```typescript
interface TokenInfo {
  symbol: string;        // Token symbol (e.g., 'USDC')
  address: string;       // Token contract address
  decimals: number;      // Token decimals
  name: string;          // Token name
}
```

**Example:**
```typescript
const tokens = await sdk.getSupportedTokensForChain('avalanche-fuji');
tokens.forEach(token => {
  console.log(`${token.name} (${token.symbol}): ${token.address}`);
});
```

### estimateGas()

Estimate gas cost for single or batch transfers.

```typescript
async estimateGas(chainName: string, transfers: any[]): Promise<GasEstimateResponse>
```

**Parameters:**
- `chainName`: Blockchain network name
- `transfers`: Array of transfer data objects

**Returns:**
```typescript
interface GasEstimateResponse extends SuccessResponse {
  chainName: string;     // Chain name
  gasEstimate: string;   // Estimated gas units
  gasPrice: string;      // Current gas price in wei
  estimatedCost: string; // Estimated transaction cost in native token wei
  transferCount: number; // Number of transfers in the batch
}
```

**Example:**
```typescript
const estimate = await sdk.estimateGas('avalanche-fuji', [transferData]);
console.log(`Estimated gas: ${estimate.gasEstimate}`);
console.log(`Estimated cost: ${estimate.estimatedCost} wei`);
```

### getDomainSeparator()

Get EIP-712 domain separator for a specific chain.

```typescript
async getDomainSeparator(chainName: string): Promise<DomainSeparatorResponse>
```

**Parameters:**
- `chainName`: Blockchain network name

**Returns:**
```typescript
interface DomainSeparatorResponse extends SuccessResponse {
  chainName: string;     // Chain name
  domainSeparator: string; // EIP-712 domain separator
}
```

**Example:**
```typescript
const domain = await sdk.getDomainSeparator('avalanche-fuji');
console.log('Domain separator:', domain.domainSeparator);
```

### getTransferStatus()

Check if a transfer has been executed on-chain using its hash.

```typescript
async getTransferStatus(chainName: string, transferHash: string): Promise<TransferStatusResponse>
```

**Parameters:**
- `chainName`: Blockchain network name
- `transferHash`: Transfer hash to check

**Returns:**
```typescript
interface TransferStatusResponse extends SuccessResponse {
  chainName: string;     // Chain name
  transferHash: string;  // Transfer hash
  executed: boolean;     // Whether transfer was executed
}
```

**Example:**
```typescript
const status = await sdk.getTransferStatus('avalanche-fuji', '0x123...');
console.log('Transfer executed:', status.executed);
```

## Chain Management

### getSupportedChains()

Get list of supported chains.

```typescript
getSupportedChains(): SupportedChain[]
```

**Returns:** `['avalanche']`

### getChainConfig()

Get configuration for a specific chain.

```typescript
getChainConfig(chain: SupportedChain): ChainConfig
```

**Returns:**
```typescript
interface ChainConfig {
  name: string;           // Internal chain name (e.g., 'avalanche-fuji')
  displayName: string;    // Human-readable name
  chainId: number;        // Chain identifier
  rpcUrl: string;         // RPC endpoint
  relayerUrl: string;     // SmoothSend relayer URL
  explorerUrl: string;    // Block explorer URL
  tokens: string[];       // Supported token symbols
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
```

### isChainSupported()

Check if a chain is supported.

```typescript
isChainSupported(chain: string): chain is SupportedChain
```

## Event System

### addEventListener()

Listen to transfer events for real-time updates.

```typescript
addEventListener(listener: EventListener): void
```

**Event Types:**
```typescript
type TransferEventType = 
  | 'transfer_initiated'  // Transfer started
  | 'transfer_signed'     // Transaction signed
  | 'transfer_submitted'  // Transaction submitted
  | 'transfer_confirmed'  // Transfer confirmed
  | 'transfer_failed';    // Transfer failed

interface TransferEvent {
  type: TransferEventType;
  data: any;              // Event-specific data
  timestamp: number;      // Event timestamp
  chain: SupportedChain;  // Chain where event occurred
}
```

**Example:**
```typescript
sdk.addEventListener((event) => {
  switch (event.type) {
    case 'transfer_initiated':
      console.log('Transfer started');
      break;
    case 'transfer_signed':
      console.log('Transaction signed');
      break;
    case 'transfer_confirmed':
      console.log('Transfer confirmed:', event.data.result);
      break;
    case 'transfer_failed':
      console.error('Transfer failed:', event.data.error);
      break;
  }
});
```

### removeEventListener()

Remove an event listener.

```typescript
removeEventListener(listener: EventListener): void
```

## Static Methods

### SmoothSendSDK.getSupportedChains()

Get supported chains without instantiating the SDK.

```typescript
static getSupportedChains(): SupportedChain[]
```

### SmoothSendSDK.getChainConfig()

Get chain configuration without instantiating the SDK.

```typescript
static getChainConfig(chain: SupportedChain): ChainConfig
```

### SmoothSendSDK.getAllChainConfigs()

Get all chain configurations.

```typescript
static getAllChainConfigs(): Record<SupportedChain, ChainConfig>
```

## Configuration Utilities

### getChainConfig()

Get static chain configuration from the SDK.

```typescript
import { getChainConfig, getAllChainConfigs } from '@smoothsend/sdk';

const avalancheConfig = getChainConfig('avalanche');
const allConfigs = getAllChainConfigs();
```

### getTokenDecimals()

Get token decimals for proper formatting.

```typescript
import { getTokenDecimals } from '@smoothsend/sdk';

const usdcDecimals = getTokenDecimals('USDC'); // 6
const avaxDecimals = getTokenDecimals('AVAX'); // 18
```

## Dynamic Configuration Service

### chainConfigService

Service for fetching dynamic chain configurations from relayers.

```typescript
import { chainConfigService } from '@smoothsend/sdk';

// Fetch dynamic configurations from all relayers
const dynamicConfigs = await chainConfigService.getAllChainConfigs();

// Get specific chain config with fallback
const avalancheConfig = await chainConfigService.getChainConfig('avalanche');

// Clear cache
chainConfigService.clearCache();
```

### ChainConfigService Methods

#### fetchChainConfig()

Fetch chain configurations from a specific relayer.

```typescript
async fetchChainConfig(relayerUrl: string, chainName?: string): Promise<DynamicChainConfig[]>
```

#### getChainConfig()

Get configuration for a specific chain with fallback.

```typescript
async getChainConfig(chain: SupportedChain, fallbackConfig?: ChainConfig): Promise<DynamicChainConfig>
```

#### getAllChainConfigs()

Get all available chain configurations from all relayers.

```typescript
async getAllChainConfigs(fallbackConfigs?: Record<SupportedChain, ChainConfig>): Promise<Record<string, DynamicChainConfig>>
```

## Error Handling

The SDK uses OpenAPI-aligned error responses for consistent error handling:

```typescript
interface ErrorResponse {
  success: false;
  error: string;           // Error message
  details?: string[];      // Detailed validation errors
  requestId?: string;      // Request tracking ID
}

class SmoothSendError extends Error {
  constructor(
    message: string,
    public code: string,
    public chain?: SupportedChain,
    public details?: any
  )
}
```

**Common Error Codes:**
- `QUOTE_ERROR`: Failed to get transfer quote
- `NONCE_ERROR`: Failed to get user nonce
- `SIGNATURE_PREP_ERROR`: Failed to prepare signature data
- `SIGNATURE_ERROR`: Transaction signing failed
- `EXECUTION_ERROR`: Transfer execution failed
- `INSUFFICIENT_BALANCE`: Insufficient token balance
- `INVALID_ADDRESS`: Invalid address format
- `UNSUPPORTED_CHAIN`: Chain not supported
- `BATCH_NOT_SUPPORTED`: Batch transfers not supported on this chain
- `TOKEN_INFO_ERROR`: Failed to get token information
- `STATUS_ERROR`: Failed to get transaction status
- `CHAINS_ERROR`: Failed to get supported chains
- `HEALTH_CHECK_ERROR`: Health check failed
- `GAS_ESTIMATION_ERROR`: Gas estimation failed
- `DOMAIN_SEPARATOR_ERROR`: Failed to get domain separator
- `TRANSFER_STATUS_ERROR`: Failed to get transfer status

**Example:**
```typescript
try {
  await sdk.transfer(request, signer);
} catch (error) {
  if (error instanceof SmoothSendError) {
    console.error(`${error.code} on ${error.chain}:`, error.message);
    console.error('Details:', error.details);
  }
}
```
