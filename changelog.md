# Changelog

All notable changes to the SmoothSend SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Aptos (Testnet) - Currently active

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
- `@aptos-labs/ts-sdk@^1.15.0` (for Aptos support)
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
npm install ethers@^6.0.0 @aptos-labs/ts-sdk@^1.15.0
```

---

## Support

- 📧 **Email**: [support@smoothsend.xyz](mailto:support@smoothsend.xyz)
- 💬 **Discord**: [Join our community](https://discord.gg/fF6cdJFWnM)
- 🐛 **Issues**: Report bugs and request features
- 📖 **Documentation**: [Full API reference](./api/)

---

*For detailed technical information about each release, see the [API Reference](./api/) and [Integration Guides](./chains/avalanche).*
