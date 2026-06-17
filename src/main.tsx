import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, createNetworkConfig } from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { SuiWalletConnectors } from "@dynamic-labs/sui";
import { Toaster } from "sonner";
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient();

const { networkConfig } = createNetworkConfig({
  testnet: { url: getJsonRpcFullnodeUrl("testnet"), network: "testnet" },
  mainnet: { url: getJsonRpcFullnodeUrl("mainnet"), network: "mainnet" },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <DynamicContextProvider
          settings={{
            environmentId: '25eb8888-e9d6-4967-8017-448572067c5d',
            walletConnectors: [SuiWalletConnectors],
          }}
        >
          <Toaster position="top-right" theme="dark" />
          <App />
        </DynamicContextProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>,
);
