import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'GOLDVAULT_OFFLINE_CACHE',
});

createRoot(document.getElementById('root')!).render(
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{ persister }}
    onSuccess={() => {
      // Resume mutations or any other post-hydration logic
      console.log('[GoldVault] Cache Hydrated');
    }}
  >
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--surface-2)',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
        },
        success: {
          iconTheme: {
            primary: 'var(--success)',
            secondary: 'var(--surface-2)',
          },
        },
      }}
    />
  </PersistQueryClientProvider>
);
