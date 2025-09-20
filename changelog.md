# Changelog

All notable changes to the SmoothSend SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-beta.4] - 2024-12-21

### 🔄 Changed
- **BREAKING**: Removed Aptos support - SDK now focuses on Avalanche only
- **BREAKING**: Removed mainnet configurations - SDK now uses testnet by default
- **BREAKING**: Updated chain configuration API - removed testnet parameters from static methods
- Simplified chain configuration to use only testnet (Fuji) for Avalanche
- Updated all documentation to reflect current SDK capabilities

### ✨ Added
- **Dynamic Configuration Service**: `chainConfigService` for fetching configurations from relayers
- **Enhanced Configuration Utilities**: `getTokenDecimals()` and improved chain config methods
- **Intelligent Caching**: Chain configuration caching with TTL for optimal performance
- **Fallback Configuration**: Graceful fallback to static configs when dynamic fetch fails
- **Configuration Validation**: Better validation and error handling for chain configurations

### 🗑️ Removed
- Aptos adapter and all Aptos-related functionality
- Mainnet chain configurations (43114 for Avalanche, chain ID 1 for Aptos)
- `SUPPORTED_TOKENS_BY_CHAIN` export (replaced with dynamic fetching)
- `getSupportedTokens()` function (now handled by dynamic service)
- Testnet parameters from static configuration methods

### 🔧 Fixed
- Chain configuration inconsistencies between static and dynamic configs
- Hardcoded "fuji" references in Avalanche adapter (now dynamic based on chainId)
- Build errors from missing exports after configuration changes
- Documentation inconsistencies across all files

### 📚 Documentation
- Complete rewrite of all documentation to reflect current SDK state
- Updated API reference with new configuration utilities
- Revised examples to use only Avalanche testnet
- Updated installation and quick-start guides
- Comprehensive changelog with migration guidance

### 🏗️ Architecture
- **Single Chain Focus**: Streamlined architecture for Avalanche-only support
- **Dynamic Configuration**: Ready for additional chains through relayer integration
- **Modular Design**: Clean separation between static and dynamic configuration
- **Future-Ready**: Architecture prepared for easy addition of new chains

### 🔗 Chain Support
- **Avalanche Fuji Testnet** (Chain ID: 43113) - Active
- **Relayer URL**: https://smoothsendevm.onrender.com

### 🛠️ Migration Guide

#### For existing users upgrading from beta.1:

1. **Remove Aptos references**:
```typescript
// Before
import { SmoothSendSDK } from '@smoothsend/sdk';
const sdk = new SmoothSendSDK();
const chains = sdk.getSupportedChains(); // ['avalanche', 'aptos']

// After
import { SmoothSendSDK } from '@smoothsend/sdk';
const sdk = new SmoothSendSDK();
const chains = sdk.getSupportedChains(); // ['avalanche']
```

2. **Update configuration usage**:
```typescript
// Before
const config = SmoothSendSDK.getChainConfig('avalanche', true);

// After
const config = SmoothSendSDK.getChainConfig('avalanche');
```

3. **Use new configuration utilities**:
```typescript
// Before
const decimals = { USDC: 6, APT: 8 }[token];

// After
import { getTokenDecimals } from '@smoothsend/sdk';
const decimals = getTokenDecimals(token);
```

4. **Update dependencies**:
```bash
# Remove Aptos dependency
npm uninstall @aptos-labs/ts-sdk

# Update SDK
npm update @smoothsend/sdk
```

---

## [1.0.0-beta.1] - 2024-12-20

### Added
- Initial beta release of SmoothSend SDK
- Multi-chain gasless transaction support for Avalanche and Aptos
- TypeScript support with full type definitions
- Real-time event system for transaction monitoring
- Comprehensive error handling with custom error types
- Quote system for fee estimation
- Batch transfer support for Avalanche (sequential execution)
- Address and amount validation utilities
- Chain configuration management
- Balance checking functionality
- Complete transfer flow: quote → prepare → sign → execute
- EIP-712 signature support for Avalanche
- Aptos native transaction signing
- HTTP client with retry mechanisms
- Chain adapter pattern for extensibility

### Features
- **Avalanche Support**: EIP-712 meta-transactions, USDC/USDT tokens, permit-based approvals
- **Aptos Support**: Native signing, APT transfers, testnet support
- **Developer Experience**: Full TypeScript support, comprehensive documentation, extensive test coverage
- **Production Ready**: Error handling, retry mechanisms, event monitoring, request timeouts

### Chain Support
- Avalanche (Fuji Testnet) - Currently active

### API Endpoints
- `GET /health` - Health check
- `GET /chains` - Supported chains and tokens
- `GET /nonce` - User nonce for transactions
- `POST /quote` - Transfer quote with fees
- `POST /prepare-signature` - Signature data preparation
- `POST /relay-transfer` - Execute gasless transfer

### API Methods
- `transfer()` - Execute gasless transfers
- `getQuote()` - Get transfer quotes with fees
- `batchTransfer()` - Execute multiple transfers (Avalanche only)
- `getBalance()` - Check token balances
- `validateAddress()` - Validate address formats
- `getSupportedChains()` - Get list of supported chains
- `addEventListener()` - Monitor transfer events

### Dependencies
- `ethers@^6.0.0` (peer dependency for Avalanche)
- `axios@^1.6.0` (HTTP client)

---

## Upcoming Features

### [1.0.0] - Q1 2025 (Planned)
- Stable release with production-ready features
- Enhanced error messages and debugging tools
- Performance optimizations
- Additional chain support (Ethereum, Polygon)
- Advanced batching capabilities
- SDK analytics and monitoring

### [1.1.0] - Q2 2025 (Planned)
- Cross-chain bridge functionality
- Automatic route optimization
- Gas price prediction
- Advanced retry strategies
- SDK plugin system

---

## Migration Guides

### From Alpha to Beta
If you were using an alpha version of the SDK, please note the following breaking changes:

1. **Constructor Changes**: The SDK constructor now accepts a configuration object
2. **Event System**: Event names have been standardized
3. **Error Handling**: Custom error types now provide more detailed information
4. **Chain Configs**: Chain configuration format has been updated

### Upgrade Instructions

```bash
# Update to latest beta
npm update @smoothsend/sdk

# Update peer dependencies
npm install ethers@^6.0.0
```

---

## Support

- 📧 **Email**: [support@smoothsend.xyz](mailto:support@smoothsend.xyz)
- 💬 **Discord**: [Join our community](https://discord.gg/fF6cdJFWnM)
- 🐛 **Issues**: Report bugs and request features
- 📖 **Documentation**: [Full API reference](./api/)

---

*For detailed technical information about each release, see the [API Reference](./api/) and [Integration Guides](./chains/avalanche).*
