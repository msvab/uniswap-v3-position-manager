import { switchChain, walletClient } from '../logic/clients.js';
import { useEffect, useState } from 'preact/hooks';

const CHAINS = [
  { id: 1, name: 'Mainnet' },
  { id: 42161, name: 'Arbitrum' },
  { id: 10, name: 'Optimism' },
];

export function Chains() {
  const [selectedChainId, setSelectedChainId] = useState(null);

  const loadCurrentChain = async () => {
    const chainId = await walletClient.getChainId();
    setSelectedChainId(chainId);
  };

  useEffect(() => {
    loadCurrentChain();
    const interval = setInterval(async () => {
      loadCurrentChain();
    }, 5_000);

    return () => clearInterval(interval);
  }, []);

  const onSwitchChain = async (chain) => {
    if (walletClient.chain?.id !== chain.id) {
      await switchChain(chain);
      setSelectedChainId(chain.id);
    }
  };

  return (
    <ul class="chains">
      {CHAINS.map((chain) => (
        <li class={selectedChainId === chain.id ? 'selected' : ''} onClick={() => onSwitchChain(chain)}>
          {chain.name}
        </li>
      ))}
    </ul>
  );
}
