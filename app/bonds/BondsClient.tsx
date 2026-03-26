'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/components/AuthContext';
import { usePortfolio } from '../components/FinanceContext';
import { useNotifications } from '@/app/components/NotificationContext';
import { Plus, Trash2, Edit3, Search, Loader2 } from 'lucide-react';
import { EmptyPortfolioVisual } from '@/app/components/Visuals';
import { logError } from '@/lib/utils/logger';
import { calculateApproxBondYield, calculateBondPositionMetrics } from '@/lib/utils/bonds';

import { Bond } from '@/lib/types';

interface BondSearchResult {
  symbol: string;
  companyName: string;
  issuer?: string;
  name?: string;
  couponRate?: number;
  maturityDate?: string;
}

const fieldStyles = {
  label: {
    display: 'block',
    color: '#64748b',
    fontSize: '0.8rem',
    fontWeight: '700',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #111111',
    borderRadius: '12px',
    color: '#fff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
  },
} as const;

function StatCard({
  label,
  value,
  valueColor = '#fff',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      className="premium-card"
      style={{
        background: '#050505',
        padding: '20px',
        borderRadius: '24px',
        border: '1px solid #111111',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: '0.65rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '10px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', fontWeight: '950', color: valueColor }}>
        {value}
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
}) {
  return (
    <div>
      <label style={fieldStyles.label}>{label}</label>
      <input
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        min={min}
        step={type === 'number' ? 'any' : undefined}
        style={fieldStyles.input}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label style={fieldStyles.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={fieldStyles.input}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function BondsClient() {
  const { user } = useAuth();
  const { bonds, loading, addBond, updateBond, deleteBond, refreshPortfolio } = usePortfolio();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [couponRate, setCouponRate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BondSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const resetForm = useCallback((closeModal: boolean = true) => {
    setEditId(null);
    setName('');
    setCompanyName('');
    setQuantity('');
    setAvgPrice('');
    setCurrentPrice('');
    setCouponRate('');
    setMaturityDate('');
    setStatus('ACTIVE');
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    if (closeModal) {
      setIsModalOpen(false);
    }
  }, []);

  const openCreateModal = () => {
    resetForm(false);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (bonds.length === 0 && !loading) {
      refreshPortfolio();
    }
  }, [bonds.length, loading, refreshPortfolio]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    const timer = setTimeout(() => {
      if (trimmedQuery.length >= 2) {
        void handleSearch(trimmedQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/bonds/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Bond search failed');
      }

      const results = Array.isArray(data) ? (data as BondSearchResult[]) : [];
      setSearchResults(results);
      setShowResults(results.length > 0);
    } catch (error) {
      setSearchResults([]);
      setShowResults(false);
      logError('Bond search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectBond = async (item: BondSearchResult) => {
    const [fallbackName, fallbackIssuer] = item.companyName.split(' - ');

    setSearchQuery(item.symbol);
    setName(item.name || fallbackName || item.companyName);
    setCompanyName(item.issuer || fallbackIssuer || '');
    if (item.couponRate != null) setCouponRate(item.couponRate.toString());
    if (item.maturityDate) setMaturityDate(item.maturityDate);
    setShowResults(false);

    try {
      const response = await fetch(`/api/bonds/quote?symbol=${encodeURIComponent(item.symbol)}`);
      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Bond quote fetch failed');
      }

      if (data.name) setName(data.name);
      if (data.companyName) setCompanyName(data.companyName);
      if (data.currentPrice != null) {
        setAvgPrice(data.currentPrice.toString());
        setCurrentPrice(data.currentPrice.toString());
      }
      if (data.couponRate != null) setCouponRate(data.couponRate.toString());
      if (data.maturityDate) setMaturityDate(data.maturityDate);
    } catch (error) {
      logError('Bond quote fetch failed:', error);
    }
  };

  const stats = useMemo(() => {
    const totalInvested = bonds.reduce((sum, bond) => {
      return sum + (bond.avgPrice || 0) * (bond.quantity || 0);
    }, 0);
    const totalCurrent = bonds.reduce((sum, bond) => {
      return (
        sum +
        (bond.currentValue || (bond.currentPrice || bond.avgPrice || 0) * (bond.quantity || 0))
      );
    }, 0);
    const totalPnl = totalCurrent - totalInvested;
    const yieldBearingBonds = bonds.filter(
      (bond) => (bond.yieldToMaturity ?? bond.couponRate ?? 0) > 0
    );
    const avgYield =
      yieldBearingBonds.length > 0
        ? yieldBearingBonds.reduce((sum, bond) => {
            return sum + (bond.yieldToMaturity ?? bond.couponRate ?? 0);
          }, 0) / yieldBearingBonds.length
        : 0;

    return { totalInvested, totalCurrent, totalPnl, avgYield, activeCount: bonds.length };
  }, [bonds]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showNotification('error', 'Please sign in before saving bond holdings.');
      return;
    }

    if (!searchQuery.trim() || !name.trim()) {
      showNotification('error', 'Bond identifier and display name are required.');
      return;
    }

    const qty = Number(quantity);
    const price = Number(avgPrice);
    const marketPrice = Number(currentPrice || avgPrice);
    const couponValue = couponRate ? Number(couponRate) : null;

    if (!Number.isFinite(qty) || qty <= 0) {
      showNotification('error', 'Quantity must be a positive number.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      showNotification('error', 'Average price must be a positive number.');
      return;
    }
    if (!Number.isFinite(marketPrice) || marketPrice <= 0) {
      showNotification('error', 'Current price must be a positive number.');
      return;
    }
    if (couponRate && (!Number.isFinite(couponValue) || couponValue! < 0)) {
      showNotification('error', 'Coupon rate must be a non-negative number.');
      return;
    }
    if (maturityDate && Number.isNaN(new Date(`${maturityDate}T00:00:00`).getTime())) {
      showNotification('error', 'Please provide a valid maturity date.');
      return;
    }

    const metrics = calculateBondPositionMetrics(qty, price, marketPrice);
    const ytm =
      couponValue != null && maturityDate
        ? calculateApproxBondYield({
            currentPrice: marketPrice,
            couponRate: couponValue,
            maturityDate,
            faceValue: 1000,
          })
        : null;

    const bondData: Omit<Bond, 'id'> = {
      name: name.trim(),
      companyName: companyName.trim() || undefined,
      isin: searchQuery.trim().toUpperCase() || undefined,
      quantity: qty,
      avgPrice: price,
      currentPrice: marketPrice,
      couponRate: couponValue || undefined,
      maturityDate: maturityDate || undefined,
      status: status || 'ACTIVE',
      investmentAmount: metrics.invested,
      currentValue: metrics.currentValue,
      pnl: metrics.pnl,
      pnlPercentage: metrics.pnlPercentage,
      yieldToMaturity: ytm ?? undefined,
    };

    try {
      if (editId) {
        await updateBond(editId, bondData);
        showNotification('success', 'Bond updated successfully');
      } else {
        await addBond(bondData);
        showNotification('success', 'Bond added successfully');
      }

      resetForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error saving bond';
      showNotification('error', message);
    }
  };

  const handleEdit = (bond: Bond) => {
    setEditId(bond.id);
    setName(bond.name);
    setCompanyName(bond.companyName || '');
    setSearchQuery(bond.isin || '');
    setQuantity(bond.quantity?.toString() || '');
    setAvgPrice(bond.avgPrice?.toString() || '');
    setCurrentPrice(bond.currentPrice?.toString() || bond.avgPrice?.toString() || '');
    setCouponRate(bond.couponRate?.toString() || '');
    setMaturityDate(bond.maturityDate || '');
    setStatus(bond.status || 'ACTIVE');
    setSearchResults([]);
    setShowResults(false);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (
      !(await customConfirm({ title: 'Delete Bond', message: 'Are you sure?', type: 'warning' }))
    ) {
      return;
    }

    try {
      await deleteBond(id);
      showNotification('success', 'Bond deleted successfully');
    } catch (error) {
      logError('Failed to delete bond:', error);
      showNotification('error', 'Failed to delete bond');
    }
  };

  if (loading) {
    return (
      <div
        className="page-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <div style={{ color: '#2dd4bf', fontWeight: 'bold' }}>Loading your bonds...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div
        className="flex-col-mobile"
        style={{
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '20px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontWeight: '900',
              margin: 0,
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Bonds Terminal
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px' }}>
            Manage and track your fixed-income securities securely across {stats.activeCount}{' '}
            positions.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '16px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 16px rgba(45, 212, 191, 0.2)',
            transition: 'all 0.3s',
          }}
        >
          <Plus size={20} /> Add Bond
        </button>
      </div>

      <div className="grid-responsive-4" style={{ gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Invested" value={`INR ${stats.totalInvested.toLocaleString()}`} />
        <StatCard label="Current Value" value={`INR ${stats.totalCurrent.toLocaleString()}`} />
        <StatCard
          label="Total P&L"
          value={`INR ${stats.totalPnl.toLocaleString()}`}
          valueColor={stats.totalPnl >= 0 ? '#10b981' : '#f43f5e'}
        />
        <StatCard label="Avg Yield" value={`${stats.avgYield.toFixed(2)}%`} valueColor="#2dd4bf" />
      </div>

      <div className="premium-card" style={{ padding: 0, overflow: 'hidden' }}>
        {bonds.length > 0 ? (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.9rem',
            }}
          >
            <thead>
              <tr
                style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid #111111' }}
              >
                {['Bond Name', 'Qty / Price', 'Yield', 'Current Value', 'Actions'].map((label) => (
                  <th
                    key={label}
                    style={{
                      padding: '16px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      textAlign:
                        label === 'Actions' ? 'center' : label === 'Bond Name' ? 'left' : 'right',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bonds.map((bond) => {
                const statusColor =
                  bond.status === 'MATURED'
                    ? '#f59e0b'
                    : bond.status === 'SOLD'
                      ? '#f43f5e'
                      : '#10b981';
                const pnl = bond.pnl || 0;

                return (
                  <tr key={bond.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 800, color: '#fff' }}>{bond.name}</div>
                      {bond.companyName && (
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                          {bond.companyName}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                          marginTop: '8px',
                          alignItems: 'center',
                        }}
                      >
                        {bond.maturityDate && (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            Matures {new Date(`${bond.maturityDate}T00:00:00`).toLocaleDateString()}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: '900',
                            padding: '4px 8px',
                            borderRadius: '999px',
                            background: `${statusColor}18`,
                            color: statusColor,
                          }}
                        >
                          {bond.status || 'ACTIVE'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', color: '#cbd5e1' }}>
                      <div>
                        {bond.quantity} / INR {bond.avgPrice?.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        Last price INR {bond.currentPrice?.toLocaleString()}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        textAlign: 'right',
                        fontWeight: '700',
                        color: '#2dd4bf',
                      }}
                    >
                      <div>{bond.couponRate ? `${bond.couponRate}% coupon` : 'N/A'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        {bond.yieldToMaturity ? `YTM ${bond.yieldToMaturity}%` : 'YTM pending'}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: '16px',
                        textAlign: 'right',
                        fontWeight: '700',
                        color: '#fff',
                      }}
                    >
                      <div>INR {bond.currentValue?.toLocaleString()}</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: pnl >= 0 ? '#10b981' : '#f43f5e',
                          marginTop: '4px',
                        }}
                      >
                        {pnl >= 0 ? '+' : ''}INR {pnl.toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEdit(bond)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          marginRight: '12px',
                        }}
                      >
                        <Edit3 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(bond.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f43f5e',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
            <EmptyPortfolioVisual />
            <div style={{ fontWeight: '700', marginTop: '20px' }}>
              No bonds found in your portfolio.
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="premium-card fade-in"
            style={{
              width: '100%',
              maxWidth: '560px',
              background: '#050505',
              padding: '32px',
              borderRadius: '24px',
            }}
          >
            <h2 style={{ color: '#fff', marginBottom: '24px', fontWeight: '900' }}>
              {editId ? 'Edit Bond' : 'Add New Bond'}
            </h2>
            <form
              onSubmit={handleAction}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div style={{ position: 'relative' }}>
                <label style={fieldStyles.label}>Search Bond / ISIN *</label>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={16}
                    color="#64748b"
                    style={{ position: 'absolute', left: '12px', top: '14px' }}
                  />
                  <input
                    required
                    value={searchQuery}
                    onChange={(e) => {
                      const nextValue = e.target.value;
                      setSearchQuery(nextValue);
                      if (!nextValue) {
                        setName('');
                        setCompanyName('');
                        setCouponRate('');
                        setMaturityDate('');
                        setShowResults(false);
                      }
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowResults(true);
                    }}
                    placeholder="e.g. NHAI or IN0020230085"
                    style={{ ...fieldStyles.input, padding: '12px 12px 12px 36px' }}
                  />
                  {isSearching && (
                    <Loader2
                      size={16}
                      className="spin-animation"
                      color="#64748b"
                      style={{ position: 'absolute', right: '12px', top: '14px' }}
                    />
                  )}
                </div>

                {showResults && searchResults.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      background: '#111111',
                      border: '1px solid #1a1a1a',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      zIndex: 10,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {searchResults.map((result, index) => (
                      <div
                        key={`${result.symbol}-${index}`}
                        onClick={() => selectBond(result)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom:
                            index < searchResults.length - 1 ? '1px solid #1a1a1a' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{result.symbol}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                          {result.companyName}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.72rem' }}>
                          {result.couponRate ? `${result.couponRate}% coupon` : 'Coupon pending'}
                          {result.maturityDate ? ` • Matures ${result.maturityDate}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <TextField
                label="Bond Name (Display) *"
                value={name}
                onChange={setName}
                required
                placeholder="Auto-filled or specify custom name"
              />
              <TextField
                label="Issuer / Company"
                value={companyName}
                onChange={setCompanyName}
                placeholder="Issuer name"
              />
              <div style={fieldStyles.grid}>
                <TextField
                  label="Quantity *"
                  value={quantity}
                  onChange={setQuantity}
                  type="number"
                  required
                  min="0"
                />
                <TextField
                  label="Avg Price *"
                  value={avgPrice}
                  onChange={setAvgPrice}
                  type="number"
                  required
                  min="0"
                />
                <TextField
                  label="Current Price *"
                  value={currentPrice}
                  onChange={setCurrentPrice}
                  type="number"
                  required
                  min="0"
                />
              </div>
              <div style={fieldStyles.grid}>
                <TextField
                  label="Coupon Rate (%)"
                  value={couponRate}
                  onChange={setCouponRate}
                  type="number"
                  min="0"
                />
                <TextField
                  label="Maturity Date"
                  value={maturityDate}
                  onChange={setMaturityDate}
                  type="date"
                />
                <SelectField
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={['ACTIVE', 'MATURED', 'SOLD']}
                />
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => resetForm()}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: 'transparent',
                    border: '1px solid #111111',
                    color: '#94a3b8',
                    borderRadius: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#0d9488',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '12px',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  {editId ? 'Save Changes' : 'Add Bond'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
