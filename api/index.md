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
  apiKey?: string;           // Future: API key for rate limiting
  timeout?: number;          // Request timeout in ms (default: 30000)
  retries?: number;          // Max retries for failed requests (default: 3)
  customChainConfigs?: Partial<Record<SupportedChain, Partial<ChainConfig>>>;
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
  estimatedGas?: string;  // Estimated gas cost
  deadline?: number;      // Quote expiration timestamp
  nonce?: string;         // User's current nonce
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
  blockNumber?: string;   // Block number where tx was mined
  gasUsed?: string;       // Gas consumed
  transferId?: string;    // Internal transfer ID
  explorerUrl?: string;   // Blockchain explorer URL
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
  name: string;           // Human-readable name
  chainId: string | number; // Chain identifier
  rpcUrl: string;         // RPC endpoint
  relayerUrl: string;     // SmoothSend relayer URL
  explorerUrl: string;    // Block explorer URL
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

The SDK uses custom error types for better error handling:

```typescript
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
