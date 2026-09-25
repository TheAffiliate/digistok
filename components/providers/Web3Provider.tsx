'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { inAppWallet, createWallet } from 'thirdweb/wallets';

export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID!,
});

// Embedded Wallet for non-crypto users + standard EVM options
export const wallets = [
  inAppWallet({
    auth: {
      options: ['email', 'google', 'apple'],
    },
  }),
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
];

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
}