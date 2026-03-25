'use client';

import { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLedger, usePortfolio, useSettings } from '../components/FinanceContext';
import { Stock } from '@/lib/types';
import { calculateStockCharges, getStockChargeMeta } from '@/lib/utils/charges';
import { logError } from '@/lib/utils/logger';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Search,
  DollarSign,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Star,
  Loader2,
  History,
  Calendar,
  Edit3,
  Trash2,
  ArrowRight,
  Eye,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { EmptyPortfolioVisual } from '../components/Visuals';

const COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
];

export default function StocksClient() {
  const { accounts, loading } = useLedger();
  const {
    stocks,
    stockTransactions,
    addStock,
    updateStock,
    deleteStock,
    addStockTransaction,
    deleteStockTransaction,
    refreshLivePrices,
  } = usePortfolio();
  const { settings } = useSettings();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'history' | 'lifetime' | 'allocation'>(
    'portfolio'
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'stock' | 'transaction'>('stock');
  const [editId, setEditId] = useState<number | null>(null);
  type ChargeViewData = Pick<Stock, 'symbol' | 'quantity' | 'currentPrice' | 'exchange'>;
  const [viewingCharges, setViewingCharges] = useState<{
    type: 'stock' | 'mf';
    data: ChargeViewData;
  } | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ symbol: string; companyName: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form States
  const [symbol, setSymbol] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [sector, setSector] = useState('');
  const [exchange, setExchange] = useState('NSE');

  // Transaction Form States
  const [selectedStockId, setSelectedStockId] = useState<number | ''>('');
  const [transactionType, setTransactionType] = useState<'BUY' | 'SELL'>('BUY');
  const [isTypeLocked, setIsTypeLocked] = useState(false);
  const [transactionQuantity, setTransactionQuantity] = useState('');
  const [transactionPrice, setTransactionPrice] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');

  const selectedTransactionStock = useMemo(
    () => stocks.find((stock) => stock.id === Number(selectedStockId)) || null,
    [stocks, selectedStockId]
  );

  const initialBuyChargePreview = useMemo(() => {
    const qty = Number(quantity);
    const avg = Number(avgPrice);
    if (!qty || !avg || Number.isNaN(qty) || Number.isNaN(avg)) {
      return null;
    }

    return calculateStockCharges('BUY', qty, avg, exchange);
  }, [quantity, avgPrice, exchange]);

  const transactionChargePreview = useMemo(() => {
    const qty = Number(transactionQuantity);
    const price = Number(transactionPrice);
    if (!qty || !price || Number.isNaN(qty) || Number.isNaN(price)) {
      return null;
    }

    return calculateStockCharges(
      transactionType,
      qty,
      price,
      selectedTransactionStock?.exchange === 'BSE' ? 'BSE' : 'NSE'
    );
  }, [transactionQuantity, transactionPrice, transactionType, selectedTransactionStock]);

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/stocks/search?q=${query}`);
      const data = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      logError('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectStock = async (item: { symbol: string; companyName: string }) => {
    setSymbol(item.symbol);
    setCompanyName(item.companyName);
    setShowResults(false);
    setSearchQuery(item.symbol);

    // Fetch real-time quote
    try {
      const res = await fetch(`/api/stocks/quote?symbol=${item.symbol}`);
      const data = await res.json();
      if (!data.error) {
        setCurrentPrice(data.currentPrice.toString());
        setPreviousPrice(data.previousClose || data.currentPrice);
        setExchange(data.exchange.includes('BSE') ? 'BSE' : 'NSE');
      }
    } catch (error) {
      logError('Quote fetch failed:', error);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !companyName || !quantity || !avgPrice || !currentPrice) {
      showNotification(
        'error',
        'Please fill in all required fields (Symbol, Company, Quantity, Avg Price, Current Price).'
      );
      return;
    }

    const qty = parseInt(quantity);
    const avg = parseFloat(avgPrice);
    const current = parseFloat(currentPrice);

    if (isNaN(qty) || qty <= 0) {
      showNotification('error', 'Invalid quantity. Must be a positive number.');
      return;
    }
    if (isNaN(avg) || avg < 0) {
      showNotification('error', 'Invalid average price. Must be a non-negative number.');
      return;
    }
    if (isNaN(current) || current < 0) {
      showNotification('error', 'Invalid current price. Must be a non-negative number.');
      return;
    }

    const investment = qty * avg;
    const currentValue = qty * current;
    const pnl = currentValue - investment;
    const pnlPercentage = (pnl / investment) * 100;

    const stockData = {
      symbol: symbol.trim().toUpperCase(),
      companyName,
      quantity: qty,
      avgPrice: avg,
      currentPrice: current,
      previousPrice: previousPrice || current,
      sector: sector || undefined,
      exchange,
      investmentAmount: investment,
      currentValue,
      pnl,
      pnlPercentage,
    };

    try {
      if (editId !== null) {
        await updateStock(editId, stockData);
        showNotification('success', `${symbol} updated successfully`);
      } else {
        // Log to ledger by default (per user request)
        // 1. Create stock with 0 quantity first (or get existing)
        let targetStockId: number;
        const currentSymbol = symbol.trim().toUpperCase();
        const existingStock = stocks.find(
          (s) =>
            s.symbol.toUpperCase() === currentSymbol &&
            s.exchange.toUpperCase() === exchange.toUpperCase()
        );

        if (existingStock) {
          targetStockId = existingStock.id;
        } else {
          const newStock = await addStock({
            ...stockData,
            quantity: 0,
            investmentAmount: 0,
            currentValue: 0,
            pnl: 0,
            pnlPercentage: 0,
          });
          targetStockId = newStock.id;
        }

        // 2. Add transaction which will update holdings AND log to ledger
        const investment = qty * avg;
        const calculatedCharges = calculateStockCharges('BUY', qty, avg, exchange);

        await addStockTransaction({
          stockId: targetStockId,
          transactionType: 'BUY',
          quantity: qty,
          price: avg,
          totalAmount: investment,
          brokerage: calculatedCharges.brokerage,
          taxes: calculatedCharges.taxes,
          transactionDate: new Date().toISOString().split('T')[0],
          accountId: selectedAccountId !== '' ? Number(selectedAccountId) : undefined,
          notes: 'Initial portfolio entry',
        });

        showNotification('success', `${symbol} added and logged to ledger`);
      }
      resetStockForm();
      setIsModalOpen(false);
    } catch (error) {
      logError('Failed to save stock:', error);
      showNotification(
        'error',
        'Failed to save stock. Please check if an account is selected and all fields are valid.'
      );
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStockId) {
      showNotification('error', 'Please select a security to transact.');
      return;
    }

    if (!transactionQuantity || Number(transactionQuantity) <= 0) {
      showNotification('error', 'Please provide a valid quantity.');
      return;
    }

    if (!transactionPrice || Number(transactionPrice) <= 0) {
      showNotification('error', 'Please provide a valid price.');
      return;
    }

    if (!selectedAccountId) {
      showNotification('error', 'Please select an operating bank account.');
      return;
    }

    const qty = Number(transactionQuantity);
    const price = Number(transactionPrice);
    const total = qty * price;
    const calculatedCharges = calculateStockCharges(
      transactionType,
      qty,
      price,
      selectedTransactionStock?.exchange === 'BSE' ? 'BSE' : 'NSE'
    );

    try {
      await addStockTransaction({
        stockId: Number(selectedStockId),
        transactionType,
        quantity: qty,
        price,
        totalAmount: total,
        brokerage: calculatedCharges.brokerage,
        taxes: calculatedCharges.taxes,
        transactionDate,
        notes: notes || undefined,
        accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
      });
      showNotification('success', `Transaction recorded: ${transactionType} ${qty} shares`);
      resetTransactionForm();
      setIsModalOpen(false);
    } catch (error: unknown) {
      logError('Failed to record stock transaction:', error);
      const msg = error instanceof Error ? error.message : 'Check fields & account';
      showNotification('error', `Failed: ${msg}`);
    }
  };

  const resetStockForm = () => {
    setEditId(null);
    setSymbol('');
    setCompanyName('');
    setQuantity('');
    setAvgPrice('');
    setCurrentPrice('');
    setPreviousPrice(null);
    setSector('');
    setExchange('NSE');
    setSearchQuery('');
    setSelectedAccountId(settings.defaultStockAccountId || '');
  };

  const handleEditStock = (stock: Stock) => {
    setModalType('stock');
    setEditId(stock.id);
    setSymbol(stock.symbol);
    setCompanyName(stock.companyName);
    setQuantity(stock.quantity.toString());
    setAvgPrice(stock.avgPrice.toString());
    setCurrentPrice(stock.currentPrice.toString());
    setPreviousPrice(stock.previousPrice || stock.currentPrice);
    setSector(stock.sector || '');
    setExchange(stock.exchange);
    setIsModalOpen(true);
  };

  const handleExitStock = (stock: Stock) => {
    setModalType('transaction');
    setSelectedStockId(stock.id);
    setTransactionType('SELL');
    setTransactionQuantity(stock.quantity.toString());
    setTransactionPrice(stock.currentPrice.toString());
    if (!selectedAccountId && settings.defaultStockAccountId) {
      setSelectedAccountId(settings.defaultStockAccountId);
    }
    setIsTypeLocked(true);
    setIsModalOpen(true);
  };

  const resetTransactionForm = () => {
    setSelectedStockId('');
    setTransactionType('BUY');
    setTransactionQuantity('');
    setTransactionPrice('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setSelectedAccountId(settings.defaultStockAccountId || '');
    setNotes('');
    setIsTypeLocked(false);
  };

  const openModal = (type: 'stock' | 'transaction') => {
    setModalType(type);
    setIsTypeLocked(false);
    setIsModalOpen(true);
  };

  // Group stocks by symbol and exchange for "Zerodha-style" averaging
  const groupedStocks = useMemo(() => {
    const groups: Record<string, Stock> = {};
    stocks.forEach((stock) => {
      const key = `${stock.symbol.toUpperCase()}_${stock.exchange.toUpperCase()}`;
      if (!groups[key]) {
        groups[key] = { ...stock };
      } else {
        const existing = groups[key];
        const totalQty = existing.quantity + stock.quantity;
        const totalInvestment = existing.investmentAmount + stock.investmentAmount;

        // Calculate weighted average previous price to preserve Day's P&L correctly
        // Use ?? (nullish coalescing) instead of || to handle previousPrice = 0 correctly
        const existingPrevPrice = existing.previousPrice ?? existing.currentPrice;
        const stockPrevPrice = stock.previousPrice ?? stock.currentPrice;
        const totalPrevValue =
          existingPrevPrice * existing.quantity + stockPrevPrice * stock.quantity;

        existing.quantity = totalQty;
        existing.investmentAmount = totalInvestment;
        existing.avgPrice = totalQty > 0 ? totalInvestment / totalQty : 0;
        existing.currentPrice = stock.currentPrice; // Latest LTP
        existing.previousPrice = totalQty > 0 ? totalPrevValue / totalQty : existing.currentPrice;

        existing.currentValue += stock.currentValue;
        existing.pnl += stock.pnl;
        existing.pnlPercentage =
          existing.investmentAmount > 0 ? (existing.pnl / existing.investmentAmount) * 100 : 0;
      }
    });
    // Filter out stocks with 0 quantity (closed positions) to mimic Zerodha/brokerage behavior
    return Object.values(groups)
      .filter((stock) => stock.quantity > 0)
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [stocks]);

  // Calculate portfolio metrics
  // Calculate portfolio metrics using groupedStocks to ensure only active positions are counted
  const { totalInvestment, totalCurrentValue, totalPnL, totalDayPnL, totalDayPnLPercentage } =
    useMemo(() => {
      let inv = 0,
        cv = 0,
        dayPnl = 0,
        prevDayValue = 0;
      groupedStocks.forEach((stock) => {
        inv += stock.investmentAmount;
        cv += stock.currentValue;
        // Zerodha formula: Day P&L = (LTP - Previous Close) × Qty
        // Use ?? (nullish coalescing) so previousPrice=0 is NOT treated as missing
        const prevClose = stock.previousPrice ?? stock.currentPrice;
        dayPnl += (stock.currentPrice - prevClose) * stock.quantity;
        prevDayValue += prevClose * stock.quantity;
      });
      return {
        totalInvestment: inv,
        totalCurrentValue: cv,
        totalPnL: cv - inv,
        totalDayPnL: dayPnl,
        // Day's P&L % = total day change / previous day's total value × 100
        totalDayPnLPercentage: prevDayValue > 0 ? (dayPnl / prevDayValue) * 100 : 0,
      };
    }, [groupedStocks]);

  // Lifetime Metrics Calculation
  const { totalBuys, totalSells, totalCharges, lifetimeEarned, lifetimeReturnPercentage } =
    useMemo(() => {
      let buys = 0,
        sells = 0,
        charges = 0;
      stockTransactions.forEach((t) => {
        if (t.transactionType === 'BUY') buys += t.totalAmount;
        else if (t.transactionType === 'SELL') sells += t.totalAmount;
        charges += (t.brokerage || 0) + (t.taxes || 0);
      });
      const earned = sells + totalCurrentValue - (buys + charges);
      return {
        totalBuys: buys,
        totalSells: sells,
        totalCharges: charges,
        lifetimeEarned: earned,
        lifetimeReturnPercentage: buys > 0 ? (earned / buys) * 100 : 0,
      };
    }, [stockTransactions, totalCurrentValue]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshLivePrices();
    setIsRefreshing(false);
    showNotification('success', 'Market prices refreshed');
  };

  // Sector-wise distribution
  const sectorData = useMemo(() => {
    const data = groupedStocks.reduce(
      (acc, stock) => {
        const sector = stock.sector || 'Others';
        const existing = acc.find((item) => item.sector === sector);
        if (existing) {
          existing.value += stock.currentValue;
          existing.investment += stock.investmentAmount;
          existing.pnl = existing.value - existing.investment;
        } else {
          acc.push({
            sector,
            value: stock.currentValue,
            investment: stock.investmentAmount,
            pnl: stock.currentValue - stock.investmentAmount,
          });
        }
        return acc;
      },
      [] as Array<{ sector: string; value: number; investment: number; pnl: number }>
    );
    return data.sort((a, b) => b.value - a.value);
  }, [groupedStocks]);

  if (loading) {
    return (
      <div
        className="main-content"
        style={{
          padding: 'clamp(20px, 4vw, 60px)',
          backgroundColor: '#000000',
          minHeight: '100vh',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Loader2
            size={32}
            className="spin-animation"
            style={{ color: '#6366f1', marginBottom: '12px' }}
          />
          <div style={{ fontSize: '1rem', color: '#64748b' }}>Loading your portfolio...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header Section */}
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
            Stock Portfolio
          </h1>
        </div>
        <div
          className="mobile-page-header__actions"
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{
              padding: '12px',
              borderRadius: '14px',
              background: '#050505',
              color: isRefreshing ? '#64748b' : '#818cf8',
              border: '1px solid #111111',
              cursor: isRefreshing ? 'wait' : 'pointer',
              transition: '0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Refresh Markets"
          >
            <Zap
              size={20}
              className={isRefreshing ? 'spin-animation' : ''}
              fill={isRefreshing ? 'none' : 'currentColor'}
            />
          </button>
          <button
            onClick={() => openModal('stock')}
            style={{
              padding: '10px 16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              color: 'white',
              border: 'none',
              fontWeight: '800',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)',
              transition: '0.2s',
              flexShrink: 0,
            }}
          >
            <Plus size={16} strokeWidth={3} />
            <span className="hide-sm">Add Stock</span>
          </button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid-responsive-4" style={{ marginBottom: '32px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid #111111',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              color: '#6366f1',
            }}
          >
            <DollarSign size={18} />
            <span style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              Inv. Capital
            </span>
          </div>
          <div
            className="stat-value-responsive"
            style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: '900', color: '#fff' }}
          >
            ₹{totalInvestment.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid #111111',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              color: '#10b981',
            }}
          >
            <TrendingUp size={18} />
            <span style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              Current Value
            </span>
          </div>
          <div
            className="stat-value-responsive"
            style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: '900', color: '#fff' }}
          >
            ₹{totalCurrentValue.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid #111111',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              color: totalDayPnL >= 0 ? '#34d399' : '#f87171',
            }}
          >
            <Activity size={18} />
            <span style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              Day&apos;s P&L
            </span>
          </div>
          <div
            className="stat-value-responsive"
            style={{
              fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
              fontWeight: '900',
              color: totalDayPnL >= 0 ? '#34d399' : '#f87171',
            }}
          >
            {totalDayPnL >= 0 ? '+' : ''}₹
            {totalDayPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: totalDayPnL >= 0 ? '#34d399' : '#f87171',
              opacity: 0.85,
              marginTop: '4px',
            }}
          >
            ({totalDayPnLPercentage >= 0 ? '+' : ''}
            {totalDayPnLPercentage.toFixed(2)}%)
          </div>
        </div>
        <div
          style={{
            background: 'linear-gradient(135deg, #050505 0%, #111111 100%)',
            padding: '24px',
            borderRadius: '20px',
            border: '1px solid #111111',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
              color: totalPnL >= 0 ? '#34d399' : '#f87171',
            }}
          >
            {totalPnL >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
            <span style={{ fontWeight: '800', fontSize: '0.8rem', textTransform: 'uppercase' }}>
              Unrealized Gain
            </span>
          </div>
          <div
            className="stat-value-responsive"
            style={{
              fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
              fontWeight: '900',
              color: totalPnL >= 0 ? '#34d399' : '#f87171',
            }}
          >
            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="mobile-tab-scroll"
        style={{
          display: 'flex',
          background: '#050505',
          padding: '6px',
          borderRadius: '16px',
          border: '1px solid #111111',
          marginBottom: '24px',
          maxWidth: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { id: 'portfolio', label: 'Holdings', icon: <BarChart3 size={16} /> },
          { id: 'allocation', label: 'Allocation', icon: <PieChartIcon size={16} /> },
          { id: 'history', label: 'History', icon: <History size={16} /> },
          { id: 'lifetime', label: 'Lifetime', icon: <Star size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id as 'portfolio' | 'allocation' | 'history' | 'lifetime')
            }
            style={{
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              background: activeTab === tab.id ? '#6366f1' : 'transparent',
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

      {/* Tab Content */}
      {activeTab === 'portfolio' && (
        <div className="fade-in">
          {/* Mobile Card View */}
          <div className="mobile-card-list">
            {groupedStocks.length > 0 ? (
              groupedStocks.map((stock, idx) => (
                <div
                  key={stock.id}
                  className="premium-card"
                  style={{
                    padding: '16px',
                    background: 'linear-gradient(145deg, #050505 0%, #111111 100%)',
                    borderLeft: `4px solid ${COLORS[idx % COLORS.length]}`,
                  }}
                  onClick={() => handleEditStock(stock)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#fff' }}>
                        {stock.symbol}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>
                        {stock.exchange}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '2px' }}>
                        Current Value
                      </div>
                      <div style={{ fontWeight: '900', color: '#fff' }}>
                        ₹{stock.currentValue.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '12px',
                      marginBottom: '16px',
                      padding: '12px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '12px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Avg. Cost
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                        ₹{stock.avgPrice.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        LTP
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                        ₹{stock.currentPrice.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Quantity
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{stock.quantity}</div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: '#64748b',
                          textTransform: 'uppercase',
                          marginBottom: '4px',
                        }}
                      >
                        Total P&L
                      </div>
                      <div
                        style={{
                          fontWeight: '900',
                          fontSize: '1rem',
                          color: stock.pnl >= 0 ? '#10b981' : '#f43f5e',
                        }}
                      >
                        {stock.pnl >= 0 ? '+' : ''}₹{stock.pnl.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {(() => {
                        const prevClose = stock.previousPrice ?? stock.currentPrice;
                        const dayChange = (stock.currentPrice - prevClose) * stock.quantity;
                        const dayChangePct =
                          prevClose > 0 ? ((stock.currentPrice - prevClose) / prevClose) * 100 : 0;
                        return (
                          <div
                            style={{
                              color: dayChange >= 0 ? '#10b981' : '#f43f5e',
                              fontSize: '0.75rem',
                              fontWeight: '800',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              background:
                                dayChange >= 0
                                  ? 'rgba(16, 185, 129, 0.08)'
                                  : 'rgba(244, 63, 94, 0.08)',
                              padding: '4px 10px',
                              borderRadius: '8px',
                            }}
                          >
                            Day: {dayChange >= 0 ? '+' : ''}₹{dayChange.toFixed(2)}
                            <span style={{ opacity: 0.8, fontSize: '0.65rem' }}>
                              ({dayChangePct >= 0 ? '+' : ''}
                              {dayChangePct.toFixed(2)}%)
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="mobile-action-btn mobile-action-btn--view"
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingCharges({ type: 'stock', data: stock });
                        }}
                        aria-label="View charges"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="mobile-action-btn mobile-action-btn--sell"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExitStock(stock);
                        }}
                        aria-label="Sell stock"
                      >
                        <ArrowRight size={16} />
                      </button>
                      <button
                        className="mobile-action-btn mobile-action-btn--delete"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const isConfirmed = await customConfirm({
                            title: 'Delete',
                            message: `Remove ${stock.symbol}?`,
                            type: 'error',
                            confirmLabel: 'Delete',
                          });
                          if (isConfirmed) await deleteStock(stock.id);
                        }}
                        aria-label="Delete stock"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
                <EmptyPortfolioVisual />
                <div style={{ fontWeight: '700', marginTop: '20px' }}>No holdings found</div>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="premium-card hide-mobile" style={{ padding: '0', overflow: 'hidden' }}>
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
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                    }}
                  >
                    Instrument
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    Qty.
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    Avg. cost
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    Invested
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    LTP
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    Cur. value
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    Day&apos;s P&L
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    P&L
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'right',
                    }}
                  >
                    Net chg.
                  </th>
                  <th
                    style={{
                      padding: '16px 24px',
                      color: '#64748b',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      textAlign: 'center',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedStocks.length > 0 ? (
                  groupedStocks.map((stock) => (
                    <tr
                      key={stock.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.02)',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')
                      }
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: '800', color: '#fff' }}>{stock.symbol}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {stock.exchange}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#94a3b8',
                        }}
                      >
                        {stock.quantity}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#94a3b8',
                        }}
                      >
                        ₹{stock.avgPrice.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#94a3b8',
                        }}
                      >
                        ₹{stock.investmentAmount.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#fff',
                        }}
                      >
                        ₹{stock.currentPrice.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '700',
                          color: '#fff',
                        }}
                      >
                        ₹{stock.currentValue.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        {(() => {
                          const prevClose = stock.previousPrice ?? stock.currentPrice;
                          const dayChange = (stock.currentPrice - prevClose) * stock.quantity;
                          const dayChangePct =
                            prevClose > 0
                              ? ((stock.currentPrice - prevClose) / prevClose) * 100
                              : 0;
                          return (
                            <div
                              style={{
                                fontWeight: '800',
                                color: dayChange >= 0 ? '#10b981' : '#f43f5e',
                              }}
                            >
                              {dayChange >= 0 ? '+' : ''}₹
                              {dayChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                              <div style={{ fontSize: '0.65rem', fontWeight: '600', opacity: 0.8 }}>
                                ({dayChangePct >= 0 ? '+' : ''}
                                {dayChangePct.toFixed(2)}%)
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td
                        style={{
                          padding: '16px 24px',
                          textAlign: 'right',
                          fontWeight: '800',
                          color: stock.pnl >= 0 ? '#10b981' : '#f43f5e',
                        }}
                      >
                        {stock.pnl >= 0 ? '+' : ''}₹{stock.pnl.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div
                          style={{
                            color: stock.pnl >= 0 ? '#10b981' : '#f43f5e',
                            fontWeight: '900',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                          }}
                        >
                          {stock.pnlPercentage.toFixed(2)}%
                          {stock.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingCharges({ type: 'stock', data: stock });
                            }}
                            title="Estimated Exit Charges"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6366f1',
                              cursor: 'pointer',
                              padding: '4px',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExitStock(stock);
                            }}
                            title="Exit / Sell"
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStock(stock);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const isConfirmed = await customConfirm({
                                title: 'Delete Stock',
                                message: `Remove ${stock.symbol}?`,
                                type: 'error',
                                confirmLabel: 'Delete',
                              });
                              if (isConfirmed) await deleteStock(stock.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#64748b',
                              cursor: 'pointer',
                              padding: '4px',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      style={{ padding: '80px 24px', textAlign: 'center', color: '#64748b' }}
                    >
                      <EmptyPortfolioVisual />
                      <div
                        style={{
                          fontWeight: '800',
                          fontSize: '1.1rem',
                          color: '#fff',
                          marginTop: '24px',
                        }}
                      >
                        No active holdings found
                      </div>
                      <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                        Add your first stock to start tracking your portfolio.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
              {stocks.length > 0 && (
                <tfoot
                  style={{ background: 'rgba(255,255,255,0.03)', borderTop: '2px solid #111111' }}
                >
                  <tr>
                    <td style={{ padding: '20px 24px', fontWeight: '800', color: '#64748b' }}>
                      TOTAL
                    </td>
                    <td colSpan={4}></td>
                    <td
                      style={{
                        padding: '20px 24px',
                        textAlign: 'right',
                        fontWeight: '900',
                        color: '#fff',
                        fontSize: '1rem',
                      }}
                    >
                      ₹{totalCurrentValue.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '20px 24px',
                        textAlign: 'right',
                        fontWeight: '900',
                        color: totalDayPnL >= 0 ? '#10b981' : '#f43f5e',
                        fontSize: '1rem',
                      }}
                    >
                      {totalDayPnL >= 0 ? '+' : ''}₹
                      {totalDayPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td
                      style={{
                        padding: '20px 24px',
                        textAlign: 'right',
                        fontWeight: '900',
                        color: totalPnL >= 0 ? '#10b981' : '#f43f5e',
                        fontSize: '1rem',
                      }}
                    >
                      {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString()}
                    </td>
                    <td
                      style={{
                        padding: '20px 24px',
                        textAlign: 'right',
                        fontWeight: '900',
                        color: totalPnL >= 0 ? '#10b981' : '#f43f5e',
                      }}
                    >
                      {totalInvestment > 0
                        ? (((totalCurrentValue - totalInvestment) / totalInvestment) * 100).toFixed(
                            2
                          )
                        : '0.00'}
                      %
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {activeTab === 'allocation' && (
        <div className="grid-responsive-2" style={{ gap: '32px' }}>
          <div
            style={{
              background: 'linear-gradient(145deg, #050505 0%, #111111 100%)',
              padding: 'clamp(20px, 4vw, 40px)',
              borderRadius: 'clamp(20px, 3vw, 32px)',
              border: '1px solid #111111',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6366f1',
                }}
              >
                <PieChartIcon size={20} />
              </div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>
                Sector Diversification
              </h4>
            </div>
            <div style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer key={activeTab} width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="sector"
                    stroke="none"
                    label={({
                      cx = 0,
                      cy = 0,
                      midAngle = 0,
                      outerRadius = 0,
                      value = 0,
                      index = 0,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 30;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const percent = (value / totalCurrentValue) * 100;

                      // Only show if > 2% to avoid overlap
                      if (percent < 2) return null;

                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#d3dde7"
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline="central"
                          style={{ fontSize: '0.75rem', fontWeight: '800', fontFamily: 'Inter' }}
                        >
                          {sectorData[index].sector}: {percent.toFixed(0)}%
                        </text>
                      );
                    }}
                  >
                    {sectorData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#000000',
                      border: '1px solid #1a1a1a',
                      borderRadius: '16px',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                      padding: '12px',
                    }}
                    itemStyle={{ color: '#e4ebf1' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid-responsive-2" style={{ marginTop: '32px', gap: '16px' }}>
              {sectorData.map((sec, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: COLORS[idx % COLORS.length],
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
                      {sec.sector}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ₹{sec.value.toLocaleString()} (
                      {(totalCurrentValue > 0 ? (sec.value / totalCurrentValue) * 100 : 0).toFixed(
                        1
                      )}
                      %)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div
              style={{
                background: '#050505',
                borderRadius: 'clamp(20px, 3vw, 32px)',
                border: '1px solid #111111',
                padding: 'clamp(20px, 4vw, 40px)',
              }}
            >
              <h4 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: '24px' }}>
                Equity Weights
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {groupedStocks
                  .sort((a, b) => b.currentValue - a.currentValue)
                  .slice(0, 6)
                  .map((stock) => (
                    <div key={stock.id}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                          fontSize: '0.9rem',
                        }}
                      >
                        <span style={{ fontWeight: '800', color: '#fff' }}>{stock.symbol}</span>
                        <span style={{ color: '#94a3b8', fontWeight: '600' }}>
                          {(totalCurrentValue > 0
                            ? (stock.currentValue / totalCurrentValue) * 100
                            : 0
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '8px',
                          background: '#000000',
                          borderRadius: '100px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${(stock.currentValue / totalCurrentValue) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(to right, #6366f1, #818cf8)',
                            borderRadius: '100px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>
            Global Transaction History
          </h3>
          {stockTransactions.length > 0 ? (
            stockTransactions.map((transaction) => {
              const stock = stocks.find((s) => s.id === transaction.stockId);
              return (
                <div
                  key={transaction.id}
                  className="tx-history-card"
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
                  <div
                    className="tx-history-card__left"
                    style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
                  >
                    <div
                      style={{
                        background:
                          transaction.transactionType === 'BUY'
                            ? 'rgba(248, 113, 113, 0.1)'
                            : 'rgba(16, 185, 129, 0.1)',
                        color: transaction.transactionType === 'BUY' ? '#f87171' : '#10b981',
                        padding: '12px',
                        borderRadius: '14px',
                      }}
                    >
                      {transaction.transactionType === 'BUY' ? (
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
                        {stock?.symbol || 'Unknown'} • {transaction.transactionType}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                        {transaction.quantity} shares @ ₹{transaction.price.toFixed(2)}
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
                        <Calendar size={12} />{' '}
                        {new Date(transaction.transactionDate).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                  <div
                    className="tx-history-card__right"
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
                          color: transaction.transactionType === 'BUY' ? '#f87171' : '#34d399',
                        }}
                      >
                        {transaction.transactionType === 'BUY' ? '-' : '+'}₹
                        {transaction.totalAmount.toLocaleString()}
                      </div>
                      {(transaction.brokerage || transaction.taxes) && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            color: '#475569',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '4px',
                          }}
                        >
                          Charges: ₹
                          {((transaction.brokerage || 0) + (transaction.taxes || 0)).toFixed(2)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingCharges({
                                type: 'stock',
                                data: {
                                  symbol:
                                    stocks.find((s) => s.id === transaction.stockId)?.symbol ||
                                    'STOCK',
                                  quantity: transaction.quantity,
                                  currentPrice: transaction.price,
                                  exchange:
                                    stocks.find((s) => s.id === transaction.stockId)?.exchange ||
                                    'NSE',
                                },
                              });
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6366f1',
                              padding: 0,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const isConfirmed = await customConfirm({
                          title: 'Delete Transaction',
                          message: 'Are you sure you want to delete this historical transaction?',
                          type: 'warning',
                          confirmLabel: 'Delete',
                        });
                        if (isConfirmed) {
                          await deleteStockTransaction(transaction.id);
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
                Your trading activities will appear here chronologically
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'lifetime' && (
        <div className="grid-responsive-3" style={{ gap: '32px' }}>
          <div
            className="lifetime-report-card"
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
              <Star color="#f59e0b" fill="#f59e0b" size={24} /> Lifetime Wealth Report
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
                  Total Money Inflow
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: '950', color: '#fff' }}>
                  ₹{totalBuys.toLocaleString()}
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
                    color: lifetimeEarned >= 0 ? '#10b981' : '#ef4444',
                  }}
                >
                  {lifetimeEarned >= 0 ? '+' : ''}₹{lifetimeEarned.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '8px' }}>
                  Absolute profit after all charges
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
                  Total Withdrawals
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                  ₹{totalSells.toLocaleString()}
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
                  Regulatory Charges
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ef4444' }}>
                  ₹{totalCharges.toLocaleString()}
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
                  XIRR Equivalent
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981' }}>
                  {lifetimeReturnPercentage.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            className="modal-card"
            style={{
              background: '#050505',
              border: '1px solid #1a1a1a',
              width: '100%',
              maxWidth: '500px',
            }}
          >
            {/* Mobile handle indicator */}
            <div className="mobile-modal-sheet__handle hide-desktop" />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366f1',
                  }}
                >
                  {modalType === 'stock' ? <TrendingUp size={20} /> : <Activity size={20} />}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: 0 }}>
                  {modalType === 'stock' && (editId ? 'Edit Stock' : 'Add Stock')}
                  {modalType === 'transaction' && 'Add Transaction'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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

            {modalType === 'stock' && (
              <form
                onSubmit={handleStockSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div style={{ position: 'relative' }}>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#475569',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Search Stock
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#475569',
                      }}
                    />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or symbol..."
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px 12px 12px 40px',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '0.9rem',
                        outline: 'none',
                      }}
                      onFocus={() => setShowResults(true)}
                    />
                    {isSearching && (
                      <Loader2
                        size={18}
                        className="animate-spin"
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6366f1',
                        }}
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
                        background: '#050505',
                        border: '1px solid #111111',
                        borderRadius: '12px',
                        marginTop: '8px',
                        zIndex: 1100,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                      }}
                    >
                      {searchResults.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectStock(item)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #111111',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#fff' }}>
                            {item.symbol}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {item.companyName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Symbol
                    </label>
                    <input
                      value={symbol}
                      readOnly
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#94a3b8',
                        fontSize: '0.9rem',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Exchange
                    </label>
                    <select
                      value={exchange}
                      onChange={(e) => setExchange(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    >
                      <option value="NSE">NSE</option>
                      <option value="BSE">BSE</option>
                    </select>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Avg Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={avgPrice}
                      onChange={(e) => setAvgPrice(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      LTP
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>

                {initialBuyChargePreview && !editId && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.14)',
                      borderRadius: '16px',
                      padding: '16px',
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
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>Trade value</span>
                      <span style={{ color: '#fff', fontWeight: '800' }}>
                        INR {initialBuyChargePreview.turnover.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>Taxes and charges</span>
                      <span style={{ color: '#fff', fontWeight: '800' }}>
                        INR {initialBuyChargePreview.taxes.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>Estimated bank debit</span>
                      <span style={{ color: '#34d399', fontWeight: '900' }}>
                        INR {initialBuyChargePreview.settlementAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {!editId && (
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Operating Bank Account (For Ledger)
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) =>
                        setSelectedAccountId(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    >
                      <option value="">Select Account</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} - INR {acc.balance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  {editId ? 'Update Stock' : 'Add Stock'}
                </button>
              </form>
            )}

            {modalType === 'transaction' && (
              <form
                onSubmit={handleTransactionSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#475569',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Select Security
                  </label>
                  <select
                    value={selectedStockId}
                    onChange={(e) => setSelectedStockId(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: '#000000',
                      border: '1px solid #111111',
                      padding: '12px',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  >
                    <option value="" disabled>
                      Select Stock
                    </option>
                    {groupedStocks.map((stock) => (
                      <option key={stock.id} value={stock.id}>
                        {stock.symbol} - {stock.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Type
                    </label>
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as 'BUY' | 'SELL')}
                      disabled={isTypeLocked}
                      style={{
                        width: '100%',
                        background: isTypeLocked ? 'rgba(0, 0, 0, 0.5)' : '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: isTypeLocked ? '#64748b' : '#fff',
                        cursor: isTypeLocked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={transactionQuantity}
                      onChange={(e) => setTransactionQuantity(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Execution Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={transactionPrice}
                      onChange={(e) => setTransactionPrice(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      value={transactionDate}
                      onChange={(e) => setTransactionDate(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Brokerage (auto)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={
                        transactionChargePreview
                          ? transactionChargePreview.brokerage.toFixed(2)
                          : ''
                      }
                      readOnly
                      placeholder="Calculated automatically"
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: '#475569',
                        textTransform: 'uppercase',
                        display: 'block',
                        marginBottom: '8px',
                      }}
                    >
                      Taxes and charges (auto)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={
                        transactionChargePreview ? transactionChargePreview.taxes.toFixed(2) : ''
                      }
                      readOnly
                      placeholder="Calculated automatically"
                      style={{
                        width: '100%',
                        background: '#000000',
                        border: '1px solid #111111',
                        padding: '12px',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                  </div>
                </div>

                {transactionChargePreview && (
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.06)',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid rgba(16, 185, 129, 0.14)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: '900',
                        color: '#34d399',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12px',
                      }}
                    >
                      Zerodha Delivery Estimate
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>Trade value</span>
                      <span style={{ fontWeight: '800', color: '#fff' }}>
                        INR {transactionChargePreview.turnover.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>Brokerage</span>
                      <span style={{ fontWeight: '800', color: '#fff' }}>
                        INR {transactionChargePreview.brokerage.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>Taxes and charges</span>
                      <span style={{ fontWeight: '800', color: '#fff' }}>
                        INR {transactionChargePreview.taxes.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span style={{ color: '#94a3b8' }}>
                        {transactionType === 'BUY' ? 'Estimated debit' : 'Estimated credit'}
                      </span>
                      <span style={{ fontWeight: '900', color: '#34d399' }}>
                        INR {transactionChargePreview.settlementAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#475569',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Operating Bank Account
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) =>
                      setSelectedAccountId(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    required
                    style={{
                      width: '100%',
                      background: '#000000',
                      border: '1px solid #111111',
                      padding: '12px',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  >
                    <option value="">Select Account</option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - INR {acc.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '6px' }}>
                    Money will be {transactionType === 'BUY' ? 'deducted from' : 'added to'} this
                    account.
                  </p>
                </div>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    padding: '16px',
                    borderRadius: '16px',
                    border: 'none',
                    fontWeight: '800',
                    cursor: 'pointer',
                  }}
                >
                  Confirm Transaction
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {viewingCharges && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1100 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingCharges(null);
          }}
        >
          <div
            className="modal-card"
            style={{
              background: '#050505',
              border: '1px solid #1a1a1a',
              width: '100%',
              maxWidth: '450px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366f1',
                  }}
                >
                  <Eye size={20} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0 }}>
                  Charge Breakdown
                </h2>
              </div>
              <button
                onClick={() => setViewingCharges(null)}
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {viewingCharges.type === 'stock' &&
                (() => {
                  const stock = viewingCharges.data;
                  const chargeMeta = getStockChargeMeta(stock.exchange);
                  const charges = calculateStockCharges(
                    'SELL',
                    stock.quantity,
                    stock.currentPrice,
                    stock.exchange
                  );
                  return (
                    <>
                      <div
                        style={{
                          padding: '16px',
                          borderRadius: '16px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          marginBottom: '8px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: '#64748b',
                            marginBottom: '4px',
                            fontWeight: '700',
                          }}
                        >
                          Estimating for Selling
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#fff' }}>
                          {stock.symbol} - {stock.quantity} shares @ INR
                          {stock.currentPrice.toFixed(2)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                          {
                            label: 'Brokerage',
                            value: charges.brokerage,
                            sub: chargeMeta.brokerageLabel,
                          },
                          {
                            label: 'STT/CTT',
                            value: charges.stt,
                            sub: `${chargeMeta.sttRate}% delivery STT`,
                          },
                          {
                            label: 'Transaction Charges',
                            value: charges.transactionCharges,
                            sub: `${chargeMeta.transactionChargeRate}% (${chargeMeta.exchange})`,
                          },
                          {
                            label: 'SEBI Charges',
                            value: charges.sebiCharges,
                            sub: 'INR 10 per crore turnover',
                          },
                          {
                            label: 'Stamp Duty',
                            value: charges.stampDuty,
                            sub: '0.015% (Buy only)',
                          },
                          { label: 'GST', value: charges.gst, sub: '18% on fees' },
                          {
                            label: 'DP Charges',
                            value: charges.dpCharges,
                            sub: 'INR 13 plus GST on sell delivery',
                          },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div
                                style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}
                              >
                                {item.label}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#475569' }}>
                                {item.sub}
                              </div>
                            </div>
                            <div
                              style={{
                                fontWeight: '800',
                                color: item.value > 0 ? '#fff' : '#475569',
                              }}
                            >
                              INR {item.value.toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div
                        style={{
                          marginTop: '20px',
                          paddingTop: '20px',
                          borderTop: '1px solid #111111',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ fontWeight: '900', color: '#fff' }}>Total Charges</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '950', color: '#6366f1' }}>
                          INR {charges.total.toFixed(2)}
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: '0.7rem',
                          color: '#64748b',
                          marginTop: '12px',
                          fontStyle: 'italic',
                        }}
                      >
                        * Estimates use Zerodha delivery charges for the selected exchange.
                      </p>
                    </>
                  );
                })()}
            </div>

            <button
              onClick={() => setViewingCharges(null)}
              style={{
                width: '100%',
                background: '#111111',
                color: '#fff',
                padding: '14px',
                borderRadius: '16px',
                border: 'none',
                fontWeight: '800',
                cursor: 'pointer',
                marginTop: '24px',
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
