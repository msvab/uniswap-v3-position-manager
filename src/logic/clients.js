import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { optimism, arbitrum, mainnet } from 'viem/chains';

export const [ACCOUNT_ADDRESS] = await window.ethereum.request({
  method: 'eth_requestAccounts',
});

const publicClients = new Map();

export let publicClient = null;

export let walletClient = null;

export let switchChain = async (chain) => {
  publicClient = publicClients.get(chain.id);
  walletClient.chain = chain;
  await walletClient.switchChain({ id: chain.id });
};

export const initClients = async () => {
  for (const chain of [mainnet, arbitrum, optimism]) {
    publicClients.set(
      chain.id,
      createPublicClient({
        chain,
        transport: http(),
      }),
    );
  }

  walletClient = createWalletClient({
    account: ACCOUNT_ADDRESS,
    transport: custom(window.ethereum),
  });

  await walletClient.addChain({ chain: mainnet });
  await walletClient.addChain({ chain: arbitrum });
  await walletClient.addChain({ chain: optimism });

  publicClient = publicClients.get(await walletClient.getChainId());
};
