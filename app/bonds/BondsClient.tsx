'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/components/AuthContext';
import { useLedger, usePortfolio } from '../components/FinanceContext';
import { useNotifications } from '@/app/components/NotificationContext';
import {
  Plus,
  Trash2,
  Edit3,
  Search,
  Loader2,
  History,
  Star,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Calendar,
  X,
} from 'lucide-react';
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
  const { accounts } = useLedger();
  const {
    bonds,
    loading,
    addBond,
    updateBond,
    deleteBond,
    bondTransactions,
    addBondTransaction,
    deleteBondTransaction,
    refreshPortfolio,
  } = usePortfolio();
  const { showNotification, confirm: customConfirm } = useNotifications();

  const [activeTab, setActiveTab] = useState<'holdings' | 'history' | 'lifetime'>('holdings');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'bond' | 'transaction'>('bond');

  // Bond form states
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

  // Transaction form states
  const [selectedBondId, setSelectedBondId] = useState<number | ''>('');
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [isTypeLocked, setIsTypeLocked] = useState(false);
  const [txQuantity, setTxQuantity] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');

  const resetBondForm = useCallback((closeModal: boolean = true) => {
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

  const resetTransactionForm = useCallback(() => {
    setSelectedBondId('');
    setTransactionType('BUY');
    setIsTypeLocked(false);
    setTxQuantity('');
    setTxPrice('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes('');
    setSelectedAccountId('');
  }, []);

  const openCreateModal = () => {
    setModalType('bond');
    resetBondForm(false);
    setIsModalOpen(true);
  };

  const handleSellBond = (bond: Bond) => {
    setModalType('transaction');
    setSelectedBondId(bond.id);
    setTransactionType('SELL');
    setTxQuantity(bond.quantity.toString());
    setTxPrice(bond.currentPrice?.toString() || bond.avgPrice?.toString() || '');
    setIsTypeLocked(true);
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
    const activeBonds = bonds.filter((b) => b.status !== 'SOLD');
    const totalInvested = activeBonds.reduce((sum, bond) => {
      return sum + (bond.avgPrice || 0) * (bond.quantity || 0);
    }, 0);
    const totalCurrent = activeBonds.reduce((sum, bond) => {
      return (
        sum +
        (bond.currentValue || (bond.currentPrice || bond.avgPrice || 0) * (bond.quantity || 0))
      );
    }, 0);
    const totalPnl = totalCurrent - totalInvested;
    const yieldBearingBonds = activeBonds.filter(
      (bond) => (bond.yieldToMaturity ?? bond.couponRate ?? 0) > 0
    );
    const avgYield =
      yieldBearingBonds.length > 0
        ? yieldBearingBonds.reduce((sum, bond) => {
            return sum + (bond.yieldToMaturity ?? bond.couponRate ?? 0);
          }, 0) / yieldBearingBonds.length
        : 0;

    return { totalInvested, totalCurrent, totalPnl, avgYield, activeCount: activeBonds.length };
  }, [bonds]);

  const lifetimeStats = useMemo(() => {
    let totalBuys = 0;
    let totalSells = 0;
    bondTransactions.forEach((t) => {
      if (t.transactionType === 'BUY') totalBuys += t.totalAmount;
      else if (t.transactionType === 'SELL') totalSells += t.totalAmount;
    });
    const lifetimeEarned = totalSells + stats.totalCurrent - totalBuys;
    const lifetimeReturnPct = totalBuys > 0 ? (lifetimeEarned / totalBuys) * 100 : 0;
    return { totalBuys, totalSells, lifetimeEarned, lifetimeReturnPct };
  }, [bondTransactions, stats.totalCurrent]);

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
        const newBond = await addBond({
          ...bondData,
          quantity: 0,
          investmentAmount: 0,
          currentValue: 0,
          pnl: 0,
          pnlPercentage: 0,
        });
        await addBondTransaction({
          bondId: newBond.id,
          transactionType: 'BUY',
          quantity: qty,
          price,
          totalAmount: metrics.invested,
          transactionDate: new Date().toISOString().split('T')[0],
          accountId: selectedAccountId !== '' ? Number(selectedAccountId) : undefined,
          notes: 'Initial portfolio entry',
        });
        showNotification('success', 'Bond added and logged to history');
      }

      resetBondForm();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error saving bond';
      showNotification('error', message);
    }
  };

  const handleEdit = (bond: Bond) => {
    setModalType('bond');
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

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBondId) {
      showNotification('error', 'Please select a bond.');
      return;
    }
    if (!txQuantity || Number(txQuantity) <= 0) {
      showNotification('error', 'Please provide a valid quantity.');
      return;
    }
    if (!txPrice || Number(txPrice) <= 0) {
      showNotification('error', 'Please provide a valid price.');
      return;
    }
    if (!selectedAccountId) {
      showNotification('error', 'Please select an operating bank account.');
      return;
    }

    const qty = Number(txQuantity);
    const price = Number(txPrice);
    const total = qty * price;

    try {
      await addBondTransaction({
        bondId: Number(selectedBondId),
        transactionType,
        quantity: qty,
        price,
        totalAmount: total,
        transactionDate: txDate,
        notes: txNotes || undefined,
        accountId: Number(selectedAccountId),
      });
      showNotification('success', `Bond ${transactionType} transaction recorded`);
      resetTransactionForm();
      setIsModalOpen(false);
    } catch (error: unknown) {
      logError('Failed to record bond transaction:', error);
      const msg = error instanceof Error ? error.message : 'Check fields & account';
      showNotification('error', `Failed: ${msg}`);
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
      {/* Header */}
      <div
        className="mobile-page-header"
        style={{
          marginBottom: '24px',
          gap: '16px',
          width: '100%',
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <h1
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              fontWeight: '900',
              margin: 0,
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Bonds Terminal
          </h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.9rem' }}>
            Fixed-income securities across {stats.activeCount} active positions.
          </p>
        </div>
        <div
          className="mobile-page-header__actions"
          style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}
        >
          <button
            onClick={openCreateModal}
            style={{
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 8px 16px rgba(45, 212, 191, 0.2)',
              transition: 'all 0.3s',
              flexShrink: 0,
            }}
          >
            <Plus size={16} strokeWidth={3} />
            <span className="hide-sm">Add Bond</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-responsive-4" style={{ gap: '16px', marginBottom: '32px' }}>
        <StatCard label="Total Invested" value={`₹${stats.totalInvested.toLocaleString()}`} />
        <StatCard label="Current Value" value={`₹${stats.totalCurrent.toLocaleString()}`} />
        <StatCard
          label="Total P&L"
          value={`₹${stats.totalPnl.toLocaleString()}`}
          valueColor={stats.totalPnl >= 0 ? '#10b981' : '#f43f5e'}
        />
        <StatCard label="Avg Yield" value={`${stats.avgYield.toFixed(2)}%`} valueColor="#2dd4bf" />
      </div>

      {/* Tab Navigation */}
      <div
        className="mobile-tab-scroll"
        style={{
          display: 'flex',
          width: 'fit-content',
          background: '#050505',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid #111111',
          marginBottom: '24px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { id: 'holdings', label: 'Holdings', icon: <BarChart3 size={16} /> },
          { id: 'history', label: 'History', icon: <History size={16} /> },
          { id: 'lifetime', label: 'Lifetime', icon: <Star size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'holdings' | 'history' | 'lifetime')}
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.id ? '#0d9488' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Holdings Tab */}
      {activeTab === 'holdings' && (
        <div className="premium-card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
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
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid #111111',
                  }}
                >
                  {['Bond Name', 'Qty / Price', 'Yield', 'Current Value', 'Actions'].map(
                    (label) => (
                      <th
                        key={label}
                        style={{
                          padding: '16px',
                          color: '#64748b',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          fontSize: '0.7rem',
                          textAlign:
                            label === 'Actions'
                              ? 'center'
                              : label === 'Bond Name'
                                ? 'left'
                                : 'right',
                        }}
                      >
                        {label}
                      </th>
                    )
                  )}
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
                    <tr
                      key={bond.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
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
                              Matures{' '}
                              {new Date(`${bond.maturityDate}T00:00:00`).toLocaleDateString()}
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
                          {bond.quantity} / ₹{bond.avgPrice?.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                          Last price ₹{bond.currentPrice?.toLocaleString()}
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
                          {bond.yieldToMaturity
                            ? `YTM ${bond.yieldToMaturity.toFixed(2)}%`
                            : 'YTM pending'}
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
                        <div>₹{bond.currentValue?.toLocaleString()}</div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: pnl >= 0 ? '#10b981' : '#f43f5e',
                            marginTop: '4px',
                          }}
                        >
                          {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          {bond.status !== 'SOLD' && bond.status !== 'MATURED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSellBond(bond);
                              }}
                              title="Sell Bond"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#10b981',
                                cursor: 'pointer',
                                padding: '4px',
                                transition: 'all 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                            >
                              <ArrowRight size={16} strokeWidth={3} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(bond)}
                            title="Edit Bond"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const confirmed = await customConfirm({
                                title: 'Delete Bond',
                                message: `Remove ${bond.name}?`,
                                type: 'error',
                                confirmLabel: 'Delete',
                              });
                              if (confirmed) {
                                try {
                                  await deleteBond(bond.id);
                                  showNotification('success', 'Bond deleted successfully');
                                } catch (error) {
                                  logError('Failed to delete bond:', error);
                                  showNotification('error', 'Failed to delete bond');
                                }
                              }
                            }}
                            title="Delete Bond"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
            Bond Transaction History
          </h3>
          {bondTransactions.length > 0 ? (
            bondTransactions.map((tx) => {
              const bond = bonds.find((b) => b.id === tx.bondId);
              return (
                <div
                  key={tx.id}
                  style={{
                    background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid #111111',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div
                      style={{
                        background:
                          tx.transactionType === 'BUY'
                            ? 'rgba(248, 113, 113, 0.1)'
                            : 'rgba(16, 185, 129, 0.1)',
                        color: tx.transactionType === 'BUY' ? '#f87171' : '#10b981',
                        padding: '12px',
                        borderRadius: '14px',
                      }}
                    >
                      {tx.transactionType === 'BUY' ? (
                        <ArrowDownRight size={20} />
                      ) : (
                        <ArrowUpRight size={20} />
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: '800',
                          color: '#fff',
                          marginBottom: '4px',
                        }}
                      >
                        {bond?.name || 'Unknown Bond'} • {tx.transactionType}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                        {tx.quantity} units @ ₹{tx.price.toFixed(2)}
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <Calendar size={12} />
                        {new Date(tx.transactionDate).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                        {tx.notes && <span>• {tx.notes}</span>}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: 'right',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '1.2rem',
                          fontWeight: '900',
                          color: tx.transactionType === 'BUY' ? '#f87171' : '#34d399',
                        }}
                      >
                        {tx.transactionType === 'BUY' ? '-' : '+'}₹{tx.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const confirmed = await customConfirm({
                          title: 'Delete Transaction',
                          message: 'Are you sure you want to delete this transaction?',
                          type: 'warning',
                          confirmLabel: 'Delete',
                        });
                        if (confirmed) {
                          await deleteBondTransaction(tx.id);
                          showNotification('success', 'Transaction deleted');
                        }
                      }}
                      style={{
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: 'none',
                        color: '#f43f5e',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                padding: 'clamp(24px, 4vw, 60px)',
                textAlign: 'center',
                color: '#475569',
                border: '2px dashed #111111',
                borderRadius: '20px',
              }}
            >
              <History size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px' }}>
                No transactions recorded
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Your bond transactions will appear here chronologically
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lifetime Tab */}
      {activeTab === 'lifetime' && (
        <div className="fade-in">
          <div
            style={{
              background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
              borderRadius: 'clamp(20px, 3vw, 32px)',
              border: '1px solid #111111',
              padding: 'clamp(20px, 4vw, 40px)',
            }}
          >
            <h3
              style={{
                fontSize: '1.5rem',
                fontWeight: '900',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Star color="#f59e0b" fill="#f59e0b" size={24} /> Lifetime Bond Report
            </h3>

            <div className="grid-responsive-2" style={{ gap: '48px', marginBottom: '48px' }}>
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                  }}
                >
                  Total Invested (All Time)
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '950', color: '#fff' }}>
                  ₹{lifetimeStats.totalBuys.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '8px' }}>
                  Combined value of all BUY orders
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '800',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                  }}
                >
                  Total Lifetime Gains
                </div>
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: '950',
                    color: lifetimeStats.lifetimeEarned >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {lifetimeStats.lifetimeEarned >= 0 ? '+' : ''}₹
                  {lifetimeStats.lifetimeEarned.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '8px' }}>
                  Realised + unrealised profit
                </div>
              </div>
            </div>

            <div
              className="grid-responsive-3"
              style={{
                gap: '24px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '32px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Total Proceeds (Sells)
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                  ₹{lifetimeStats.totalSells.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Active Holdings Value
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2dd4bf' }}>
                  ₹{stats.totalCurrent.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: '#475569',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}
                >
                  Return %
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    color: lifetimeStats.lifetimeReturnPct >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {lifetimeStats.lifetimeReturnPct >= 0 ? '+' : ''}
                  {lifetimeStats.lifetimeReturnPct.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              if (modalType === 'bond') resetBondForm(false);
              else resetTransactionForm();
            }
          }}
        >
          <div
            className="modal-card"
            style={{
              background: '#050505',
              border: '1px solid #1a1a1a',
              width: '100%',
              maxWidth: '560px',
            }}
          >
            <div className="mobile-modal-sheet__handle hide-desktop" />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <h2 style={{ color: '#fff', fontWeight: '900', margin: 0 }}>
                {modalType === 'bond'
                  ? editId
                    ? 'Edit Bond'
                    : 'Add New Bond'
                  : `${transactionType} Bond`}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  if (modalType === 'bond') resetBondForm(false);
                  else resetTransactionForm();
                }}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Bond Form */}
            {modalType === 'bond' && (
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

                {/* Account selector for new bonds only */}
                {!editId && (
                  <div>
                    <label style={fieldStyles.label}>Bank Account (for ledger)</label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) =>
                        setSelectedAccountId(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      style={fieldStyles.input}
                    >
                      <option value="">Select account (optional)</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} — {acc.bankName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => resetBondForm()}
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
                      background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
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
            )}

            {/* Transaction Form */}
            {modalType === 'transaction' && (
              <form
                onSubmit={handleTransactionSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div>
                  <label style={fieldStyles.label}>Bond *</label>
                  <select
                    required
                    value={selectedBondId}
                    onChange={(e) =>
                      setSelectedBondId(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    disabled={isTypeLocked && selectedBondId !== ''}
                    style={fieldStyles.input}
                  >
                    <option value="">Select bond</option>
                    {bonds
                      .filter((b) => b.status !== 'SOLD')
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.isin ? `(${b.isin})` : ''}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label style={fieldStyles.label}>Transaction Type *</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as 'BUY' | 'SELL')}
                    disabled={isTypeLocked}
                    style={fieldStyles.input}
                  >
                    <option value="BUY">BUY</option>
                    <option value="SELL">SELL</option>
                  </select>
                </div>

                <div style={fieldStyles.grid}>
                  <TextField
                    label="Quantity *"
                    value={txQuantity}
                    onChange={setTxQuantity}
                    type="number"
                    required
                    min="1"
                  />
                  <TextField
                    label="Price per unit *"
                    value={txPrice}
                    onChange={setTxPrice}
                    type="number"
                    required
                    min="0"
                  />
                </div>

                <TextField
                  label="Transaction Date *"
                  value={txDate}
                  onChange={setTxDate}
                  type="date"
                  required
                />

                <div>
                  <label style={fieldStyles.label}>Bank Account *</label>
                  <select
                    required
                    value={selectedAccountId}
                    onChange={(e) =>
                      setSelectedAccountId(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    style={fieldStyles.input}
                  >
                    <option value="">Select account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} — {acc.bankName}
                      </option>
                    ))}
                  </select>
                </div>

                <TextField
                  label="Notes"
                  value={txNotes}
                  onChange={setTxNotes}
                  placeholder="Optional notes"
                />

                {txQuantity && txPrice && Number(txQuantity) > 0 && Number(txPrice) > 0 && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(45, 212, 191, 0.05)',
                      border: '1px solid rgba(45, 212, 191, 0.2)',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      color: '#2dd4bf',
                      fontWeight: '700',
                    }}
                  >
                    Total: ₹{(Number(txQuantity) * Number(txPrice)).toLocaleString()}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      resetTransactionForm();
                      setIsModalOpen(false);
                    }}
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
                      background:
                        transactionType === 'SELL'
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '12px',
                      fontWeight: '800',
                      cursor: 'pointer',
                    }}
                  >
                    {transactionType === 'SELL' ? 'Sell Bond' : 'Record Buy'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
