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
  console.log('SDK loaded!', SmoothSendSDK.getSupportedChains());
</script>
```

## Requirements

- **Node.js**: 16.0.0 or higher
- **TypeScript**: 5.0+ (for TypeScript projects)
- **Dependencies**: 
  - `ethers@^6.8.0` (for Avalanche EVM support - included as dependency)
  - No additional dependencies needed for Aptos support
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
console.log('Supported chains:', SmoothSendSDK.getSupportedChains()); // ['avalanche', 'aptos-testnet']
console.log('Avalanche config:', sdk.getChainConfig('avalanche'));
console.log('Aptos config:', sdk.getChainConfig('aptos-testnet'));
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
console.log('Available chains:', Object.keys(dynamicConfigs)); // Should include avalanche and aptos-testnet
```

### Production

```javascript
const sdk = new SmoothSendSDK(); // Uses testnet by default
```

## Testnet Setup

### Avalanche Fuji Testnet Setup

**Add Network to MetaMask:**
1. Open MetaMask and click "Add Network"
2. Enter these details:
   - **Network Name**: Avalanche Fuji Testnet
   - **RPC URL**: https://api.avax-test.network/ext/bc/C/rpc
   - **Chain ID**: 43113
   - **Currency Symbol**: AVAX
   - **Block Explorer**: https://testnet.snowtrace.io

**Get Test Tokens:**
- **AVAX Faucet**: https://faucet.avax.network/
- **USDC Faucet**: Contact support@smoothsend.xyz for testnet USDC

### Aptos Testnet Setup

**Install Aptos Wallet:**
- **Petra Wallet**: https://petra.app/ (Chrome extension)
- **Martian Wallet**: https://martianwallet.xyz/ (Chrome extension)

**Get Test Tokens:**
- **APT Faucet**: https://aptoslabs.com/testnet-faucet
- **Aptos Explorer**: https://explorer.aptoslabs.com/?network=testnet

**Network Details:**
- **Chain ID**: 2
- **RPC URL**: https://fullnode.testnet.aptoslabs.com/v1
- **Explorer**: https://explorer.aptoslabs.com/?network=testnet

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

### Debugging Transfer Issues

**Check SDK status:**
```javascript
import { SmoothSendSDK } from '@smoothsend/sdk';

const sdk = new SmoothSendSDK();

// Check if relayers are healthy
try {
  const health = await sdk.getHealth();
  console.log('Service status:', health.status);
} catch (error) {
  console.error('Service unavailable:', error);
}

// Verify chain support
const chains = await sdk.getSupportedChains();
console.log('Available chains:', chains);
```

**Common Transfer Errors:**
- **`INSUFFICIENT_BALANCE`**: User doesn't have enough tokens
- **`USER_REJECTED`**: User cancelled transaction in wallet
- **`NETWORK_ERROR`**: Network connectivity issues
- **`QUOTE_ERROR`**: Unable to calculate fees (relayer down)
- **`INVALID_ADDRESS`**: Address format incorrect for chain

**Debug Transfer Flow:**
```javascript
try {
  // Step 1: Get quote first
  const quote = await sdk.getQuote(request);
  console.log('Quote successful:', quote);
  
  // Step 2: Execute transfer
  const result = await sdk.transfer(request, signer);
  console.log('Transfer successful:', result);
} catch (error) {
  console.error('Transfer failed at:', error.code, error.message);
}
```

### Rate Limits & Production Notes

- **Rate Limits**: 100 requests per minute per IP
- **Testnet Only**: Current relayers only support testnets
- **Gas Fees**: Users pay in stablecoins, not native gas
- **Transaction Limits**: $100 USD equivalent per transfer (testnet)
