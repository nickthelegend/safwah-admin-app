import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { AdminDashboard } from '../pages/AdminDashboard';
import { toast } from 'sonner';

// Mock the contracts module so we have stable test object IDs
vi.mock('../lib/contracts', () => ({
  CONTRACTS: {
    PACKAGE_ID: '0xpackage123',
    ESCROW_ID: '0xescrow123',
    ADMIN_ID: '0xadmin123',
    MERCHANT_REGISTRY_ID: '0xregistry123',
    USDC_MOCK_ADMIN_ID: '0xusdcadmin123',
    TREASURY_ID: '0xtreasury123',
    MERCHANT_ADMIN_CAP_ID: '0xmerchantadmincap123',
  }
}));

// Mock @mysten/sui/transactions to prevent crypto/buffer errors in JSDOM
vi.mock('@mysten/sui/transactions', () => {
  class MockTransaction {
    moveCall = vi.fn();
    object = vi.fn().mockImplementation((val) => val);
    pure = Object.assign(
      vi.fn().mockImplementation((val) => val),
      {
        vector: vi.fn().mockImplementation((_type, val) => val),
        address: vi.fn().mockImplementation((val) => val),
        bool: vi.fn().mockImplementation((val) => val),
        id: vi.fn().mockImplementation((val) => val),
      }
    );
  }
  return {
    Transaction: MockTransaction,
  };
});

// Mock dapp-kit hooks
const mockSignAndExecute = vi.fn();
const mockRefetchEscrow = vi.fn();
const mockRefetchTreasury = vi.fn();
let mockAccount: any = { address: '0xadminaddress123' };

vi.mock('@mysten/dapp-kit', () => ({
  useCurrentAccount: () => mockAccount,
  useSignAndExecuteTransaction: () => ({ mutateAsync: mockSignAndExecute }),
  useSuiClientQuery: (queryName: string, params: any) => {
    if (queryName === 'getObject') {
      if (params.id === '0xescrow123') {
        // Escrow Mock
        return {
          data: {
            data: {
              content: {
                fields: {
                  balance: '150000000', // 150 USDC
                  total_claims: 20,
                  total_settled: 15,
                  total_usdc_refunded: '80000000', // 80 USDC refunded
                },
              },
            },
          },
          refetch: mockRefetchEscrow,
          isRefetching: false,
        };
      }
      if (params.id === '0xtreasury123') {
        // Treasury Mock
        return {
          data: {
            data: {
              content: {
                fields: {
                  balance: '25000000', // 25 USDC fees collected
                  total_withdrawals: 3,
                },
              },
            },
          },
          refetch: mockRefetchTreasury,
          isRefetching: false,
        };
      }
    }
    return { data: null, refetch: vi.fn(), isRefetching: false };
  },
  ConnectButton: () => <button>Mock ConnectButton</button>,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAccount = { address: '0xadminaddress123' };
  });

  test('renders portal header and stats cards correctly', () => {
    render(<AdminDashboard />);

    expect(screen.getByText('FTA Admin Portal')).toBeInTheDocument();
    expect(screen.getByText('UAE Federal Tax Authority • Operations')).toBeInTheDocument();

    // Stats checks
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // USDC in Escrow
    expect(screen.getByText('$25.00')).toBeInTheDocument();  // Fees Collected
    expect(screen.getByText('20')).toBeInTheDocument();      // Total Claims
    expect(screen.getByText('$80.00')).toBeInTheDocument();  // Total Refunded
  });

  test('Sync button triggers refetch for escrow and treasury', () => {
    render(<AdminDashboard />);

    const syncBtn = screen.getByText('Sync');
    fireEvent.click(syncBtn);

    expect(mockRefetchEscrow).toHaveBeenCalled();
    expect(mockRefetchTreasury).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Stats updated from Sui network');
  });

  test('can fill out and submit VerifierCap issuance', async () => {
    mockSignAndExecute.mockResolvedValue({ digest: 'mocktxhash-issue' });
    render(<AdminDashboard />);

    const nameInput = screen.getByPlaceholderText('e.g. Dubai Airport Terminal 3 Staff');
    const addressInput = screen.getAllByPlaceholderText('0x...')[0]; // First 0x... input is officer address

    fireEvent.change(nameInput, { target: { value: 'Officer Sarah' } });
    fireEvent.change(addressInput, { target: { value: '0xverifieraddress789' } });

    const issueBtn = screen.getByText('Issue VerifierCap');
    await act(async () => {
      fireEvent.click(issueBtn);
    });

    expect(mockSignAndExecute).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  test('can revoke VerifierCap', async () => {
    mockSignAndExecute.mockResolvedValue({ digest: 'mocktxhash-revoke' });
    render(<AdminDashboard />);

    const revokeInput = screen.getAllByPlaceholderText('0x...')[1]; // Second 0x... input is verifier cap ID

    fireEvent.change(revokeInput, { target: { value: '0xverifiercapobjectid123' } });

    const revokeBtn = screen.getByText('Revoke & Blacklist');
    await act(async () => {
      fireEvent.click(revokeBtn);
    });

    expect(mockSignAndExecute).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  test('can verify and suspend merchant licenses', async () => {
    mockSignAndExecute.mockResolvedValue({ digest: 'mocktxhash-merchant' });
    render(<AdminDashboard />);

    const merchantInput = screen.getAllByPlaceholderText('0x...')[2]; // Third 0x... input is merchant license object ID

    fireEvent.change(merchantInput, { target: { value: '0xmerchantlicenseid456' } });

    const verifyBtn = screen.getByText('Verify License ✓');
    await act(async () => {
      fireEvent.click(verifyBtn);
    });

    expect(mockSignAndExecute).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();

    const suspendBtn = screen.getByText('Suspend ✗');
    await act(async () => {
      fireEvent.click(suspendBtn);
    });

    expect(mockSignAndExecute).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalled();
  });

  test('can withdraw accumulated protocol fees', async () => {
    mockSignAndExecute.mockResolvedValue({ digest: 'mocktxhash-withdraw' });
    render(<AdminDashboard />);

    const withdrawBtn = screen.getByText('Withdraw Protocol Fees');
    await act(async () => {
      fireEvent.click(withdrawBtn);
    });

    expect(mockSignAndExecute).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });
});
