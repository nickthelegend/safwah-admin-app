import { useState } from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { useDynamicWallet } from '../hooks/useDynamicWallet';
import { Transaction } from '@mysten/sui/transactions';
import { CONTRACTS } from '../lib/contracts';
import { Shield, DollarSign, Users, TrendingUp, AlertTriangle, Key, Landmark, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDashboard() {
  const { currentAccount: account, mutateAsync: signAndExecute } = useDynamicWallet();

  // Fetch escrow object for protocol stats
  const { data: escrowObj, refetch: refetchEscrow, isRefetching: isRefetchingEscrow } = useSuiClientQuery('getObject', {
    id: CONTRACTS.ESCROW_ID,
    options: { showContent: true },
  });

  // Fetch treasury for fee stats
  const { data: treasuryObj, refetch: refetchTreasury, isRefetching: isRefetchingTreasury } = useSuiClientQuery('getObject', {
    id: CONTRACTS.TREASURY_ID,
    options: { showContent: true },
  });

  const escrow = (escrowObj?.data?.content as any)?.fields ?? {};
  const treasury = (treasuryObj?.data?.content as any)?.fields ?? {};

  const escrowBalance = ((Number(escrow.balance ?? 0)) / 1_000_000).toFixed(2);
  const totalClaims = escrow.total_claims ?? 0;
  const totalSettled = escrow.total_settled ?? 0;
  const totalRefunded = ((Number(escrow.total_usdc_refunded ?? 0)) / 1_000_000).toFixed(2);
  const feesCollected = ((Number(treasury.balance ?? 0)) / 1_000_000).toFixed(2);
  const totalWithdrawals = treasury.total_withdrawals ?? 0;

  const stats = [
    { label: 'USDC in Escrow', value: `$${escrowBalance}`, icon: DollarSign, color: '#F59E0B', sublabel: 'pending final release' },
    { label: 'Fees Collected', value: `$${feesCollected}`, icon: TrendingUp, color: '#10B981', sublabel: '5% withdrawal fee' },
    { label: 'Total Claims', value: totalClaims, icon: Shield, color: '#3B82F6', sublabel: `${totalSettled} settled` },
    { label: 'Total Refunded', value: `$${totalRefunded}`, icon: Users, color: '#8B5CF6', sublabel: `${totalWithdrawals} withdrawals` },
  ];

  // ---- Issue Verifier Cap ----
  const [verifierAddress, setVerifierAddress] = useState('');
  const [verifierName, setVerifierName] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  const handleIssueVerifier = async () => {
    if (!account) {
      toast.error('Wallet not connected');
      return;
    }
    if (!verifierAddress || !verifierName) {
      toast.error('Please fill in name and address');
      return;
    }
    setIsIssuing(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::safwah::issue_verifier_cap`,
        arguments: [
          tx.object(CONTRACTS.ADMIN_ID),
          tx.pure.vector('u8', Array.from(new TextEncoder().encode(verifierName))),
          tx.pure.address(verifierAddress),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      toast.success(
        <div>
          <p className="font-bold">VerifierCap issued successfully!</p>
          <a
            href={`https://suiscan.xyz/testnet/tx/${result.digest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline text-xs font-semibold block mt-1"
          >
            View on Sui Explorer ↗
          </a>
        </div>
      );
      setVerifierAddress('');
      setVerifierName('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue VerifierCap');
    } finally {
      setIsIssuing(false);
    }
  };

  // ---- Revoke Verifier Cap ----
  const [revokeCapId, setRevokeCapId] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevokeVerifier = async () => {
    if (!account) {
      toast.error('Wallet not connected');
      return;
    }
    if (!revokeCapId) return;
    setIsRevoking(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::safwah::revoke_verifier`,
        arguments: [
          tx.object(CONTRACTS.ADMIN_ID),
          tx.object(CONTRACTS.ESCROW_ID),
          tx.pure.id(revokeCapId),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      toast.success(
        <div>
          <p className="font-bold">VerifierCap revoked on-chain!</p>
          <a
            href={`https://suiscan.xyz/testnet/tx/${result.digest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline text-xs font-semibold block mt-1"
          >
            View on Sui Explorer ↗
          </a>
        </div>
      );
      setRevokeCapId('');
      refetchEscrow();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke VerifierCap');
    } finally {
      setIsRevoking(false);
    }
  };

  // ---- FTA Merchant Verification ----
  const [merchantLicenseId, setMerchantLicenseId] = useState('');
  const [isTogglingMerchant, setIsTogglingMerchant] = useState(false);

  const handleSetFtaVerified = async (verified: boolean) => {
    if (!account) {
      toast.error('Wallet not connected');
      return;
    }
    if (!merchantLicenseId) {
      toast.error('Please enter Merchant License object ID');
      return;
    }
    setIsTogglingMerchant(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::merchant::set_fta_verified`,
        arguments: [
          tx.object(CONTRACTS.MERCHANT_ADMIN_CAP_ID),
          tx.object(merchantLicenseId),
          tx.pure.bool(verified),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      toast.success(
        <div>
          <p className="font-bold">Merchant {verified ? 'verified' : 'suspended'} on-chain!</p>
          <a
            href={`https://suiscan.xyz/testnet/tx/${result.digest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline text-xs font-semibold block mt-1"
          >
            View on Sui Explorer ↗
          </a>
        </div>
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update merchant status');
    } finally {
      setIsTogglingMerchant(false);
    }
  };

  // ---- Withdraw Fees ----
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const handleWithdrawFees = async () => {
    if (!account) {
      toast.error('Wallet not connected');
      return;
    }
    setIsWithdrawing(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${CONTRACTS.PACKAGE_ID}::safwah_treasury::admin_withdraw_fees`,
        arguments: [
          tx.object(CONTRACTS.ADMIN_ID),
          tx.object(CONTRACTS.TREASURY_ID),
        ],
      });
      const result = await signAndExecute({ transaction: tx });
      toast.success(
        <div>
          <p className="font-bold">Accumulated fees successfully withdrawn!</p>
          <a
            href={`https://suiscan.xyz/testnet/tx/${result.digest}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline text-xs font-semibold block mt-1"
          >
            View on Sui Explorer ↗
          </a>
        </div>
      );
      refetchTreasury();
    } catch (err: any) {
      toast.error(err.message || 'Failed to withdraw fees');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleRefresh = () => {
    refetchEscrow();
    refetchTreasury();
    toast.success('Stats updated from Sui network');
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        borderBottom: '1px solid rgba(212, 175, 55, 0.15)',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '16px',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(212, 175, 55, 0.3)'
          }}>
            <Shield size={24} style={{ color: '#FDE047' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#F5EBE6', margin: 0 }}>FTA Admin Portal</h1>
            <p style={{ fontSize: '12px', color: '#C5A880', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              UAE Federal Tax Authority • Operations
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefetchingEscrow || isRefetchingTreasury}
          style={{
            background: 'rgba(25, 25, 25, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
        >
          <RefreshCw size={14} className={isRefetchingEscrow || isRefetchingTreasury ? 'animate-spin' : ''} />
          Sync
        </button>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} style={{
              backgroundColor: '#121212',
              border: '1px solid rgba(212, 175, 55, 0.15)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: `${s.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px'
              }}>
                <Icon size={18} style={{ color: s.color }} />
              </div>
              <span style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff' }}>
                {s.value}
              </span>
              <span style={{ fontSize: '10px', color: '#737373', marginTop: '2px' }}>
                {s.sublabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Actions Panel */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px'
      }}>
        {/* Issue Verifier Card */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: '#FDE047' }} />
            Issue Officer VerifierCap
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#737373' }}>
            Authorizes Dubai Airport customs staff to inspect and approve VAT refunds on-chain.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold' }}>OFFICER NAME</label>
              <input
                type="text"
                placeholder="e.g. Dubai Airport Terminal 3 Staff"
                value={verifierName}
                onChange={e => setVerifierName(e.target.value)}
                style={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold' }}>OFFICER SUI ADDRESS</label>
              <input
                type="text"
                placeholder="0x..."
                value={verifierAddress}
                onChange={e => setVerifierAddress(e.target.value)}
                style={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <button
              onClick={handleIssueVerifier}
              disabled={isIssuing || !verifierAddress || !verifierName}
              style={{
                backgroundColor: '#FDE047',
                border: 'none',
                color: '#000',
                padding: '14px',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                marginTop: '8px',
                transition: 'all 0.2s'
              }}
            >
              {isIssuing ? 'Issuing Cap...' : 'Issue VerifierCap'}
            </button>
          </div>
        </div>

        {/* Revoke Verifier Card */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#EF4444' }} />
            Revoke VerifierCap
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#737373' }}>
            Blacklist a compromised/lost VerifierCap immediately. Revoked caps are blocked from approving claims.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold' }}>VERIFIER CAP OBJECT ID</label>
              <input
                type="text"
                placeholder="0x..."
                value={revokeCapId}
                onChange={e => setRevokeCapId(e.target.value)}
                style={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <button
              onClick={handleRevokeVerifier}
              disabled={isRevoking || !revokeCapId}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#EF4444',
                padding: '14px',
                borderRadius: '14px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px',
                marginTop: '28px',
                transition: 'all 0.2s'
              }}
            >
              {isRevoking ? 'Revoking Cap...' : 'Revoke & Blacklist'}
            </button>
          </div>
        </div>

        {/* Merchant Registry Verification */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Landmark size={18} style={{ color: '#FDE047' }} />
            FTA Merchant Registry Control
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#737373' }}>
            Enable or suspend merchant license verification to ensure tax-compliance and block fraud.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#C5A880', fontWeight: 'bold' }}>MERCHANT LICENSE OBJECT ID</label>
              <input
                type="text"
                placeholder="0x..."
                value={merchantLicenseId}
                onChange={e => setMerchantLicenseId(e.target.value)}
                style={{
                  backgroundColor: '#0A0A0A',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => handleSetFtaVerified(true)}
                disabled={isTogglingMerchant || !merchantLicenseId}
                style={{
                  flex: 1,
                  backgroundColor: '#10B981',
                  border: 'none',
                  color: '#000',
                  padding: '14px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                Verify License ✓
              </button>
              <button
                onClick={() => handleSetFtaVerified(false)}
                disabled={isTogglingMerchant || !merchantLicenseId}
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  border: 'none',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'all 0.2s'
                }}
              >
                Suspend ✗
              </button>
            </div>
          </div>
        </div>

        {/* Treasury Fee Withdraw */}
        <div style={{
          backgroundColor: '#121212',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 10px 40px rgba(212, 175, 55, 0.05)'
        }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} style={{ color: '#FDE047' }} />
            Fee Collection Treasury
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#737373' }}>
            Accumulated protocol fees from the 5% off-ramp fee. Settleable directly to the FTA Admin address.
          </p>

          <div style={{
            backgroundColor: '#0A0A0A',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid rgba(215, 175, 55, 0.1)',
            marginTop: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '11px', color: '#737373', fontWeight: 'bold' }}>AVAILABLE FOR WITHDRAWAL</span>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#FDE047', marginTop: '2px' }}>
                USDC {feesCollected}
              </div>
            </div>
            <Landmark size={28} style={{ color: '#FDE047', opacity: 0.2 }} />
          </div>

          <button
            onClick={handleWithdrawFees}
            disabled={isWithdrawing || Number(feesCollected) <= 0}
            style={{
              backgroundColor: '#FDE047',
              border: 'none',
              color: '#000',
              padding: '16px',
              borderRadius: '14px',
              cursor: 'pointer',
              fontWeight: '900',
              fontSize: '14px',
              marginTop: '4px',
              transition: 'all 0.2s',
              boxShadow: '0 6px 20px rgba(253, 224, 71, 0.15)'
            }}
          >
            {isWithdrawing ? 'Withdrawing Fees...' : 'Withdraw Protocol Fees'}
          </button>
        </div>
      </div>
    </div>
  );
}
