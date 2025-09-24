# Examples

Complete examples showcasing SmoothSend SDK integration for both Avalanche and Aptos chains.

## Example dApps

### 1. Multi-Chain Token Sender
A simple interface for sending tokens on both Avalanche and Aptos without gas.

**Features:**
- Avalanche and Aptos support with dynamic configuration
- Real-time fee calculation for both chains
- Transaction status tracking
- Multi-wallet integration (MetaMask, Petra)

**[View Source](#basic-transfer-component-react)**

### 2. Cross-Chain Balance Viewer
View and manage token balances across supported chains.

**Features:**
- Balance checking on Avalanche and Aptos
- Multi-token support (USDC, APT)
- Chain-specific address validation
- Real-time balance updates

**[View Source](#multi-chain-balance-display-vuejs)**

## Quick Start Templates

Create a new project with SmoothSend SDK integration:

### React Template

```bash
npx create-react-app my-dapp
cd my-dapp
npm install @smoothsend/sdk ethers
```

### Next.js Template

```bash
npx create-next-app my-dapp
cd my-dapp
npm install @smoothsend/sdk ethers
```

### Vue.js Template

```bash
npm create vue@latest my-dapp
cd my-dapp
npm install @smoothsend/sdk ethers
```

## Code Snippets

### Basic Transfer Component (React)

```jsx
import React, { useState, useEffect } from 'react';
import { SmoothSendSDK, getTokenDecimals } from '@smoothsend/sdk';
import { ethers } from 'ethers';

const TransferComponent = () => {
  const [sdk] = useState(new SmoothSendSDK());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [health, setHealth] = useState(null);
  const [chains, setChains] = useState([]);

  // Check service health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthStatus = await sdk.getHealth();
        setHealth(healthStatus);
        
        // Get supported chains
        const supportedChains = await sdk.getSupportedChainsInfo();
        setChains(supportedChains);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    };
    
    checkHealth();
  }, [sdk]);

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get proper decimals for USDC
      const usdcDecimals = getTokenDecimals('USDC');
      
      const result = await sdk.transfer({
        from: await signer.getAddress(),
        to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
        token: 'USDC',
        amount: ethers.parseUnits('10', usdcDecimals).toString(),
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
      {/* Service Status */}
      {health && (
        <div style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#e8f5e8', borderRadius: '4px' }}>
          <strong>Service Status:</strong> {health.status} (v{health.version})
        </div>
      )}

      {/* Supported Chains */}
      {chains.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <strong>Supported Chains:</strong>
          <ul>
            {chains.map(chain => (
              <li key={chain.name}>
                {chain.displayName} - {chain.tokens.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleTransfer} disabled={loading}>
        {loading ? 'Sending...' : 'Send 10 USDC'}
      </button>
      
      {result && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
          <p><strong>Success!</strong> Transaction: {result.txHash}</p>
          <p>Block: {result.blockNumber}</p>
          <p>Fee: {result.fee}</p>
          <p>Execution Time: {result.executionTime}ms</p>
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
    <h3>Your Multi-Chain Balances</h3>
    
    <!-- Avalanche Balances -->
    <div class="chain-section">
      <h4>AVALANCHE FUJI</h4>
      <input v-model="evmAddress" placeholder="Enter EVM address (0x...)" />
      <button @click="loadAvalancheBalances" :disabled="!evmAddress">Load Avalanche</button>
      <div v-if="loading.avalanche">Loading Avalanche balances...</div>
      <div v-else-if="balances.avalanche.length">
        <div v-for="balance in balances.avalanche" :key="balance.token" class="balance-item">
          <span>{{ balance.symbol }}: {{ formatBalance(balance) }}</span>
        </div>
      </div>
    </div>

    <!-- Aptos Balances -->
    <div class="chain-section">
      <h4>APTOS TESTNET</h4>
      <input v-model="aptosAddress" placeholder="Enter Aptos address (0x...)" />
      <button @click="loadAptosBalances" :disabled="!aptosAddress">Load Aptos</button>
      <div v-if="loading['aptos-testnet']">Loading Aptos balances...</div>
      <div v-else-if="balances['aptos-testnet'].length">
        <div v-for="balance in balances['aptos-testnet']" :key="balance.token" class="balance-item">
          <span>{{ balance.symbol }}: {{ formatBalance(balance) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { SmoothSendSDK } from '@smoothsend/sdk';

export default {
  name: 'MultiChainBalanceDisplay',
  data() {
    return {
      sdk: new SmoothSendSDK(),
      evmAddress: '',
      aptosAddress: '',
      balances: {
        avalanche: [],
        'aptos-testnet': []
      },
      loading: {
        avalanche: false,
        'aptos-testnet': false
      }
    };
  },
  methods: {
    async loadAvalancheBalances() {
      if (!this.evmAddress) return;
      
      this.loading.avalanche = true;
      try {
        const balances = await this.sdk.getBalance('avalanche', this.evmAddress);
        this.balances.avalanche = balances;
      } catch (error) {
        console.error('Failed to load Avalanche balances:', error);
        this.balances.avalanche = [];
      } finally {
        this.loading.avalanche = false;
      }
    },
    
    async loadAptosBalances() {
      if (!this.aptosAddress) return;
      
      this.loading['aptos-testnet'] = true;
      try {
        const balances = await this.sdk.getBalance('aptos-testnet', this.aptosAddress);
        this.balances['aptos-testnet'] = balances;
      } catch (error) {
        console.error('Failed to load Aptos balances:', error);
        this.balances['aptos-testnet'] = [];
      } finally {
        this.loading['aptos-testnet'] = false;
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

### OpenAPI-Aligned Service Monitor (React)

```jsx
import React, { useState, useEffect } from 'react';
import { SmoothSendSDK } from '@smoothsend/sdk';

const ServiceMonitor = () => {
  const [sdk] = useState(new SmoothSendSDK());
  const [health, setHealth] = useState(null);
  const [chains, setChains] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServiceInfo = async () => {
      try {
        // Check service health
        const healthStatus = await sdk.getHealth();
        setHealth(healthStatus);

        // Get supported chains
        const supportedChains = await sdk.getSupportedChainsInfo();
        setChains(supportedChains);

        // Get tokens for first chain
        if (supportedChains.length > 0) {
          const chainTokens = await sdk.getSupportedTokensForChain(supportedChains[0].name);
          setTokens(chainTokens);
        }
      } catch (error) {
        console.error('Failed to load service info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServiceInfo();
  }, [sdk]);

  const checkTransferStatus = async (txHash) => {
    try {
      const status = await sdk.getTransferStatus('avalanche-fuji', txHash);
      console.log('Transfer executed:', status.executed);
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const estimateGasCost = async () => {
    try {
      const estimate = await sdk.estimateGas('avalanche-fuji', [{
        from: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d2',
        to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
        token: '0x5425890298aed601595a70AB815c96711a31Bc65',
        amount: '1000000',
        relayerFee: '1000',
        nonce: '5',
        deadline: 1705312200,
        signature: '0x1234567890abcdef...'
      }]);
      
      console.log('Gas estimate:', estimate.gasEstimate);
      console.log('Estimated cost:', estimate.estimatedCost);
    } catch (error) {
      console.error('Gas estimation failed:', error);
    }
  };

  if (loading) return <div>Loading service information...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Service Monitor</h2>
      
      {/* Health Status */}
      <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h3>Health Status</h3>
        <p><strong>Status:</strong> {health?.status}</p>
        <p><strong>Version:</strong> {health?.version}</p>
        <p><strong>Timestamp:</strong> {health?.timestamp}</p>
      </div>

      {/* Supported Chains */}
      <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h3>Supported Chains</h3>
        {chains.map(chain => (
          <div key={chain.name} style={{ marginBottom: '8px' }}>
            <strong>{chain.displayName}</strong> ({chain.name})
            <br />
            <small>Chain ID: {chain.chainId} | Explorer: {chain.explorerUrl}</small>
            <br />
            <small>Tokens: {chain.tokens.join(', ')}</small>
          </div>
        ))}
      </div>

      {/* Supported Tokens */}
      <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h3>Supported Tokens</h3>
        {tokens.map(token => (
          <div key={token.symbol} style={{ marginBottom: '8px' }}>
            <strong>{token.name} ({token.symbol})</strong>
            <br />
            <small>Address: {token.address}</small>
            <br />
            <small>Decimals: {token.decimals}</small>
          </div>
        ))}
      </div>

      {/* Utility Functions */}
      <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
        <h3>Utility Functions</h3>
        <button onClick={estimateGasCost} style={{ marginRight: '8px' }}>
          Estimate Gas Cost
        </button>
        <button onClick={() => checkTransferStatus('0x123...')}>
          Check Transfer Status
        </button>
      </div>
    </div>
  );
};

export default ServiceMonitor;
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

## Performance Optimization

### Bundle Size Optimization

```javascript
// Import only what you need
import { SmoothSendSDK, getChainConfig, getTokenDecimals } from '@smoothsend/sdk';

// SDK automatically includes Avalanche support
const sdk = new SmoothSendSDK();

// Use configuration utilities
const chainConfig = getChainConfig('avalanche');
const tokenDecimals = getTokenDecimals('USDC');
```

### Lazy Loading

```javascript
const LazyAvalancheTransfer = React.lazy(() => import('./AvalancheTransfer'));

const TransferComponent = ({ chain }) => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {chain === 'avalanche' && <LazyAvalancheTransfer />}
    </Suspense>
  );
};
```

---

These examples provide a comprehensive starting point for integrating SmoothSend SDK into your applications. Each example includes error handling, best practices, and production-ready patterns.
