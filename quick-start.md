# Quick Start

Get up and running with SmoothSend SDK in under 5 minutes for both Avalanche and Aptos.

## 1. Installation

```bash
npm install @smoothsend/sdk
```

## 2. Initialize SDK

```typescript
import { SmoothSendSDK, getChainConfig } from '@smoothsend/sdk';

const sdk = new SmoothSendSDK({
  timeout: 30000,
  retries: 3,
  useDynamicConfig: true,  // Enable dynamic configuration from relayers
  configCacheTtl: 300000  // 5 minutes cache TTL
});

// Check what chains are supported
const supportedChains = SmoothSendSDK.getSupportedChains();
console.log('Supported chains:', supportedChains); // ['avalanche', 'aptos-testnet']

// Get chain configurations
const avalancheConfig = getChainConfig('avalanche');
const aptosConfig = getChainConfig('aptos-testnet');
console.log('Avalanche config:', avalancheConfig);
console.log('Aptos config:', aptosConfig);
```

## 3. Your First Transfer

### Avalanche Example (EVM-based)

```javascript
import { ethers } from 'ethers';
import { getTokenDecimals } from '@smoothsend/sdk';

// Connect wallet (MetaMask, etc.)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Get proper decimals for USDC
const usdcDecimals = getTokenDecimals('USDC'); // Returns 6

// Execute gasless transfer
const result = await sdk.transfer({
  from: await signer.getAddress(),
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: ethers.parseUnits('10', usdcDecimals).toString(), // 10 USDC
  chain: 'avalanche'
}, signer);

console.log('Success! TX:', result.txHash);
console.log('Explorer:', result.explorerUrl);
```

### Aptos Example (Move-based)

```javascript
// Connect Aptos wallet (Petra, Martian, etc.)
const connectAptosWallet = async () => {
  if (!window.aptos) {
    throw new Error('Aptos wallet not installed');
  }
  return await window.aptos.connect();
};

const wallet = await connectAptosWallet();

// Execute gasless transfer on Aptos
const result = await sdk.transfer({
  from: wallet.address,
  to: '0x8765432109fedcba8765432109fedcba87654321',
  token: 'USDC',
  amount: '10000000', // 10 USDC (6 decimals)
  chain: 'aptos-testnet'
}, wallet);

console.log('Success! TX:', result.txHash);
console.log('Explorer:', result.explorerUrl);
```

## 4. Add Event Monitoring

```javascript
sdk.addEventListener((event) => {
  console.log(`[${event.chain}] ${event.type}:`, event.data);
  
  switch (event.type) {
    case 'transfer_initiated':
      console.log('Preparing transfer...');
      break;
    case 'transfer_confirmed':
      console.log('✅ Transfer completed!');
      break;
    case 'transfer_failed':
      console.log('❌ Transfer failed');
      break;
  }
});
```

## 5. Advanced Features

### Balance Checking

```javascript
// Check balances on Avalanche
const avalancheBalances = await sdk.getBalance('avalanche', address);
console.log('Avalanche balances:', avalancheBalances);

// Check balances on Aptos
const aptosBalances = await sdk.getBalance('aptos-testnet', address);
console.log('Aptos balances:', aptosBalances);
```

### Address Validation

```javascript
// Validate EVM address for Avalanche
const isValidEVM = sdk.validateAddress('0x742d35...', 'avalanche');

// Validate Aptos address
const isValidAptos = sdk.validateAddress('0x1234567890abcdef...', 'aptos-testnet');
```

### Transaction Status Check

```javascript
// Check Avalanche transaction
const avalancheStatus = await sdk.getTransactionStatus('avalanche', txHash);

// Check Aptos transaction  
const aptosStatus = await sdk.getTransactionStatus('aptos-testnet', txHash);
```

## 6. Error Handling

```javascript
try {
  const result = await sdk.transfer(request, signer);
  console.log('Success:', result.txHash);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    alert('You need more tokens for this transfer');
  } else if (error.code === 'USER_REJECTED') {
    console.log('User cancelled the transaction');
  } else if (error.code === 'HEALTH_CHECK_ERROR') {
    console.log('Service is unavailable');
  } else {
    alert(`Transfer failed: ${error.message}`);
  }
}
```

## Complete Example

Here's a complete React component that demonstrates the full flow:

```jsx
import React, { useState } from 'react';
import { SmoothSendSDK, getTokenDecimals } from '@smoothsend/sdk';
import { ethers } from 'ethers';

const GaslessTransfer = () => {
  const [sdk] = useState(new SmoothSendSDK());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  // Listen to events
  React.useEffect(() => {
    const handleEvent = (event) => {
      const messages = {
        transfer_initiated: 'Preparing transfer...',
        transfer_signed: 'Transaction signed',
        transfer_submitted: 'Submitting to blockchain...',
        transfer_confirmed: '✅ Transfer completed!',
        transfer_failed: '❌ Transfer failed'
      };
      setStatus(messages[event.type] || event.type);
    };

    sdk.addEventListener(handleEvent);
    return () => sdk.removeEventListener(handleEvent);
  }, [sdk]);

  const handleTransfer = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      // Connect wallet
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      // Get proper decimals and format amount
      const usdcDecimals = getTokenDecimals('USDC');
      
      // Execute transfer
      const transferResult = await sdk.transfer({
        from: await signer.getAddress(),
        to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
        token: 'USDC',
        amount: ethers.parseUnits('1', usdcDecimals).toString(), // 1 USDC
        chain: 'avalanche'
      }, signer);
      
      setResult(transferResult);
    } catch (error) {
      console.error('Transfer failed:', error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px' }}>
      <h2>Gasless USDC Transfer</h2>
      
      <button 
        onClick={handleTransfer} 
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Processing...' : 'Send 1 USDC (Gasless)'}
      </button>

      {status && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <strong>Status:</strong> {status}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
          <h3>✅ Transfer Successful!</h3>
          <p><strong>Transaction:</strong> {result.txHash}</p>
          <p><strong>Block:</strong> {result.blockNumber}</p>
          <p><strong>Fee:</strong> {result.fee}</p>
          <p><strong>Execution Time:</strong> {result.executionTime}ms</p>
          <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">
            View on Explorer →
          </a>
        </div>
      )}
    </div>
  );
};

export default GaslessTransfer;
```

## Next Steps

- 📖 **[Read the full API documentation](./api/)**
- 🔗 **[Explore Avalanche integration guide](./chains/avalanche)**
- 💡 **[Check out more examples](./examples/)**
- 🛠️ **[View integration patterns](./examples/)**

## Need Help?

- 📧 **Email support**: support@smoothsend.xyz
- 🐛 **Report issues**: Create an issue on GitHub
- 📖 **Documentation**: Read the full API reference
