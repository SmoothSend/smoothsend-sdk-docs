# Quick Start

Get up and running with SmoothSend SDK in under 5 minutes.

## 1. Installation

```bash
npm install @smoothsend/sdk
```

## 2. Initialize SDK

```typescript
import { SmoothSendSDK } from '@smoothsend/sdk';

const sdk = new SmoothSendSDK({
  timeout: 30000,
  retries: 3
});
console.log('Supported chains:', sdk.getSupportedChains()); // ['avalanche', 'aptos']
```

## 3. Your First Transfer

### Avalanche Example

```javascript
import { ethers } from 'ethers';

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Execute gasless transfer
const result = await sdk.transfer({
  from: await signer.getAddress(),
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'USDC',
  amount: ethers.parseUnits('10', 6).toString(), // 10 USDC
  chain: 'avalanche'
}, signer);

console.log('Success! TX:', result.txHash);
```

### Aptos Example

```javascript
import { Ed25519PrivateKey, Account } from '@aptos-labs/ts-sdk';

// Create account
const privateKey = new Ed25519PrivateKey('0x...');
const account = Account.fromPrivateKey({ privateKey });

// Execute gasless transfer
const result = await sdk.transfer({
  from: account.accountAddress.toString(),
  to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
  token: 'APT',
  amount: '100000000', // 1 APT (8 decimals)
  chain: 'aptos'
}, privateKey);

console.log('Success! TX:', result.txHash);
```

## 4. Add Event Monitoring

```javascript
sdk.addEventListener((event) => {
  console.log(`[${event.chain}] ${event.type}:`, event.data);
  
  switch (event.type) {
    case 'transfer_initiated':
      showStatus('Preparing transfer...');
      break;
    case 'transfer_confirmed':
      showStatus('✅ Transfer completed!');
      break;
    case 'transfer_failed':
      showStatus('❌ Transfer failed');
      break;
  }
});
```

## 5. Error Handling

```javascript
try {
  const result = await sdk.transfer(request, signer);
  console.log('Success:', result.txHash);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    alert('You need more tokens for this transfer');
  } else if (error.code === 'USER_REJECTED') {
    console.log('User cancelled the transaction');
  } else {
    alert(`Transfer failed: ${error.message}`);
  }
}
```

## Complete Example

Here's a complete React component that demonstrates the full flow:

```jsx
import React, { useState } from 'react';
import { SmoothSendSDK } from '@smoothsend/sdk';
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
      
      // Execute transfer
      const transferResult = await sdk.transfer({
        from: await signer.getAddress(),
        to: '0x742d35cc6634c0532925a3b8d2d2d2d2d2d2d2d3',
        token: 'USDC',
        amount: ethers.parseUnits('1', 6).toString(), // 1 USDC
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
- 🔗 **[Explore chain-specific guides](./chains/avalanche)**
- 💡 **[Check out more examples](./examples/)**
- 🛠️ **[View integration patterns](./examples/)**

## Need Help?

- 💬 **[Join our Discord](https://discord.gg/smoothsend)**
- 📧 **[Email support](mailto:support@smoothsend.xyz)**
- 🐛 **[Report issues on GitHub](https://github.com/smoothsend/sdk/issues)**
