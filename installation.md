# Installation

## Prerequisites

- **Node.js**: Version 16.0.0 or higher
- **npm** or **yarn** package manager
- **TypeScript**: Recommended for full type safety

## Install the SDK

:::code-group
```bash [npm]
npm install @smoothsend/sdk
```

```bash [yarn]
yarn add @smoothsend/sdk
```

```bash [pnpm]
pnpm add @smoothsend/sdk
```
:::

## Peer Dependencies

The SDK requires `ethers` v6 as a peer dependency for EVM chain interactions:

:::code-group
```bash [npm]
npm install ethers@^6.0.0
```

```bash [yarn]
yarn add ethers@^6.0.0
```

```bash [pnpm]
pnpm add ethers@^6.0.0
```
:::

## TypeScript Support

The SDK is built with TypeScript and includes full type definitions. No additional `@types` packages are needed.

```json
{
  "dependencies": {
    "@smoothsend/sdk": "^1.0.0-beta.13",
    "ethers": "^6.0.0"
  }
}
```

## Browser Support

The SDK works in modern browsers and supports:

- **ES Modules**: Use with modern bundlers (Vite, Webpack 5+)
- **CommonJS**: Compatible with older Node.js environments
- **Browser**: Works with MetaMask and other wallet providers

## Verification

Verify your installation by importing the SDK:

:::code-group
```typescript [Basic Verification]
import { SmoothSendSDK } from '@smoothsend/sdk';

const sdk = new SmoothSendSDK();
console.log('SmoothSend SDK installed successfully!');
```

```typescript [With Configuration]
import { SmoothSendSDK } from '@smoothsend/sdk';

const sdk = new SmoothSendSDK({
  timeout: 30000,
  retries: 3
});

console.log('SmoothSend SDK initialized with custom config!');
```

```typescript [Check Supported Chains]
import { SmoothSendSDK } from '@smoothsend/sdk';

const sdk = new SmoothSendSDK();
const chains = await sdk.getSupportedChains();
console.log('Supported chains:', chains);
```
:::

## Next Steps

- [Quick Start Guide](./quick-start) - Build your first gasless transaction
- [API Reference](./api/) - Explore all available methods

## Troubleshooting

### Common Issues

**1. Module Resolution Errors**

If you encounter module resolution issues, ensure you're using a compatible bundler:

```typescript
// Correct import
import { SmoothSendSDK } from '@smoothsend/sdk';

// Incorrect
import SmoothSendSDK from '@smoothsend/sdk';
```

**2. Ethers Version Conflicts**

Ensure you're using ethers v6:

:::code-group
```bash [npm]
npm ls ethers
```

```bash [yarn]
yarn list ethers
```

```bash [pnpm]
pnpm list ethers
```
:::

If you see version conflicts, install the correct version:

:::code-group
```bash [npm]
npm install ethers@^6.0.0
```

```bash [yarn]
yarn add ethers@^6.0.0
```

```bash [pnpm]
pnpm add ethers@^6.0.0
```
:::

**3. TypeScript Configuration**

For optimal TypeScript support, ensure your `tsconfig.json` includes:

:::code-group
```json [Node.js Project]
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  }
}
```

```json [Browser Project]
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  }
}
```

```json [React/Next.js Project]
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "jsx": "react-jsx"
  }
}
```
:::

## Support

If you encounter installation issues:

1. Join our [Discord Community](https://discord.gg/fF6cdJFWnM)
2. Contact us on [Twitter](https://x.com/smoothsend)
