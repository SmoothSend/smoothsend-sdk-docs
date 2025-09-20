# Examples

Complete examples showcasing SmoothSend SDK integration in various scenarios.

## Example dApps

### 1. Token Sender
A simple interface for sending tokens across chains without gas.

**Features:**
- Multi-chain support (Avalanche & Aptos)
- Real-time fee calculation
- Transaction status tracking
- Wallet integration

**[View Source](./token-sender.md)** | **[Live Demo](https://token-sender.smoothsend.xyz)**

### 2. NFT Marketplace
Gasless NFT purchases with stablecoin payments.

**Features:**
- Buy NFTs without holding native tokens
- Batch operations (approve + purchase)
- Multi-token payment options
- Seller dashboard

**[View Source](./nft-marketplace.md)** | **[Live Demo](https://marketplace.smoothsend.xyz)**

### 3. DeFi Yield Farming
Stake tokens and earn rewards without gas fees.

**Features:**
- Gasless staking operations
- Automatic reward compounding
- LP token farming
- Emergency withdrawals

**[View Source](./defi-farming.md)** | **[Live Demo](https://farm.smoothsend.xyz)**

### 4. Cross-Chain Bridge
Bridge tokens between Avalanche and Aptos.

**Features:**
- Cross-chain transfers
- Gasless transactions on both sides
- Real-time bridge status
- Automatic route optimization

**[View Source](./cross-chain-bridge.md)** | **[Live Demo](https://bridge.smoothsend.xyz)**

### 5. Social Payments
Send payments via social handles and QR codes.

**Features:**
- Send via @username or email
- QR code payments
- Bill splitting
- Payment requests

**[View Source](./social-payments.md)** | **[Live Demo](https://pay.smoothsend.xyz)**

## Quick Start Templates

### React Template

```bash
npx create-react-app my-dapp --template smoothsend
cd my-dapp
npm start
```

### Next.js Template

```bash
npx create-next-app my-dapp --example smoothsend
cd my-dapp
npm run dev
```

### Vue.js Template

```bash
npm create vue@latest my-dapp -- --template smoothsend
cd my-dapp
npm run dev
```

## Code Snippets

### Basic Transfer Component (React)

```jsx
import React, { useState } from 'react';
import { SmoothSendSDK } from '@smoothsend/sdk';
import { ethers } from 'ethers';

const TransferComponent = () => {
  const [sdk] = useState(new SmoothSendSDK());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const result = await sdk.transfer({
        from: await signer.getAddress(),
        to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
        token: 'USDC',
        amount: ethers.parseUnits('10', 6).toString(),
        chain: 'avalanche'
      }, signer);
      
      setResult(result);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Sending...' : 'Send 10 USDC'}
      </button>
      {result && (
        <div>
          <p>Success! Transaction: {result.txHash}</p>
          <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
};

export default TransferComponent;
```

### Multi-Chain Balance Display (Vue.js)

```vue
<template>
  <div class="balance-display">
    <h3>Your Balances</h3>
    <div v-for="chain in chains" :key="chain" class="chain-section">
      <h4>{{ chain.toUpperCase() }}</h4>
      <div v-if="loading[chain]">Loading balances...</div>
      <div v-else>
        <div v-for="balance in balances[chain]" :key="balance.token" class="balance-item">
          <span>{{ balance.symbol }}: {{ formatBalance(balance) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { SmoothSendSDK } from '@smoothsend/sdk';

export default {
  name: 'BalanceDisplay',
  props: {
    address: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      sdk: new SmoothSendSDK(),
      chains: ['avalanche', 'aptos'],
      balances: {},
      loading: {}
    };
  },
  async mounted() {
    await this.loadBalances();
  },
  methods: {
    async loadBalances() {
      for (const chain of this.chains) {
        this.loading[chain] = true;
        try {
          const balances = await this.sdk.getBalance(chain, this.address);
          this.balances[chain] = balances;
        } catch (error) {
          console.error(`Failed to load ${chain} balances:`, error);
          this.balances[chain] = [];
        } finally {
          this.loading[chain] = false;
        }
      }
    },
    formatBalance(balance) {
      const value = parseFloat(balance.balance) / Math.pow(10, balance.decimals);
      return value.toFixed(6);
    }
  }
};
</script>
```

### Transfer Hook (React)

```javascript
import { useState, useCallback } from 'react';
import { SmoothSendSDK } from '@smoothsend/sdk';

export const useTransfer = () => {
  const [sdk] = useState(new SmoothSendSDK());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const transfer = useCallback(async (request, signer) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const transferResult = await sdk.transfer(request, signer);
      setResult(transferResult);
      return transferResult;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sdk]);

  const getQuote = useCallback(async (request) => {
    try {
      return await sdk.getQuote(request);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [sdk]);

  return {
    transfer,
    getQuote,
    loading,
    error,
    result,
    sdk
  };
};
```

## Integration Patterns

### Error Handling Pattern

```javascript
const handleTransferError = (error, chain) => {
  const errorMessages = {
    INSUFFICIENT_BALANCE: `Insufficient balance for ${chain} transfer`,
    NETWORK_ERROR: `${chain} network is currently unavailable`,
    USER_REJECTED: 'Transaction was cancelled by user',
    QUOTE_ERROR: 'Unable to calculate transfer fee',
    EXECUTION_ERROR: 'Transfer failed during execution'
  };

  const message = errorMessages[error.code] || error.message;
  
  // Show user-friendly error
  showNotification(message, 'error');
  
  // Log technical details
  console.error(`${chain} transfer error:`, {
    code: error.code,
    message: error.message,
    details: error.details
  });
};
```

### Event Monitoring Pattern

```javascript
const setupEventMonitoring = (sdk, onUpdate) => {
  sdk.addEventListener((event) => {
    const updates = {
      transfer_initiated: { status: 'preparing', message: 'Preparing transfer...' },
      transfer_signed: { status: 'signing', message: 'Transaction signed' },
      transfer_submitted: { status: 'pending', message: 'Transaction submitted' },
      transfer_confirmed: { status: 'success', message: 'Transfer completed!' },
      transfer_failed: { status: 'error', message: 'Transfer failed' }
    };

    const update = updates[event.type];
    if (update) {
      onUpdate({
        ...update,
        chain: event.chain,
        data: event.data,
        timestamp: event.timestamp
      });
    }
  });
};
```

### Retry Pattern

```javascript
const transferWithRetry = async (sdk, request, signer, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sdk.transfer(request, signer);
    } catch (error) {
      lastError = error;
      
      // Don't retry user rejections
      if (error.code === 'USER_REJECTED') {
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.log(`Transfer attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw new Error(`Transfer failed after ${maxRetries} attempts: ${lastError.message}`);
};
```

## Testing Examples

### Jest Test Suite

```javascript
import { SmoothSendSDK } from '@smoothsend/sdk';

describe('SmoothSend SDK Integration', () => {
  let sdk;

  beforeEach(() => {
    sdk = new SmoothSendSDK({
      customChainConfigs: {
        avalanche: {
          relayerUrl: 'https://test-relayer.example.com'
        }
      }
    });
  });

  test('should initialize with supported chains', () => {
    expect(sdk.getSupportedChains()).toEqual(['avalanche', 'aptos']);
  });

  test('should validate addresses correctly', () => {
    expect(sdk.validateAddress('avalanche', '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2')).toBe(true);
    expect(sdk.validateAddress('avalanche', 'invalid-address')).toBe(false);
  });

  test('should get chain configuration', () => {
    const config = sdk.getChainConfig('avalanche');
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('chainId');
    expect(config).toHaveProperty('relayerUrl');
  });
});
```

### Cypress E2E Tests

```javascript
describe('Token Transfer Flow', () => {
  beforeEach(() => {
    cy.visit('/transfer');
    cy.connectWallet();
  });

  it('should complete USDC transfer on Avalanche', () => {
    cy.get('[data-testid=chain-select]').select('avalanche');
    cy.get('[data-testid=token-select]').select('USDC');
    cy.get('[data-testid=recipient-input]').type('0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3');
    cy.get('[data-testid=amount-input]').type('10');
    
    cy.get('[data-testid=transfer-button]').click();
    
    cy.get('[data-testid=quote-modal]').should('be.visible');
    cy.get('[data-testid=confirm-button]').click();
    
    cy.get('[data-testid=success-message]').should('contain', 'Transfer completed');
    cy.get('[data-testid=transaction-hash]').should('exist');
  });
});
```

## Performance Optimization

### Bundle Size Optimization

```javascript
// Import only what you need
import { SmoothSendSDK } from '@smoothsend/sdk/core';
import { AvalancheAdapter } from '@smoothsend/sdk/adapters/avalanche';

// Custom SDK with only Avalanche support
const sdk = new SmoothSendSDK();
// This automatically includes all adapters, but you can optimize further
```

### Lazy Loading

```javascript
const LazyAptosTransfer = React.lazy(() => import('./AptosTransfer'));
const LazyAvalancheTransfer = React.lazy(() => import('./AvalancheTransfer'));

const TransferComponent = ({ chain }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {chain === 'aptos' ? <LazyAptosTransfer /> : <LazyAvalancheTransfer />}
    </Suspense>
  );
};
```

## Deployment Examples

### Vercel Deployment

```json
{
  "name": "my-smoothsend-dapp",
  "version": "1.0.0",
  "scripts": {
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@smoothsend/sdk": "^1.0.0",
    "next": "^13.0.0",
    "react": "^18.0.0"
  }
}
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

---

These examples provide a comprehensive starting point for integrating SmoothSend SDK into your applications. Each example includes error handling, best practices, and production-ready patterns.
