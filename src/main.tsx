import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { Toaster } from "sonner";
import App from './App.tsx';
import './index.css';
import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" },
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <Toaster position="top-right" theme="dark" />
          <App />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>,
);
