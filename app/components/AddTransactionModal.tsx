'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Search, Loader2, TrendingUp, Activity, Zap, Banknote, Info } from 'lucide-react';
import { useLedger, usePortfolio, useSettings } from './FinanceContext';
import { useNotifications } from './NotificationContext';
import {
  calculateFnoCharges,
  calculateMfCharges,
  calculateStockCharges,
} from '@/lib/utils/charges';
import { logError } from '@/lib/utils/logger';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TransactionType = 'STOCK' | 'MUTUAL_FUND' | 'FNO';

interface StockSearchResult {
  symbol: string;
  companyName: string;
}

interface StockQuoteResult {
  currentPrice: number;
  previousClose: number;
  exchange: string;
}

interface MutualFundSearchResult {
  schemeName: string;
  schemeCode: string;
  shortName?: string;
}

interface MutualFundQuoteResult {
  currentNav: number;
  previousNav: number;
  category?: string;
  isin?: string;
}

type SelectedStockItem = StockSearchResult & StockQuoteResult;
type SelectedMFItem = MutualFundSearchResult & MutualFundQuoteResult;
type SelectedItem = SelectedStockItem | SelectedMFItem;

type SearchResult = StockSearchResult | MutualFundSearchResult;

export default function AddTransactionModal({ isOpen, onClose }: AddTransactionModalProps) {
  const { accounts } = useLedger();
  const {
    stocks,
    mutualFunds,
    addStockTransaction,
    addMutualFundTransaction,
    addFnoTrade,
    addStock,
    addMutualFund,
  } = usePortfolio();
  const { settings } = useSettings();
  const { showNotification } = useNotifications();

  const [type, setType] = useState<TransactionType>('STOCK');
  const [subType, setSubType] = useState<'BUY' | 'SELL' | 'SIP'>('BUY');

  // Common Fields
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [accountId, setAccountId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Search / Selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);

  // Selected Item Info
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);

  // Specific Fields
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [previousPrice, setPreviousPrice] = useState<number | null>(null); // For "Day's Change" fix

  // FnO Specific
  const [fnoProduct, setFnoProduct] = useState<'NRML' | 'MIS'>('NRML');
  const [fnoStatus, setFnoStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [exitPrice, setExitPrice] = useState('');
  const [exitDate, setExitDate] = useState('');

  const getDefaultAccountId = useCallback(
    (nextType: TransactionType) => {
      if (nextType === 'STOCK' || nextType === 'FNO') {
        return settings.defaultStockAccountId || '';
      }
      return settings.defaultMfAccountId || '';
    },
    [settings.defaultMfAccountId, settings.defaultStockAccountId]
  );

  const resetForm = useCallback(
    (nextType: TransactionType = type) => {
      setSearchQuery('');
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      setIsFetchingQuote(false);
      setSelectedItem(null);
      setSubType('BUY');
      setDate(new Date().toISOString().split('T')[0]);
      setQuantity('');
      setPrice('');
      setPreviousPrice(null);
      setNotes('');
      setAccountId(getDefaultAccountId(nextType));
      setFnoProduct('NRML');
      setFnoStatus('OPEN');
      setExitPrice('');
      setExitDate('');
    },
    [getDefaultAccountId, type]
  );

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const numericQuantity = Number.parseFloat(quantity);
  const numericPrice = Number.parseFloat(price);
  const numericExitPrice = Number.parseFloat(exitPrice);

  const stockChargePreview = useMemo(() => {
    if (
      type !== 'STOCK' ||
      !quantity ||
      !price ||
      Number.isNaN(numericQuantity) ||
      Number.isNaN(numericPrice)
    ) {
      return null;
    }

    const exchange =
      selectedItem && 'exchange' in selectedItem && selectedItem.exchange.includes('BSE')
        ? 'BSE'
        : 'NSE';

    return calculateStockCharges(
      subType as 'BUY' | 'SELL',
      numericQuantity,
      numericPrice,
      exchange
    );
  }, [type, quantity, price, numericQuantity, numericPrice, selectedItem, subType]);

  const mutualFundChargePreview = useMemo(() => {
    if (
      type !== 'MUTUAL_FUND' ||
      !quantity ||
      !price ||
      Number.isNaN(numericQuantity) ||
      Number.isNaN(numericPrice)
    ) {
      return null;
    }

    return calculateMfCharges(subType as 'BUY' | 'SELL' | 'SIP', numericQuantity * numericPrice);
  }, [type, quantity, price, numericQuantity, numericPrice, subType]);

  const fnoChargePreview = useMemo(() => {
    if (
      type !== 'FNO' ||
      fnoStatus !== 'CLOSED' ||
      !quantity ||
      !price ||
      !exitPrice ||
      Number.isNaN(numericQuantity) ||
      Number.isNaN(numericPrice) ||
      Number.isNaN(numericExitPrice)
    ) {
      return null;
    }

    return calculateFnoCharges(
      subType as 'BUY' | 'SELL',
      numericQuantity,
      numericPrice,
      numericExitPrice,
      searchQuery
    );
  }, [
    type,
    fnoStatus,
    quantity,
    price,
    exitPrice,
    numericQuantity,
    numericPrice,
    numericExitPrice,
    subType,
    searchQuery,
  ]);

  const grossFnoPnl =
    fnoStatus === 'CLOSED' &&
    !Number.isNaN(numericQuantity) &&
    !Number.isNaN(numericPrice) &&
    !Number.isNaN(numericExitPrice)
      ? (subType === 'BUY' ? numericExitPrice - numericPrice : numericPrice - numericExitPrice) *
        numericQuantity
      : 0;

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) return;
      setIsSearching(true);
      try {
        const endpoint =
          type === 'STOCK' ? `/api/stocks/search?q=${query}` : `/api/mf/search?q=${query}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (error) {
        logError('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [type]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2 && !selectedItem) {
        handleSearch(searchQuery);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, type, handleSearch, selectedItem]);

  const selectItem = async (item: SearchResult) => {
    setSearchQuery('symbol' in item ? item.symbol : item.schemeName);
    setShowResults(false);
    setIsFetchingQuote(true);

    try {
      if (type === 'STOCK' && 'symbol' in item) {
        const res = await fetch(`/api/stocks/quote?symbol=${item.symbol}`);
        const data = await res.json();
        setSelectedItem({ ...item, ...data });
        setPrice(data.currentPrice.toString());
        setPreviousPrice(data.previousClose || data.currentPrice);
      } else if (type === 'MUTUAL_FUND' && 'schemeCode' in item) {
        const res = await fetch(`/api/mf/quote?code=${item.schemeCode}`);
        const data = await res.json();
        setSelectedItem({ ...item, ...data });
        setPrice(data.currentNav.toString());
        setPreviousPrice(data.previousNav || data.currentNav);
      }
    } catch (error) {
      logError('Quote fetch failed:', error);
    } finally {
      setIsFetchingQuote(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'STOCK') {
      await handleStockSubmit();
    } else if (type === 'MUTUAL_FUND') {
      await handleMfSubmit();
    } else {
      await handleFnoSubmit();
    }
  };

  const handleStockSubmit = async () => {
    if (!selectedItem || !quantity || !price || !('symbol' in selectedItem)) return;

    const qty = parseFloat(quantity);
    const p = parseFloat(price);
    const total = qty * p;

    // Check if stock already exists in portfolio
    const existingStock = stocks.find((s) => s.symbol === selectedItem.symbol);
    if (!existingStock && subType === 'SELL') {
      showNotification('error', `Add a BUY transaction for ${selectedItem.symbol} before selling.`);
      return;
    }

    let targetStockId = existingStock?.id;
    if (!targetStockId) {
      const newStock = await addStock({
        symbol: selectedItem.symbol,
        companyName: selectedItem.companyName,
        quantity: 0,
        avgPrice: p,
        currentPrice: p,
        previousPrice: previousPrice || p,
        exchange: selectedItem.exchange?.includes('BSE') ? 'BSE' : 'NSE',
        investmentAmount: 0,
        currentValue: 0,
        pnl: 0,
        pnlPercentage: 0,
      });
      targetStockId = newStock.id;
    }

    const charges = calculateStockCharges(
      subType as 'BUY' | 'SELL',
      qty,
      p,
      selectedItem.exchange?.includes('BSE') ? 'BSE' : 'NSE'
    );

    await addStockTransaction({
      stockId: targetStockId,
      transactionType: subType as 'BUY' | 'SELL',
      quantity: qty,
      price: p,
      totalAmount: total,
      brokerage: charges.brokerage,
      taxes: charges.taxes,
      transactionDate: date,
      notes: notes || undefined,
      accountId: accountId ? Number(accountId) : undefined,
    });

    showNotification('success', `${selectedItem.symbol} transaction recorded successfully`);
    onClose();
  };

  const handleMfSubmit = async () => {
    if (!selectedItem || !quantity || !price || !('schemeCode' in selectedItem)) return;

    const qty = parseFloat(quantity);
    const p = parseFloat(price);
    const total = qty * p;

    const existingMf = mutualFunds.find((m) => m.schemeCode === selectedItem.schemeCode);

    if (!existingMf && subType === 'SELL') {
      showNotification(
        'error',
        `Add a BUY or SIP transaction for ${selectedItem.schemeName} before redeeming.`
      );
      return;
    }

    let targetMutualFundId = existingMf?.id;
    if (!targetMutualFundId) {
      const newMutualFund = await addMutualFund({
        schemeName: selectedItem.schemeName,
        schemeCode: selectedItem.schemeCode,
        category: selectedItem.category,
        units: 0,
        avgNav: p,
        currentNav: p,
        previousNav: previousPrice || p,
        investmentAmount: 0,
        currentValue: 0,
        pnl: 0,
        pnlPercentage: 0,
        isin: selectedItem.isin,
      });
      targetMutualFundId = newMutualFund.id;
    }

    await addMutualFundTransaction({
      mutualFundId: targetMutualFundId,
      transactionType: subType as 'BUY' | 'SELL' | 'SIP',
      units: qty,
      nav: p,
      totalAmount: total,
      transactionDate: date,
      accountId: accountId ? Number(accountId) : undefined,
      notes: notes || undefined,
    });

    showNotification('success', `Investment of INR ${total.toLocaleString()} recorded`);
    onClose();
  };

  const handleFnoSubmit = async () => {
    if (!searchQuery || !quantity || !price) return;

    const qty = parseFloat(quantity);
    const entryP = parseFloat(price);
    const exitP = exitPrice ? parseFloat(exitPrice) : 0;

    let pnl = 0;
    if (fnoStatus === 'CLOSED') {
      pnl = subType === 'BUY' ? (exitP - entryP) * qty : (entryP - exitP) * qty;
      if (exitP > 0) {
        pnl -= calculateFnoCharges(
          subType as 'BUY' | 'SELL',
          qty,
          entryP,
          exitP,
          searchQuery
        ).total;
      }
    }

    await addFnoTrade({
      instrument: searchQuery,
      tradeType: subType as 'BUY' | 'SELL',
      product: fnoProduct,
      quantity: qty,
      avgPrice: entryP,
      exitPrice: fnoStatus === 'CLOSED' ? exitP : undefined,
      entryDate: date,
      exitDate: fnoStatus === 'CLOSED' ? exitDate || date : undefined,
      status: fnoStatus,
      pnl,
      notes,
      accountId: accountId ? Number(accountId) : undefined,
    });

    showNotification('success', 'F&O trade logged successfully');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 2000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '560px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            gap: '8px',
          }}
        >
          <h2
            style={{
              fontSize: 'clamp(1.1rem, 4vw, 1.5rem)',
              fontWeight: '900',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 2vw, 12px)',
            }}
          >
            <div
              style={{
                padding: '6px',
                background: 'rgba(99, 102, 241, 0.1)',
                borderRadius: '10px',
                color: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Banknote size={20} />
            </div>
            Add Transaction
          </h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '8px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <X size={22} />
          </button>
        </div>

        {/* Instrument Type Selector */}
        <div
          className="dashboard-tabs"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: '6px',
            marginBottom: '16px',
          }}
        >
          {[
            { id: 'STOCK', label: 'Stocks', icon: <TrendingUp size={16} /> },
            { id: 'MUTUAL_FUND', label: 'Mutual Funds', icon: <Activity size={16} /> },
            { id: 'FNO', label: 'F&O', icon: <Zap size={16} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                const nextType = t.id as TransactionType;
                setType(nextType);
                resetForm(nextType);
              }}
              style={{
                padding: '8px 6px',
                borderRadius: '10px',
                border: 'none',
                background: type === t.id ? '#6366f1' : 'transparent',
                color: type === t.id ? '#fff' : '#64748b',
                fontWeight: '700',
                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: '0.2s',
                minHeight: '44px',
                whiteSpace: 'nowrap',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Search Field */}
          <div style={{ position: 'relative' }}>
            <label
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '8px',
                letterSpacing: '0.5px',
              }}
            >
              {type === 'FNO'
                ? 'Instrument Name'
                : `Search ${type === 'STOCK' ? 'Ticker' : 'Scheme'}`}
            </label>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#475569',
                }}
              />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (selectedItem) setSelectedItem(null);
                }}
                placeholder={
                  type === 'STOCK'
                    ? 'e.g. RELIANCE, HDFCBANK'
                    : type === 'MUTUAL_FUND'
                      ? 'e.g. Parag Parikh, Quant'
                      : 'e.g. NIFTY 22FEB 21500 CE'
                }
                style={{
                  width: '100%',
                  background: 'var(--ui-input-bg)',
                  border: 'var(--ui-border)',
                  padding: '12px 12px 12px 48px',
                  borderRadius: '14px',
                  color: '#fff',
                }}
                onFocus={() => type !== 'FNO' && setShowResults(true)}
              />
              {isSearching && (
                <Loader2
                  size={18}
                  className="spin-animation"
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6366f1',
                  }}
                />
              )}
            </div>

            {showResults && searchResults.length > 0 && (
              <div
                className="mobile-search-results"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--ui-surface-soft)',
                  border: 'var(--ui-border)',
                  borderRadius: '16px',
                  marginTop: '8px',
                  zIndex: 2100,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                }}
              >
                {searchResults.map((item: SearchResult) => (
                  <div
                    key={'symbol' in item ? item.symbol : item.schemeCode}
                    onClick={() => selectItem(item)}
                    style={{
                      padding: '14px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                      {'symbol' in item ? item.symbol : item.schemeName}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {'companyName' in item
                        ? item.companyName
                        : item.shortName || `Code: ${item.schemeCode}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedItem && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.05)',
                padding: '16px',
                borderRadius: '16px',
                border: '1px solid rgba(99, 102, 241, 0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '800' }}>
                  {'symbol' in selectedItem ? selectedItem.symbol : selectedItem.schemeName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {'companyName' in selectedItem
                    ? selectedItem.companyName
                    : selectedItem.shortName || selectedItem.category}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: '#10b981' }}>
                  ₹{price}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Live Market Price</div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Transaction Type
              </label>
              <select
                value={subType}
                onChange={(e) => setSubType(e.target.value as 'BUY' | 'SELL' | 'SIP')}
                style={{
                  width: '100%',
                  background: 'var(--ui-input-bg)',
                  border: 'var(--ui-border)',
                  padding: '12px',
                  borderRadius: '14px',
                  color: '#fff',
                }}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
                {type === 'MUTUAL_FUND' && <option value="SIP">SIP</option>}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--ui-input-bg)',
                  border: 'var(--ui-border)',
                  padding: '12px',
                  borderRadius: '14px',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
            }}
          >
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                {type === 'MUTUAL_FUND' ? 'Units' : 'Quantity'}
              </label>
              <input
                type="number"
                step={type === 'MUTUAL_FUND' ? '0.001' : '1'}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                style={{
                  width: '100%',
                  background: 'var(--ui-input-bg)',
                  border: 'var(--ui-border)',
                  padding: '12px',
                  borderRadius: '14px',
                  color: '#fff',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '800',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                {type === 'MUTUAL_FUND' ? 'NAV' : 'Avg. Price'}
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  background: 'var(--ui-input-bg)',
                  border: 'var(--ui-border)',
                  padding: '12px',
                  borderRadius: '14px',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          {type === 'FNO' && (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '12px',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Product
                  </label>
                  <select
                    value={fnoProduct}
                    onChange={(e) => setFnoProduct(e.target.value as 'NRML' | 'MIS')}
                    style={{
                      width: '100%',
                      background: 'var(--ui-input-bg)',
                      border: 'var(--ui-border)',
                      padding: '14px',
                      borderRadius: '14px',
                      color: '#fff',
                    }}
                  >
                    <option value="NRML">NRML</option>
                    <option value="MIS">MIS</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: '800',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Status
                  </label>
                  <select
                    value={fnoStatus}
                    onChange={(e) => setFnoStatus(e.target.value as 'OPEN' | 'CLOSED')}
                    style={{
                      width: '100%',
                      background: 'var(--ui-input-bg)',
                      border: 'var(--ui-border)',
                      padding: '14px',
                      borderRadius: '14px',
                      color: '#fff',
                    }}
                  >
                    <option value="OPEN">OPEN POSITION</option>
                    <option value="CLOSED">CLOSED TRADE</option>
                  </select>
                </div>
              </div>
              {fnoStatus === 'CLOSED' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Exit Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={exitPrice}
                      onChange={(e) => setExitPrice(e.target.value)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        background: 'var(--ui-input-bg)',
                        border: 'var(--ui-border)',
                        padding: '14px',
                        borderRadius: '14px',
                        color: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Exit Date
                    </label>
                    <input
                      type="date"
                      value={exitDate}
                      onChange={(e) => setExitDate(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'var(--ui-input-bg)',
                        border: 'var(--ui-border)',
                        padding: '14px',
                        borderRadius: '14px',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {stockChargePreview && (
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.16)',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '900',
                  color: '#34d399',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Zerodha Delivery Estimate
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>Trade value</span>
                <span style={{ color: '#fff', fontWeight: '800' }}>
                  INR {stockChargePreview.turnover.toFixed(2)}
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>Brokerage</span>
                <span style={{ color: '#fff', fontWeight: '800' }}>
                  INR {stockChargePreview.brokerage.toFixed(2)}
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>Taxes and charges</span>
                <span style={{ color: '#fff', fontWeight: '800' }}>
                  INR {stockChargePreview.taxes.toFixed(2)}
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>
                  {subType === 'BUY' ? 'Estimated debit' : 'Estimated credit'}
                </span>
                <span style={{ color: '#34d399', fontWeight: '900' }}>
                  INR {stockChargePreview.settlementAmount.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {mutualFundChargePreview && (
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.16)',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '900',
                  color: '#f59e0b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Zerodha Coin Estimate
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>Order amount</span>
                <span style={{ color: '#fff', fontWeight: '800' }}>
                  INR {(numericQuantity * numericPrice).toFixed(2)}
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>Stamp duty</span>
                <span style={{ color: '#fff', fontWeight: '800' }}>
                  INR {mutualFundChargePreview.stampDuty.toFixed(2)}
                </span>
              </div>
              {(subType === 'BUY' || subType === 'SIP') && (
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
                >
                  <span style={{ color: '#94a3b8' }}>Effective invested amount</span>
                  <span style={{ color: '#fbbf24', fontWeight: '900' }}>
                    INR {mutualFundChargePreview.effectiveInvestment.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {fnoChargePreview && (
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid rgba(99, 102, 241, 0.16)',
                display: 'grid',
                gap: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: '900',
                  color: '#818cf8',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Zerodha F&amp;O Estimate
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>Gross P&amp;L</span>
                <span
                  style={{
                    color: grossFnoPnl >= 0 ? '#34d399' : '#f87171',
                    fontWeight: '800',
                  }}
                >
                  {grossFnoPnl >= 0 ? '+' : ''}
                  INR {grossFnoPnl.toFixed(2)}
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>Charges</span>
                <span style={{ color: '#fff', fontWeight: '800' }}>
                  INR {fnoChargePreview.total.toFixed(2)}
                </span>
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}
              >
                <span style={{ color: '#94a3b8' }}>Net P&amp;L</span>
                <span
                  style={{
                    color: grossFnoPnl - fnoChargePreview.total >= 0 ? '#34d399' : '#f87171',
                    fontWeight: '900',
                  }}
                >
                  {grossFnoPnl - fnoChargePreview.total >= 0 ? '+' : ''}
                  INR {(grossFnoPnl - fnoChargePreview.total).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <div>
            <label
              style={{
                fontSize: '0.7rem',
                fontWeight: '800',
                color: '#64748b',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Operating Bank Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : '')}
              style={{
                width: '100%',
                background: 'var(--ui-input-bg)',
                border: 'var(--ui-border)',
                padding: '12px',
                borderRadius: '14px',
                color: '#fff',
              }}
            >
              <option value="">No Account (Ledger Only)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} - INR {acc.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isFetchingQuote || (!selectedItem && type !== 'FNO')}
            className="btn-primary"
            style={{
              marginTop: '8px',
              color: '#fff',
              fontWeight: '800',
              fontSize: '1rem',
              cursor:
                isFetchingQuote || (!selectedItem && type !== 'FNO') ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)',
            }}
          >
            {isFetchingQuote ? (
              <>
                <Loader2 size={18} className="spin-animation" /> Syncing...
              </>
            ) : (
              'Confirm Transaction'
            )}
          </button>
          {!selectedItem && type !== 'FNO' && (
            <p
              style={{
                fontSize: '0.75rem',
                color: '#f87171',
                textAlign: 'center',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Info size={14} /> Please select an instrument to continue
            </p>
          )}
        </form>
      </div>

      <style jsx>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
