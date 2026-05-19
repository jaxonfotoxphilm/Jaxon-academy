import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { BrandProvider } from './contexts/BrandContext.tsx'
import { VideoProvider } from './contexts/VideoContext.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

/**
 * Root-level ErrorBoundary catches any unhandled crash in the entire app tree,
 * preventing the dreaded "blank/black screen of death" on production errors.
 * Without this, a failed React.lazy chunk or a render crash shows nothing to the user.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      label="Application"
      fallback={
        <div style={{
          minHeight: '100vh',
          background: 'hsl(228, 80%, 3%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.5rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          color: 'white',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem' }}>🏛️</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Jaxon Academy</h1>
          <p style={{ color: 'hsl(225, 15%, 55%)', margin: 0, maxWidth: '600px' }} id="error-message-display">
            Something went wrong loading the app. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 2rem',
              background: 'hsl(224, 76%, 58%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Refresh Page
          </button>
        </div>
      }
    >
      <AuthProvider>
        <BrandProvider>
          <VideoProvider>
            <App />
          </VideoProvider>
        </BrandProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
