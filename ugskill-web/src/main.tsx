import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initSentry } from './config/sentry'
import './index.css'
import App from './App.tsx'

// Initialize Sentry before the React app boots
initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,   // 1 minute
      gcTime: 300_000,     // 5 minutes
      retry: 1,            // Retry once on failure
      refetchOnWindowFocus: false, // Prevents excessive refetches
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
