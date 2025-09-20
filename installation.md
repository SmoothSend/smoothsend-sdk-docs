# Installation

## NPM Installation

```bash
npm install @smoothsend/sdk
```

## Yarn Installation

```bash
yarn add @smoothsend/sdk
```

## CDN Usage

For browser-only usage without a build system:

```html
<script type="module">
  import { SmoothSendSDK } from 'https://unpkg.com/@smoothsend/sdk@latest/dist/index.esm.js';
  
  const sdk = new SmoothSendSDK();
  console.log('SDK loaded!', sdk.getSupportedChains());
</script>
```

## Requirements

- **Node.js**: 16.0.0 or higher
- **TypeScript**: 5.0+ (for TypeScript projects)
- **Dependencies**: 
  - `ethers@^6.8.0` (for Avalanche - included as dependency)
  - `axios@^1.6.0` (HTTP client - included as dependency)

## Framework Integration

### React/Next.js

```javascript
import { SmoothSendSDK } from '@smoothsend/sdk';
import { useEffect, useState } from 'react';

function App() {
  const [sdk, setSdk] = useState(null);
  
  useEffect(() => {
    const smoothSend = new SmoothSendSDK({
      timeout: 30000,
      retries: 3
    });
    setSdk(smoothSend);
  }, []);
  
  return (
    <div>
      {sdk && <TransferComponent sdk={sdk} />}
    </div>
  );
}
```

### Vue.js

```javascript
import { SmoothSendSDK } from '@smoothsend/sdk';
import { ref, onMounted } from 'vue';

export default {
  setup() {
    const sdk = ref(null);
    
    onMounted(() => {
      sdk.value = new SmoothSendSDK();
    });
    
    return { sdk };
  }
}
```

### Svelte

```javascript
import { SmoothSendSDK } from '@smoothsend/sdk';
import { onMount } from 'svelte';

let sdk;

onMount(() => {
  sdk = new SmoothSendSDK();
});
```

## Verification

After installation, verify the SDK is working:

```javascript
import { SmoothSendSDK, VERSION } from '@smoothsend/sdk';

console.log('SmoothSend SDK version:', VERSION);

const sdk = new SmoothSendSDK();
console.log('Supported chains:', sdk.getSupportedChains());
console.log('Avalanche config:', sdk.getChainConfig('avalanche'));
```

## Environment Setup

### Development

```javascript
import { SmoothSendSDK, chainConfigService } from '@smoothsend/sdk';

const sdk = new SmoothSendSDK({
  timeout: 30000,
  retries: 3,
  customChainConfigs: {
    avalanche: {
      relayerUrl: 'https://smoothsendevm.onrender.com'
    }
  }
});

// Optional: Fetch dynamic configurations
const dynamicConfigs = await chainConfigService.getAllChainConfigs();
console.log('Available chains:', Object.keys(dynamicConfigs));
```

### Production

```javascript
const sdk = new SmoothSendSDK(); // Uses testnet by default
```

## Troubleshooting

### Common Issues

**Module not found errors:**
```bash
npm install --save-dev @types/node
```

**TypeScript errors:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true
  }
}
```

**Build errors in bundlers:**
```javascript
// webpack.config.js
module.exports = {
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer")
    }
  }
};
```
