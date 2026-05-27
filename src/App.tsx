import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { AdminDashboard } from './pages/AdminDashboard';
import { Shield, Lock } from 'lucide-react';

function App() {
  const account = useCurrentAccount();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050505',
      color: '#F5EBE6',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Navigation Bar */}
        <nav style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#121212',
          padding: '16px 24px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} style={{ color: '#FDE047' }} />
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff', letterSpacing: '0.05em' }}>
              SAFWAH REGISTRY
            </span>
          </div>

          <ConnectButton />
        </nav>

        {account ? (
          <AdminDashboard />
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '120px 24px',
            textAlign: 'center',
            backgroundColor: '#121212',
            borderRadius: '32px',
            border: '1px solid rgba(212, 175, 55, 0.1)',
            gap: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.05)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
            }}>
              <Lock size={36} style={{ color: '#FDE047' }} />
            </div>

            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#fff', margin: '0 0 8px 0' }}>
                Secure Access Required
              </h2>
              <p style={{ fontSize: '14px', color: '#737373', margin: 0, maxWidth: '400px', lineHeight: 1.5 }}>
                Connect your administrative SUI wallet to access the UAE Federal Tax Authority protocol operations panel.
              </p>
            </div>

            <div style={{ marginTop: '8px' }}>
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
