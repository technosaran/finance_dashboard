'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useLedger, usePortfolio, useSettings } from '../components/FinanceContext';
import { Stock, StockTransaction } from '@/lib/types';
import { calculateStockCharges, getStockChargeMeta, StockChargeMode } from '@/lib/utils/charges';
import { logError } from '@/lib/utils/logger';
import {
  calculateStockTradeChargesTotal,
  calculateStockTradeSettlement,
  validateStockTrade,
} from '@/lib/utils/stock-transactions';
import {
  calculateLifetimePerformance,
  calculatePositionMetrics,
  calculatePositionMetricsFromInvestment,
} from '@/lib/utils/portfolio';
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
  Edit3,
  Trash2,
  ArrowRight,
  Eye,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { EmptyPortfolioVisual } from '../components/Visuals';

const COLORS = [
  '#1ea672',
  '#43c08a',
  '#f2a93b',
  '#3ea8a1',
  '#146d63',
  '#8fd5b6',
  '#ef5d5d',
  '#6cb6ff',
];

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const formatInr = (value: number) => inrFormatter.format(value);

const formatSignedInr = (value: number) => `${value >= 0 ? '+' : '-'}${formatInr(Math.abs(value))}`;

const normalizeStockSymbol = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');

const STOCK_SECTOR_BY_SYMBOL: Record<string, string> = {
  INFY: 'Technology',
  TCS: 'Technology',
  WIPRO: 'Technology',
  HCLTECH: 'Technology',
  TECHM: 'Technology',
  LTIM: 'Technology',
  PERSISTENT: 'Technology',
  COFORGE: 'Technology',
  HDFCBANK: 'Financial Services',
  ICICIBANK: 'Financial Services',
  SBIN: 'Financial Services',
  AXISBANK: 'Financial Services',
  KOTAKBANK: 'Financial Services',
  BAJFINANCE: 'Financial Services',
  JIOFIN: 'Financial Services',
  IRFC: 'Financial Services',
  RELIANCE: 'Energy',
  ONGC: 'Energy',
  IOC: 'Energy',
  BPCL: 'Energy',
  HINDPETRO: 'Energy',
  NTPC: 'Energy',
  POWERGRID: 'Energy',
  SUNPHARMA: 'Healthcare',
  CIPLA: 'Healthcare',
  DRREDDY: 'Healthcare',
  DIVISLAB: 'Healthcare',
  APOLLOHOSP: 'Healthcare',
  TATAMOTORS: 'Automobile',
  MARUTI: 'Automobile',
  EICHERMOT: 'Automobile',
  BAJAJAUTO: 'Automobile',
  HEROMOTOCO: 'Automobile',
  LT: 'Industrials',
  BEL: 'Industrials',
  HAL: 'Industrials',
  SIEMENS: 'Industrials',
  TATASTEEL: 'Materials',
  JSWSTEEL: 'Materials',
  HINDALCO: 'Materials',
  ULTRACEMCO: 'Materials',
  GRASIM: 'Materials',
  ITC: 'Consumer',
  HINDUNILVR: 'Consumer',
  NESTLEIND: 'Consumer',
  BRITANNIA: 'Consumer',
  TATACONSUM: 'Consumer',
  ASIANPAINT: 'Consumer',
  BHARTIARTL: 'Telecom',
  INDUSTOWER: 'Telecom',
  DLF: 'Real Estate',
  GODREJPROP: 'Real Estate',
};

const STOCK_SECTOR_RULES: Array<{ sector: string; patterns: RegExp[] }> = [
  {
    sector: 'Financial Services',
    patterns: [
      /\bBANK\b/,
      /\bFINANCE\b/,
      /\bINSURANCE\b/,
      /\bCAPITAL\b/,
      /\bSECURITIES\b/,
      /\bBROKING\b/,
      /\bAMC\b/,
      /\bWEALTH\b/,
      /\bHOUSING\b/,
      /\bNBFC\b/,
    ],
  },
  {
    sector: 'Technology',
    patterns: [
      /\bTECH(?:NOLOG(?:Y|IES)?)?\b/,
      /\bSOFTWARE\b/,
      /\bINFOTECH\b/,
      /\bDIGITAL\b/,
      /\bSYSTEMS?\b/,
      /\bCOMPUTERS?\b/,
      /\bIT SERVICES\b/,
    ],
  },
  {
    sector: 'Healthcare',
    patterns: [
      /\bPHARMA\b/,
      /\bLABS?\b/,
      /\bMEDICAL\b/,
      /\bHEALTH(?:CARE)?\b/,
      /\bHOSP(?:ITAL)?\b/,
      /\bBIO(?:TECH)?\b/,
      /\bDIAGNOSTIC\b/,
    ],
  },
  {
    sector: 'Automobile',
    patterns: [
      /\bAUTO\b/,
      /\bMOTORS?\b/,
      /\bTYRE\b/,
      /\bTRACTOR\b/,
      /\bVEHICLE\b/,
      /\bBATTER(?:Y|IES)\b/,
    ],
  },
  {
    sector: 'Energy',
    patterns: [
      /\bENERGY\b/,
      /\bPOWER\b/,
      /\bOIL\b/,
      /\bGAS\b/,
      /\bPETRO(?:LEUM|CHEMICALS?)?\b/,
      /\bRENEWABLE\b/,
      /\bSOLAR\b/,
      /\bGRID\b/,
    ],
  },
  {
    sector: 'Industrials',
    patterns: [
      /\bINFRA\b/,
      /\bENGINEER(?:ING)?\b/,
      /\bINDUSTR(?:IAL|IES|Y)\b/,
      /\bCONSTRUCT(?:ION)?\b/,
      /\bDEFENCE\b/,
      /\bAEROSPACE\b/,
      /\bRAIL\b/,
      /\bLOGISTICS\b/,
      /\bSHIP(?:PING|BUILDING)?\b/,
    ],
  },
  {
    sector: 'Materials',
    patterns: [
      /\bSTEEL\b/,
      /\bMETALS?\b/,
      /\bMINING\b/,
      /\bCOAL\b/,
      /\bALUMIN(?:IUM|UM)\b/,
      /\bCEMENT\b/,
      /\bCHEM(?:ICALS?)?\b/,
      /\bFERTILIZER\b/,
    ],
  },
  {
    sector: 'Consumer',
    patterns: [
      /\bCONSUMER\b/,
      /\bFOODS?\b/,
      /\bBEVERAGES?\b/,
      /\bRETAIL\b/,
      /\bPAINTS?\b/,
      /\bTOBACCO\b/,
      /\bTEXTILES?\b/,
      /\bAPPAREL\b/,
      /\bJEWELL(?:ERY|ERS)\b/,
    ],
  },
  {
    sector: 'Telecom',
    patterns: [/\bTELECOM\b/, /\bCOMMUNICATIONS?\b/, /\bMOBILE\b/, /\bTOWER\b/, /\bBROADBAND\b/],
  },
  {
    sector: 'Real Estate',
    patterns: [/\bREALTY\b/, /\bREAL ESTATE\b/, /\bPROPERT(?:Y|IES)\b/, /\bDEVELOPERS?\b/],
  },
];

const inferStockSector = (symbol: string, companyName: string) => {
  const normalizedSymbol = normalizeStockSymbol(symbol);
  const mappedSector = STOCK_SECTOR_BY_SYMBOL[normalizedSymbol];
  if (mappedSector) return mappedSector;

  const haystack = `${symbol} ${companyName}`.toUpperCase();
  const matchedRule = STOCK_SECTOR_RULES.find(({ patterns }) =>
    patterns.some((pattern) => pattern.test(haystack))
  );

  return matchedRule?.sector || 'Others';
};

const resolveStockSector = (symbol: string, companyName: string, explicitSector?: string) =>
  explicitSector?.trim() ? explicitSector.trim() : inferStockSector(symbol, companyName);

const getChargeModeLabel = (mode: StockChargeMode | 'mixed') => {
  if (mode === 'intraday') return 'Intraday';
  if (mode === 'mixed') return 'Mixed';
  return 'Delivery';
};

type ChargeBreakdownSnapshot = Pick<
  ReturnType<typeof calculateStockCharges>,
  | 'turnover'
  | 'brokerage'
  | 'stt'
  | 'transactionCharges'
  | 'sebiCharges'
  | 'stampDuty'
  | 'gst'
  | 'dpCharges'
  | 'total'
  | 'settlementAmount'
>;

interface ChargeBreakdownCardProps {
  title: string;
  charges: ChargeBreakdownSnapshot;
  settlementLabel: string;
  accentColor: string;
  background: string;
  borderColor: string;
  settlementColor: string;
  prefixRows?: Array<{ label: string; value: string | number }>;
  note?: string;
}

const ChargeBreakdownCard = ({
  title,
  charges,
  settlementLabel,
  accentColor,
  background,
  borderColor,
  settlementColor,
  prefixRows = [],
  note,
}: ChargeBreakdownCardProps) => (
  <div
    style={{
      background,
      border: `1px solid ${borderColor}`,
      borderRadius: '18px',
      padding: '18px',
      display: 'grid',
      gap: '10px',
    }}
  >
    <div
      style={{
        fontSize: '0.72rem',
        fontWeight: '900',
        color: accentColor,
        textTransform: 'uppercase',
        letterSpacing: '1px',
      }}
    >
      {title}
    </div>
    {prefixRows.map((row) => (
      <div
        key={`${row.label}-${row.value}`}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.85rem',
        }}
      >
        <span style={{ color: '#94a3b8' }}>{row.label}</span>
        <span style={{ color: '#f4f8f7', fontWeight: '800', textAlign: 'right' }}>{row.value}</span>
      </div>
    ))}
    {[
      ['Trade value', formatInr(charges.turnover)],
      ['Brokerage', formatInr(charges.brokerage)],
      ['STT', formatInr(charges.stt)],
      ['Exchange txn charges', formatInr(charges.transactionCharges)],
      ['SEBI charges', formatInr(charges.sebiCharges)],
      ['GST', formatInr(charges.gst)],
      ['Stamp duty', formatInr(charges.stampDuty)],
      ['DP charges', formatInr(charges.dpCharges)],
      ['Total charges', formatInr(charges.total)],
    ].map(([label, value]) => (
      <div
        key={label}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.85rem',
        }}
      >
        <span style={{ color: '#94a3b8' }}>{label}</span>
        <span style={{ color: '#f4f8f7', fontWeight: '800', textAlign: 'right' }}>{value}</span>
      </div>
    ))}
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        paddingTop: '10px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '0.88rem',
      }}
    >
      <span style={{ color: '#c0d2cb', fontWeight: '700' }}>{settlementLabel}</span>
      <span style={{ color: settlementColor, fontWeight: '900', textAlign: 'right' }}>
        {formatInr(charges.settlementAmount)}
      </span>
    </div>
    {note && <div style={{ fontSize: '0.74rem', color: '#9aaea9', lineHeight: 1.5 }}>{note}</div>}
  </div>
);

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
  const [viewingHolding, setViewingHolding] = useState<Stock | null>(null);

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

  const selectedTransactionExchange =
    selectedTransactionStock?.exchange === 'BSE' ? 'BSE' : ('NSE' as const);

  const stockFundingAccounts = useMemo(
    () => accounts.filter((account) => account.currency === 'INR'),
    [accounts]
  );

  const selectedFundingAccount = useMemo(
    () => stockFundingAccounts.find((account) => account.id === Number(selectedAccountId)) || null,
    [selectedAccountId, stockFundingAccounts]
  );

  const getDefaultStockFundingAccountId = useCallback(() => {
    const defaultAccountId = settings.defaultStockAccountId;

    return defaultAccountId &&
      stockFundingAccounts.some((account) => account.id === defaultAccountId)
      ? defaultAccountId
      : '';
  }, [settings.defaultStockAccountId, stockFundingAccounts]);

  const getHoldingIds = useCallback(
    (stockId: number) => {
      const currentStock = stocks.find((stock) => stock.id === stockId);
      if (!currentStock) return [stockId];

      return stocks
        .filter(
          (stock) =>
            stock.symbol.toUpperCase() === currentStock.symbol.toUpperCase() &&
            stock.exchange.toUpperCase() === currentStock.exchange.toUpperCase()
        )
        .map((stock) => stock.id);
    },
    [stocks]
  );

  const selectedTransactionAvailableQuantity = useMemo(() => {
    if (!selectedTransactionStock) return 0;

    const holdingIds = getHoldingIds(selectedTransactionStock.id);
    return stocks
      .filter((stock) => holdingIds.includes(stock.id))
      .reduce((sum, stock) => sum + stock.quantity, 0);
  }, [getHoldingIds, selectedTransactionStock, stocks]);

  const getIntradaySellQuantity = useCallback(
    (
      transactionList: StockTransaction[],
      stockIds: number[],
      date: string,
      requestedQuantity: number
    ) => {
      const sameDayTransactions = transactionList.filter(
        (transaction) =>
          stockIds.includes(transaction.stockId) && transaction.transactionDate === date
      );
      const sameDayBuys = sameDayTransactions
        .filter((transaction) => transaction.transactionType === 'BUY')
        .reduce((sum, transaction) => sum + transaction.quantity, 0);
      const sameDaySells = sameDayTransactions
        .filter((transaction) => transaction.transactionType === 'SELL')
        .reduce((sum, transaction) => sum + transaction.quantity, 0);
      const netSameDayBuyQuantity = Math.max(0, sameDayBuys - sameDaySells);

      return Math.max(0, Math.min(requestedQuantity, netSameDayBuyQuantity));
    },
    []
  );

  const aggregateStockCharges = useCallback(
    (
      type: 'BUY' | 'SELL',
      quantityValue: number,
      priceValue: number,
      exchangeValue: 'NSE' | 'BSE',
      stockId?: number,
      dateValue?: string
    ) => {
      if (type === 'BUY') {
        const charges = calculateStockCharges(type, quantityValue, priceValue, exchangeValue);
        return {
          mode: 'delivery' as const,
          intradayQuantity: 0,
          deliveryQuantity: quantityValue,
          deliveryCharges: charges,
          intradayCharges: null,
          total: charges,
        };
      }

      const relatedHoldingIds = stockId ? getHoldingIds(stockId) : [];
      const intradayQuantity =
        relatedHoldingIds.length > 0 && dateValue
          ? getIntradaySellQuantity(stockTransactions, relatedHoldingIds, dateValue, quantityValue)
          : 0;
      const deliveryQuantity = Math.max(0, quantityValue - intradayQuantity);
      const intradayCharges =
        intradayQuantity > 0
          ? calculateStockCharges(type, intradayQuantity, priceValue, exchangeValue, 'intraday')
          : null;
      const deliveryCharges =
        deliveryQuantity > 0
          ? calculateStockCharges(type, deliveryQuantity, priceValue, exchangeValue, 'delivery')
          : null;

      const mode: 'delivery' | 'intraday' | 'mixed' =
        intradayQuantity > 0 && deliveryQuantity > 0
          ? 'mixed'
          : intradayQuantity > 0
            ? 'intraday'
            : 'delivery';

      const total = {
        mode,
        exchange: exchangeValue,
        turnover: Number(
          ((intradayCharges?.turnover ?? 0) + (deliveryCharges?.turnover ?? 0)).toFixed(2)
        ),
        brokerage: Number(
          ((intradayCharges?.brokerage ?? 0) + (deliveryCharges?.brokerage ?? 0)).toFixed(2)
        ),
        stt: Number(((intradayCharges?.stt ?? 0) + (deliveryCharges?.stt ?? 0)).toFixed(2)),
        transactionCharges: Number(
          (
            (intradayCharges?.transactionCharges ?? 0) + (deliveryCharges?.transactionCharges ?? 0)
          ).toFixed(2)
        ),
        sebiCharges: Number(
          ((intradayCharges?.sebiCharges ?? 0) + (deliveryCharges?.sebiCharges ?? 0)).toFixed(2)
        ),
        stampDuty: Number(
          ((intradayCharges?.stampDuty ?? 0) + (deliveryCharges?.stampDuty ?? 0)).toFixed(2)
        ),
        gst: Number(((intradayCharges?.gst ?? 0) + (deliveryCharges?.gst ?? 0)).toFixed(2)),
        dpCharges: Number(
          ((intradayCharges?.dpCharges ?? 0) + (deliveryCharges?.dpCharges ?? 0)).toFixed(2)
        ),
        taxes: Number(((intradayCharges?.taxes ?? 0) + (deliveryCharges?.taxes ?? 0)).toFixed(2)),
        total: Number(((intradayCharges?.total ?? 0) + (deliveryCharges?.total ?? 0)).toFixed(2)),
        settlementAmount: Number(
          (
            (intradayCharges?.settlementAmount ?? 0) + (deliveryCharges?.settlementAmount ?? 0)
          ).toFixed(2)
        ),
      };

      return {
        mode,
        intradayQuantity,
        deliveryQuantity,
        intradayCharges,
        deliveryCharges,
        total,
      };
    },
    [getHoldingIds, getIntradaySellQuantity, stockTransactions]
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

    return aggregateStockCharges(
      transactionType,
      qty,
      price,
      selectedTransactionExchange,
      selectedTransactionStock?.id,
      transactionDate
    );
  }, [
    aggregateStockCharges,
    transactionQuantity,
    transactionPrice,
    transactionType,
    selectedTransactionExchange,
    selectedTransactionStock,
    transactionDate,
  ]);

  const initialBuyTradeValidation = useMemo(() => {
    if (editId !== null || !initialBuyChargePreview) {
      return null;
    }

    return validateStockTrade({
      transactionType: 'BUY',
      quantity: Number(quantity),
      settlementAmount: initialBuyChargePreview.settlementAmount,
      accountBalance: selectedFundingAccount?.balance,
    });
  }, [editId, initialBuyChargePreview, quantity, selectedFundingAccount]);

  const transactionTradeValidation = useMemo(() => {
    if (!transactionChargePreview) {
      return null;
    }

    return validateStockTrade({
      transactionType,
      quantity: Number(transactionQuantity),
      availableQuantity: transactionType === 'SELL' ? selectedTransactionAvailableQuantity : null,
      settlementAmount:
        transactionType === 'BUY' ? transactionChargePreview.total.settlementAmount : null,
      accountBalance: selectedFundingAccount?.balance,
    });
  }, [
    transactionChargePreview,
    transactionType,
    transactionQuantity,
    selectedTransactionAvailableQuantity,
    selectedFundingAccount,
  ]);

  const viewingHoldingTransactions = useMemo(() => {
    if (!viewingHolding) return [];

    const holdingIds = stocks
      .filter(
        (stock) =>
          stock.symbol.toUpperCase() === viewingHolding.symbol.toUpperCase() &&
          stock.exchange.toUpperCase() === viewingHolding.exchange.toUpperCase()
      )
      .map((stock) => stock.id);

    return stockTransactions
      .filter((transaction) => holdingIds.includes(transaction.stockId))
      .sort((left, right) => right.transactionDate.localeCompare(left.transactionDate))
      .slice(0, 6);
  }, [viewingHolding, stocks, stockTransactions]);

  const viewingHoldingChargePreview = useMemo(() => {
    if (!viewingHolding) return null;

    return aggregateStockCharges(
      'SELL',
      viewingHolding.quantity,
      viewingHolding.currentPrice,
      viewingHolding.exchange === 'BSE' ? 'BSE' : 'NSE',
      viewingHolding.id,
      new Date().toISOString().split('T')[0]
    );
  }, [aggregateStockCharges, viewingHolding]);

  const viewingHoldingSector = useMemo(() => {
    if (!viewingHolding) return 'Others';

    return resolveStockSector(
      viewingHolding.symbol,
      viewingHolding.companyName,
      viewingHolding.sector
    );
  }, [viewingHolding]);

  const sortedStockTransactions = useMemo(
    () =>
      [...stockTransactions].sort((left, right) => {
        const byDate = right.transactionDate.localeCompare(left.transactionDate);
        if (byDate !== 0) return byDate;
        return (right.createdAt || '').localeCompare(left.createdAt || '');
      }),
    [stockTransactions]
  );

  const stockHistoryCards = useMemo(
    () =>
      sortedStockTransactions.map((transaction) => {
        const stock = stocks.find((entry) => entry.id === transaction.stockId) || null;
        const totalCharges = calculateStockTradeChargesTotal(
          transaction.brokerage || 0,
          transaction.taxes || 0
        );
        const settlementAmount = calculateStockTradeSettlement(
          transaction.transactionType,
          transaction.totalAmount,
          transaction.brokerage || 0,
          transaction.taxes || 0
        );
        const account =
          accounts.find((entry) => entry.id === Number(transaction.accountId)) || null;

        return {
          transaction,
          stock,
          account,
          totalCharges,
          settlementAmount,
        };
      }),
    [accounts, sortedStockTransactions, stocks]
  );

  const stockHistorySummary = useMemo(
    () => ({
      totalCharges: stockHistoryCards.reduce((sum, entry) => sum + entry.totalCharges, 0),
      totalBuys: stockHistoryCards
        .filter((entry) => entry.transaction.transactionType === 'BUY')
        .reduce((sum, entry) => sum + entry.transaction.totalAmount, 0),
      totalSells: stockHistoryCards
        .filter((entry) => entry.transaction.transactionType === 'SELL')
        .reduce((sum, entry) => sum + entry.transaction.totalAmount, 0),
      totalDebits: stockHistoryCards
        .filter((entry) => entry.transaction.transactionType === 'BUY')
        .reduce((sum, entry) => sum + entry.settlementAmount, 0),
      totalCredits: stockHistoryCards
        .filter((entry) => entry.transaction.transactionType === 'SELL')
        .reduce((sum, entry) => sum + entry.settlementAmount, 0),
      distinctAccounts: new Set(
        stockHistoryCards
          .map((entry) => entry.account?.id)
          .filter((accountId): accountId is number => typeof accountId === 'number')
      ).size,
    }),
    [stockHistoryCards]
  );

  const openHoldingFromTransaction = (transaction: StockTransaction) => {
    const linkedStock =
      stocks.find((stock) => stock.id === transaction.stockId) ||
      groupedStocks.find((stock) => stock.id === transaction.stockId);

    if (linkedStock) {
      setViewingHolding(linkedStock);
      return;
    }

    setViewingHolding({
      id: transaction.stockId,
      symbol: 'STOCK',
      companyName: transaction.notes || 'Historical stock entry',
      quantity: transaction.quantity,
      avgPrice: transaction.price,
      currentPrice: transaction.price,
      exchange: 'NSE',
      investmentAmount: transaction.totalAmount,
      currentValue: transaction.totalAmount,
      pnl: 0,
      pnlPercentage: 0,
    });
  };

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
    setSector(resolveStockSector(item.symbol, item.companyName));
    setShowResults(false);
    setSearchQuery(item.symbol);

    // Fetch real-time quote
    try {
      const res = await fetch(`/api/stocks/quote?symbol=${item.symbol}`);
      const data = await res.json();
      if (!data.error) {
        setCurrentPrice(data.currentPrice.toString());
        setPreviousPrice(data.previousClose ?? data.currentPrice);
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

    const { investmentAmount, currentValue, pnl, pnlPercentage } = calculatePositionMetrics(
      qty,
      avg,
      current
    );

    const stockData = {
      symbol: symbol.trim().toUpperCase(),
      companyName,
      quantity: qty,
      avgPrice: avg,
      currentPrice: current,
      previousPrice: previousPrice ?? current,
      sector: resolveStockSector(symbol.trim().toUpperCase(), companyName, sector),
      exchange,
      investmentAmount,
      currentValue,
      pnl,
      pnlPercentage,
    };

    try {
      if (editId !== null) {
        await updateStock(editId, stockData);
        showNotification('success', `${symbol} updated successfully`);
      } else {
        if (!selectedAccountId || !selectedFundingAccount) {
          showNotification('error', 'Select the bank account that should fund this buy order.');
          return;
        }

        const calculatedCharges = calculateStockCharges('BUY', qty, avg, exchange);
        const buyValidation = validateStockTrade({
          transactionType: 'BUY',
          quantity: qty,
          settlementAmount: calculatedCharges.settlementAmount,
          accountBalance: selectedFundingAccount.balance,
        });

        if (!buyValidation.isValid) {
          showNotification(
            'error',
            buyValidation.shortfall
              ? `${buyValidation.message} Shortfall: ${formatInr(buyValidation.shortfall)}.`
              : buyValidation.message || 'Unable to place this buy order.'
          );
          return;
        }

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

        await addStockTransaction({
          stockId: targetStockId,
          transactionType: 'BUY',
          quantity: qty,
          price: avg,
          totalAmount: investment,
          brokerage: calculatedCharges.brokerage,
          taxes: calculatedCharges.taxes,
          transactionDate: new Date().toISOString().split('T')[0],
          accountId: Number(selectedAccountId),
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
    const calculatedCharges = aggregateStockCharges(
      transactionType,
      qty,
      price,
      selectedTransactionExchange,
      selectedTransactionStock?.id,
      transactionDate
    );
    const fundingAccount = selectedFundingAccount;

    if (!fundingAccount) {
      showNotification('error', 'We could not find the selected operating account.');
      return;
    }

    const tradeValidation = validateStockTrade({
      transactionType,
      quantity: qty,
      availableQuantity: transactionType === 'SELL' ? selectedTransactionAvailableQuantity : null,
      settlementAmount: transactionType === 'BUY' ? calculatedCharges.total.settlementAmount : null,
      accountBalance: fundingAccount.balance,
    });

    if (!tradeValidation.isValid) {
      showNotification(
        'error',
        tradeValidation.shortfall
          ? `${tradeValidation.message} Shortfall: ${formatInr(tradeValidation.shortfall)}.`
          : tradeValidation.message || 'Unable to place this stock order.'
      );
      return;
    }

    try {
      await addStockTransaction({
        stockId: Number(selectedStockId),
        transactionType,
        quantity: qty,
        price,
        totalAmount: total,
        brokerage: calculatedCharges.total.brokerage,
        taxes: calculatedCharges.total.taxes,
        transactionDate,
        notes:
          notes ||
          (transactionType === 'SELL'
            ? `Auto charge mode: ${calculatedCharges.mode}${
                calculatedCharges.mode === 'mixed'
                  ? ` | intraday ${calculatedCharges.intradayQuantity}, delivery ${calculatedCharges.deliveryQuantity}`
                  : ''
              }`
            : undefined),
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
    setSelectedAccountId(getDefaultStockFundingAccountId());
  };

  const handleEditStock = (stock: Stock) => {
    setModalType('stock');
    setEditId(stock.id);
    setSymbol(stock.symbol);
    setCompanyName(stock.companyName);
    setQuantity(stock.quantity.toString());
    setAvgPrice(stock.avgPrice.toString());
    setCurrentPrice(stock.currentPrice.toString());
    setPreviousPrice(stock.previousPrice ?? stock.currentPrice);
    setSector(resolveStockSector(stock.symbol, stock.companyName, stock.sector));
    setExchange(stock.exchange);
    setIsModalOpen(true);
  };

  const handleExitStock = (stock: Stock) => {
    setModalType('transaction');
    setSelectedStockId(stock.id);
    setTransactionType('SELL');
    setTransactionQuantity(stock.quantity.toString());
    setTransactionPrice(stock.currentPrice.toString());
    if (!selectedAccountId) {
      setSelectedAccountId(getDefaultStockFundingAccountId());
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
    setSelectedAccountId(getDefaultStockFundingAccountId());
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
      const resolvedSector = resolveStockSector(stock.symbol, stock.companyName, stock.sector);
      if (!groups[key]) {
        groups[key] = {
          ...stock,
          sector: resolvedSector,
          ...calculatePositionMetricsFromInvestment(
            stock.quantity,
            stock.investmentAmount,
            stock.currentPrice
          ),
        };
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

        existing.sector = existing.sector || resolvedSector;
        existing.quantity = totalQty;
        existing.avgPrice = totalQty > 0 ? totalInvestment / totalQty : 0;
        existing.currentPrice = stock.currentPrice; // Latest LTP
        existing.previousPrice = totalQty > 0 ? totalPrevValue / totalQty : existing.currentPrice;
        Object.assign(
          existing,
          calculatePositionMetricsFromInvestment(totalQty, totalInvestment, existing.currentPrice)
        );
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
      const lifetime = calculateLifetimePerformance(buys, sells, totalCurrentValue, charges);
      return {
        totalBuys: buys,
        totalSells: sells,
        totalCharges: charges,
        lifetimeEarned: lifetime.lifetimeEarned,
        lifetimeReturnPercentage: lifetime.lifetimeReturnPercentage,
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
        const sector = resolveStockSector(stock.symbol, stock.companyName, stock.sector);
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
          width: 'fit-content',
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
                  onClick={() => setViewingHolding(stock)}
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
                        cursor: 'pointer',
                      }}
                      onClick={() => setViewingHolding(stock)}
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
        <div style={{ display: 'grid', gap: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '900', margin: 0, color: '#f4f8f7' }}>
                Trade book
              </h3>
              <div style={{ fontSize: '0.82rem', color: '#9aaea9', marginTop: '6px' }}>
                Every debit and credit here already includes brokerage, taxes, exchange fees, and
                statutory charges.
              </div>
            </div>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '999px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(160, 188, 180, 0.12)',
                color: '#d9f3e9',
                fontSize: '0.78rem',
                fontWeight: '800',
              }}
            >
              {stockHistoryCards.length} entries
            </div>
          </div>

          {stockHistoryCards.length > 0 ? (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '14px',
                }}
              >
                {[
                  {
                    label: 'Gross buys',
                    value: formatInr(stockHistorySummary.totalBuys),
                    tone: '#f2a93b',
                    detail: `${formatInr(stockHistorySummary.totalDebits)} debited after charges`,
                  },
                  {
                    label: 'Gross sells',
                    value: formatInr(stockHistorySummary.totalSells),
                    tone: '#43c08a',
                    detail: `${formatInr(stockHistorySummary.totalCredits)} credited after charges`,
                  },
                  {
                    label: 'Charges paid',
                    value: formatInr(stockHistorySummary.totalCharges),
                    tone: '#ef5d5d',
                    detail: 'Brokerage, taxes, DP and exchange fees combined',
                  },
                  {
                    label: 'Net cash flow',
                    value: formatSignedInr(
                      stockHistorySummary.totalCredits - stockHistorySummary.totalDebits
                    ),
                    tone:
                      stockHistorySummary.totalCredits >= stockHistorySummary.totalDebits
                        ? '#43c08a'
                        : '#f2a93b',
                    detail: `${stockHistorySummary.distinctAccounts} funding account${
                      stockHistorySummary.distinctAccounts === 1 ? '' : 's'
                    } used`,
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    style={{
                      padding: '16px 18px',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(160, 188, 180, 0.12)',
                      display: 'grid',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: '900',
                        color: '#9aaea9',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      {card.label}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: '900', color: card.tone }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#7f928d', lineHeight: 1.5 }}>
                      {card.detail}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                {stockHistoryCards.map((entry) => {
                  const isBuy = entry.transaction.transactionType === 'BUY';
                  const accentColor = isBuy ? '#f2a93b' : '#43c08a';
                  const balanceCopy = isBuy ? 'Net debit' : 'Net credit';

                  return (
                    <article
                      key={entry.transaction.id}
                      style={{
                        padding: '18px',
                        borderRadius: '22px',
                        background: isBuy
                          ? 'linear-gradient(135deg, rgba(242, 169, 59, 0.08) 0%, rgba(255,255,255,0.03) 100%)'
                          : 'linear-gradient(135deg, rgba(67, 192, 138, 0.08) 0%, rgba(255,255,255,0.03) 100%)',
                        border: `1px solid ${isBuy ? 'rgba(242, 169, 59, 0.18)' : 'rgba(67, 192, 138, 0.18)'}`,
                        display: 'grid',
                        gap: '16px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '16px',
                          flexWrap: 'wrap',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '14px',
                              background: isBuy
                                ? 'rgba(242, 169, 59, 0.14)'
                                : 'rgba(67, 192, 138, 0.14)',
                              color: accentColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {isBuy ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div style={{ display: 'grid', gap: '6px' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '1rem',
                                  fontWeight: '900',
                                  color: '#f4f8f7',
                                }}
                              >
                                {entry.stock?.symbol || 'Unknown'}
                              </span>
                              <span
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: '999px',
                                  background: isBuy
                                    ? 'rgba(242, 169, 59, 0.12)'
                                    : 'rgba(67, 192, 138, 0.12)',
                                  color: accentColor,
                                  fontSize: '0.7rem',
                                  fontWeight: '900',
                                  letterSpacing: '0.08em',
                                }}
                              >
                                {entry.transaction.transactionType}
                              </span>
                              <span
                                style={{ fontSize: '0.74rem', color: '#9aaea9', fontWeight: '700' }}
                              >
                                {entry.stock?.exchange || 'NSE'}
                              </span>
                            </div>
                            <div style={{ color: '#9aaea9', fontSize: '0.82rem' }}>
                              {entry.stock?.companyName ||
                                entry.transaction.notes ||
                                'Historical stock entry'}
                            </div>
                            <div style={{ color: '#7f928d', fontSize: '0.76rem' }}>
                              {dateFormatter.format(new Date(entry.transaction.transactionDate))}
                              {' · '}
                              {entry.account?.name || 'Ledger-only entry'}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            onClick={() => openHoldingFromTransaction(entry.transaction)}
                            style={{
                              background: 'rgba(255,255,255,0.05)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: '#d9f3e9',
                              borderRadius: '12px',
                              width: '40px',
                              height: '40px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            aria-label="Open holding"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const isConfirmed = await customConfirm({
                                title: 'Delete Transaction',
                                message:
                                  'Are you sure you want to delete this historical transaction?',
                                type: 'warning',
                                confirmLabel: 'Delete',
                              });
                              if (isConfirmed) {
                                await deleteStockTransaction(entry.transaction.id);
                                showNotification('success', 'Transaction deleted');
                              }
                            }}
                            style={{
                              background: 'rgba(239, 93, 93, 0.08)',
                              border: '1px solid rgba(239, 93, 93, 0.18)',
                              color: '#ef5d5d',
                              borderRadius: '12px',
                              width: '40px',
                              height: '40px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            aria-label="Delete transaction"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                          gap: '12px',
                        }}
                      >
                        {[
                          {
                            label: 'Quantity x price',
                            value: `${entry.transaction.quantity} x ${formatInr(entry.transaction.price)}`,
                          },
                          {
                            label: 'Gross trade value',
                            value: formatInr(entry.transaction.totalAmount),
                          },
                          {
                            label: 'Charges',
                            value: formatInr(entry.totalCharges),
                          },
                          {
                            label: balanceCopy,
                            value: formatInr(entry.settlementAmount),
                            tone: accentColor,
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            style={{
                              padding: '12px 14px',
                              borderRadius: '16px',
                              background: 'rgba(7, 16, 24, 0.38)',
                              border: '1px solid rgba(160, 188, 180, 0.1)',
                              display: 'grid',
                              gap: '6px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.7rem',
                                fontWeight: '800',
                                color: '#7f928d',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                              }}
                            >
                              {item.label}
                            </div>
                            <div
                              style={{
                                fontSize: '0.9rem',
                                fontWeight: '900',
                                color: item.tone || '#f4f8f7',
                              }}
                            >
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>

                      {entry.transaction.notes && (
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(160, 188, 180, 0.08)',
                            color: '#9aaea9',
                            fontSize: '0.78rem',
                            lineHeight: 1.5,
                          }}
                        >
                          {entry.transaction.notes}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </>
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
                No stock trades recorded
              </div>
              <div style={{ fontSize: '0.9rem' }}>
                Your buy and sell activity will appear here as a clean trade book.
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'lifetime' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(20, 109, 99, 0.22) 0%, rgba(10, 18, 24, 0.96) 55%, rgba(242, 169, 59, 0.14) 100%)',
              borderRadius: '28px',
              border: '1px solid rgba(160, 188, 180, 0.14)',
              padding: 'clamp(22px, 4vw, 36px)',
              display: 'grid',
              gap: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '20px',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
              }}
            >
              <div style={{ display: 'grid', gap: '10px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.82rem',
                    fontWeight: '900',
                    color: '#f2a93b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  <Star color="#f2a93b" fill="#f2a93b" size={18} /> Lifetime performance
                </div>
                <div
                  style={{
                    fontSize: 'clamp(2rem, 5vw, 3.1rem)',
                    fontWeight: '950',
                    color: lifetimeEarned >= 0 ? '#d9f3e9' : '#ffd8d8',
                    lineHeight: 1.05,
                  }}
                >
                  {formatSignedInr(lifetimeEarned)}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#b6c6c1', maxWidth: '620px' }}>
                  Combined lifetime P&amp;L after charges. This includes realized sell value,
                  today&apos;s market value of open holdings, and every verified charge already
                  applied.
                </div>
              </div>

              <div
                style={{
                  minWidth: '220px',
                  padding: '16px 18px',
                  borderRadius: '20px',
                  background: 'rgba(7, 16, 24, 0.42)',
                  border: '1px solid rgba(160, 188, 180, 0.12)',
                  display: 'grid',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: '900',
                    color: '#9aaea9',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Current market value
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#f4f8f7' }}>
                  {formatInr(totalCurrentValue)}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#7f928d' }}>
                  {groupedStocks.length} live holding{groupedStocks.length === 1 ? '' : 's'} in the
                  portfolio
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '14px',
              }}
            >
              {[
                {
                  label: 'Gross buy turnover',
                  value: formatInr(totalBuys),
                  tone: '#f2a93b',
                  detail: `${formatInr(stockHistorySummary.totalDebits)} cash debited after charges`,
                },
                {
                  label: 'Gross sell turnover',
                  value: formatInr(totalSells),
                  tone: '#43c08a',
                  detail: `${formatInr(stockHistorySummary.totalCredits)} cash credited after charges`,
                },
                {
                  label: 'Net deployed cash',
                  value: formatInr(
                    Math.max(stockHistorySummary.totalDebits - stockHistorySummary.totalCredits, 0)
                  ),
                  tone: '#d9f3e9',
                  detail: 'Real cash still deployed into the stock book',
                },
                {
                  label: 'Return on capital',
                  value: `${lifetimeReturnPercentage.toFixed(2)}%`,
                  tone: lifetimeReturnPercentage >= 0 ? '#43c08a' : '#ef5d5d',
                  detail: 'Based on lifetime P&L after charges',
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    padding: '16px 18px',
                    borderRadius: '18px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(160, 188, 180, 0.12)',
                    display: 'grid',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '900',
                      color: '#9aaea9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {card.label}
                  </div>
                  <div style={{ fontSize: '1.12rem', fontWeight: '900', color: card.tone }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#7f928d', lineHeight: 1.5 }}>
                    {card.detail}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
            }}
          >
            {[
              {
                label: 'Current holdings value',
                value: formatInr(totalCurrentValue),
                tone: '#f4f8f7',
              },
              {
                label: 'Total charges paid',
                value: formatInr(totalCharges),
                tone: '#ef5d5d',
              },
              {
                label: 'Trade count',
                value: stockHistoryCards.length.toString(),
                tone: '#6cb6ff',
              },
              {
                label: 'Funding accounts used',
                value: stockHistorySummary.distinctAccounts.toString(),
                tone: '#8fd5b6',
              },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  padding: '16px 18px',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(160, 188, 180, 0.12)',
                  display: 'grid',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: '900',
                    color: '#9aaea9',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '900', color: item.tone }}>
                  {item.value}
                </div>
              </div>
            ))}
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
            className="modal-card entry-sheet entry-sheet--wide"
            style={{
              background: '#050505',
              border: '1px solid #1a1a1a',
              width: '100%',
              maxWidth: '820px',
            }}
          >
            <div className="entry-sheet__handle" />
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
              <form onSubmit={handleStockSubmit} className="entry-form">
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
                  <ChargeBreakdownCard
                    title={`Official Zerodha Buy Estimate (${exchange})`}
                    charges={initialBuyChargePreview}
                    settlementLabel="Estimated bank debit"
                    accentColor="#43c08a"
                    background="rgba(30, 166, 114, 0.08)"
                    borderColor="rgba(67, 192, 138, 0.22)"
                    settlementColor="#f2a93b"
                    note="Verified against Zerodha's current equity charge schedule. Delivery brokerage is zero, and the final debit includes all taxes and fees."
                  />
                )}

                {!editId && (
                  <div style={{ display: 'grid', gap: '12px' }}>
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
                      Funding Account (INR)
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
                      <option value="">
                        {stockFundingAccounts.length > 0
                          ? 'Select INR Account'
                          : 'Add an INR account first'}
                      </option>
                      {stockFundingAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} - ₹{acc.balance.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {initialBuyChargePreview && (
                      <div
                        style={{
                          padding: '14px 16px',
                          borderRadius: '16px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          display: 'grid',
                          gap: '8px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px',
                            fontSize: '0.84rem',
                          }}
                        >
                          <span style={{ color: '#94a3b8' }}>Available balance</span>
                          <span style={{ color: '#f4f8f7', fontWeight: '800' }}>
                            {selectedFundingAccount
                              ? formatInr(selectedFundingAccount.balance)
                              : 'Select account'}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px',
                            fontSize: '0.84rem',
                          }}
                        >
                          <span style={{ color: '#94a3b8' }}>Projected balance</span>
                          <span
                            style={{
                              color:
                                selectedFundingAccount &&
                                initialBuyTradeValidation?.isValid !== false
                                  ? '#d9f3e9'
                                  : '#f2a93b',
                              fontWeight: '800',
                            }}
                          >
                            {selectedFundingAccount
                              ? formatInr(
                                  selectedFundingAccount.balance -
                                    initialBuyChargePreview.settlementAmount
                                )
                              : '--'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#9aaea9', lineHeight: 1.5 }}>
                          {!selectedFundingAccount
                            ? 'Choose the bank account to debit this buy order from.'
                            : initialBuyTradeValidation?.isValid === false
                              ? `${
                                  initialBuyTradeValidation.message
                                } Shortfall: ${formatInr(initialBuyTradeValidation.shortfall || 0)}.`
                              : 'The final debit will happen after adding brokerage, taxes, exchange fees, and stamp duty.'}
                        </div>
                      </div>
                    )}
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
              <form onSubmit={handleTransactionSubmit} className="entry-form">
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
                          ? transactionChargePreview.total.brokerage.toFixed(2)
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
                        transactionChargePreview
                          ? transactionChargePreview.total.taxes.toFixed(2)
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
                </div>

                {transactionChargePreview && (
                  <ChargeBreakdownCard
                    title={`Official Zerodha ${
                      transactionType === 'BUY' ? 'Buy' : 'Sell'
                    } Estimate (${selectedTransactionExchange})`}
                    charges={transactionChargePreview.total}
                    settlementLabel={
                      transactionType === 'BUY' ? 'Estimated debit' : 'Estimated credit'
                    }
                    accentColor={transactionType === 'BUY' ? '#43c08a' : '#f2a93b'}
                    background={
                      transactionType === 'BUY'
                        ? 'rgba(30, 166, 114, 0.08)'
                        : 'rgba(242, 169, 59, 0.08)'
                    }
                    borderColor={
                      transactionType === 'BUY'
                        ? 'rgba(67, 192, 138, 0.22)'
                        : 'rgba(242, 169, 59, 0.22)'
                    }
                    settlementColor={transactionType === 'BUY' ? '#f2a93b' : '#43c08a'}
                    prefixRows={
                      transactionType === 'SELL'
                        ? [
                            {
                              label: 'Charge mode',
                              value: getChargeModeLabel(transactionChargePreview.mode),
                            },
                            {
                              label: 'Available quantity',
                              value: selectedTransactionAvailableQuantity,
                            },
                            ...(transactionChargePreview.intradayQuantity > 0
                              ? [
                                  {
                                    label: 'Same-day sell qty',
                                    value: transactionChargePreview.intradayQuantity,
                                  },
                                ]
                              : []),
                            ...(transactionChargePreview.deliveryQuantity > 0
                              ? [
                                  {
                                    label: 'Delivery sell qty',
                                    value: transactionChargePreview.deliveryQuantity,
                                  },
                                ]
                              : []),
                          ]
                        : [
                            {
                              label: 'Order type',
                              value: 'Delivery buy',
                            },
                          ]
                    }
                    note={
                      transactionType === 'BUY'
                        ? 'The final debit will be trade value plus all charges. If the selected account balance is short, the order will be blocked.'
                        : 'Sell credit is net of charges. Same-day matched quantity is treated as intraday and delivery quantity keeps DP charges.'
                    }
                  />
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
                    Funding Account (INR)
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
                    <option value="">
                      {stockFundingAccounts.length > 0
                        ? 'Select INR Account'
                        : 'Add an INR account first'}
                    </option>
                    {stockFundingAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} - ₹{acc.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  {transactionChargePreview && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '14px 16px',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        display: 'grid',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          fontSize: '0.84rem',
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>Available balance</span>
                        <span style={{ color: '#f4f8f7', fontWeight: '800' }}>
                          {selectedFundingAccount
                            ? formatInr(selectedFundingAccount.balance)
                            : 'Select account'}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          fontSize: '0.84rem',
                        }}
                      >
                        <span style={{ color: '#94a3b8' }}>
                          {transactionType === 'BUY' ? 'Projected balance' : 'Projected credit'}
                        </span>
                        <span
                          style={{
                            color:
                              selectedFundingAccount &&
                              transactionTradeValidation?.isValid !== false
                                ? transactionType === 'BUY'
                                  ? '#d9f3e9'
                                  : '#43c08a'
                                : '#f2a93b',
                            fontWeight: '800',
                          }}
                        >
                          {selectedFundingAccount
                            ? formatInr(
                                transactionType === 'BUY'
                                  ? selectedFundingAccount.balance -
                                      transactionChargePreview.total.settlementAmount
                                  : selectedFundingAccount.balance +
                                      transactionChargePreview.total.settlementAmount
                              )
                            : '--'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#9aaea9', lineHeight: 1.5 }}>
                        {!selectedFundingAccount
                          ? 'Choose the bank account that should handle this trade settlement.'
                          : transactionTradeValidation?.isValid === false
                            ? `${transactionTradeValidation.message}${
                                transactionTradeValidation.shortfall
                                  ? ` Shortfall: ${formatInr(transactionTradeValidation.shortfall)}.`
                                  : ''
                              }`
                            : transactionType === 'BUY'
                              ? 'This account will be debited after adding all verified brokerage and statutory charges.'
                              : `This account will be credited ${formatInr(
                                  transactionChargePreview.total.settlementAmount
                                )} after charges.`}
                      </div>
                    </div>
                  )}
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
      {viewingHolding && (
        <div
          className="modal-overlay holding-detail-overlay"
          style={{ zIndex: 1100 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingHolding(null);
          }}
        >
          <div
            className="modal-card entry-sheet entry-sheet--wide holding-detail-card"
            style={{
              background: '#050505',
              border: '1px solid #1a1a1a',
              width: '100%',
              maxWidth: '860px',
            }}
          >
            <div className="entry-sheet__handle" />
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
                  Holding Details
                </h2>
              </div>
              <button
                onClick={() => setViewingHolding(null)}
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

            <div style={{ display: 'grid', gap: '20px' }}>
              {(() => {
                const deliveryMeta = getStockChargeMeta(viewingHolding.exchange, 'delivery');
                return (
                  <>
                    <div
                      style={{
                        display: 'grid',
                        gap: '16px',
                        gridTemplateColumns: viewingHoldingChargePreview
                          ? 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))'
                          : '1fr',
                        alignItems: 'start',
                      }}
                    >
                      <div style={{ display: 'grid', gap: '16px' }}>
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              flexWrap: 'wrap',
                              marginBottom: '12px',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '0.78rem',
                                color: '#64748b',
                                fontWeight: '700',
                                padding: '6px 10px',
                                borderRadius: '999px',
                                background: 'rgba(255,255,255,0.04)',
                              }}
                            >
                              {viewingHolding.exchange} holding
                            </div>
                            <div
                              style={{
                                fontSize: '0.78rem',
                                color: '#34d399',
                                fontWeight: '700',
                                padding: '6px 10px',
                                borderRadius: '999px',
                                background: 'rgba(16, 185, 129, 0.12)',
                              }}
                            >
                              {viewingHoldingSector}
                            </div>
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>
                            {viewingHolding.symbol}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                            {viewingHolding.companyName}
                          </div>
                        </div>

                        <div className="detail-grid">
                          <div className="detail-stat">
                            <div className="detail-stat__label">Quantity</div>
                            <div className="detail-stat__value">{viewingHolding.quantity}</div>
                          </div>
                          <div className="detail-stat">
                            <div className="detail-stat__label">Average Cost</div>
                            <div className="detail-stat__value">
                              {formatInr(viewingHolding.avgPrice)}
                            </div>
                          </div>
                          <div className="detail-stat">
                            <div className="detail-stat__label">Current Value</div>
                            <div className="detail-stat__value">
                              {formatInr(viewingHolding.currentValue)}
                            </div>
                          </div>
                          <div className="detail-stat">
                            <div className="detail-stat__label">Current Price</div>
                            <div className="detail-stat__value">
                              {formatInr(viewingHolding.currentPrice)}
                            </div>
                          </div>
                          <div className="detail-stat">
                            <div className="detail-stat__label">Live P&L</div>
                            <div
                              className={`detail-stat__value ${
                                viewingHolding.pnl >= 0
                                  ? 'entry-summary__value--positive'
                                  : 'entry-summary__value--negative'
                              }`}
                            >
                              {formatSignedInr(viewingHolding.pnl)}
                            </div>
                          </div>
                          <div className="detail-stat">
                            <div className="detail-stat__label">Sector</div>
                            <div className="detail-stat__value">{viewingHoldingSector}</div>
                          </div>
                        </div>
                      </div>

                      {viewingHoldingChargePreview && (
                        <div
                          className="entry-summary"
                          style={{
                            background: 'rgba(99, 102, 241, 0.08)',
                            border: '1px solid rgba(99, 102, 241, 0.16)',
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
                            Zerodha Exit Estimate
                          </div>
                          <div className="entry-summary__row">
                            <span className="entry-summary__label">Mode</span>
                            <span className="entry-summary__value">
                              {getChargeModeLabel(viewingHoldingChargePreview.mode)}
                            </span>
                          </div>
                          {viewingHoldingChargePreview.intradayQuantity > 0 && (
                            <div className="entry-summary__row">
                              <span className="entry-summary__label">Intraday quantity</span>
                              <span className="entry-summary__value">
                                {viewingHoldingChargePreview.intradayQuantity}
                              </span>
                            </div>
                          )}
                          {viewingHoldingChargePreview.deliveryQuantity > 0 && (
                            <div className="entry-summary__row">
                              <span className="entry-summary__label">Delivery quantity</span>
                              <span className="entry-summary__value">
                                {viewingHoldingChargePreview.deliveryQuantity}
                              </span>
                            </div>
                          )}
                          <div className="entry-summary__row">
                            <span className="entry-summary__label">Brokerage</span>
                            <span className="entry-summary__value">
                              {formatInr(viewingHoldingChargePreview.total.brokerage)}
                            </span>
                          </div>
                          <div className="entry-summary__row">
                            <span className="entry-summary__label">Taxes and charges</span>
                            <span className="entry-summary__value">
                              {formatInr(viewingHoldingChargePreview.total.taxes)}
                            </span>
                          </div>
                          <div className="entry-summary__row">
                            <span className="entry-summary__label">DP charges</span>
                            <span className="entry-summary__value">
                              {formatInr(viewingHoldingChargePreview.total.dpCharges)}
                            </span>
                          </div>
                          <div className="entry-summary__row">
                            <span className="entry-summary__label">Expected credit after sell</span>
                            <span className="entry-summary__value entry-summary__value--positive">
                              {formatInr(viewingHoldingChargePreview.total.settlementAmount)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.5 }}>
                            Brokerage follows {deliveryMeta.exchange} market rules, with same-day
                            sell quantity treated as intraday and DP shown only for demat-delivery
                            debit.
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{ fontWeight: '800', color: '#fff' }}>Recent Transactions</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {viewingHoldingTransactions.length} latest
                        </div>
                      </div>
                      {viewingHoldingTransactions.length > 0 ? (
                        <div className="detail-timeline">
                          {viewingHoldingTransactions.map((transaction) => (
                            <div key={transaction.id} className="detail-timeline__item">
                              <div>
                                <strong>{transaction.transactionType}</strong>
                                <span>
                                  {transaction.quantity} @ {formatInr(transaction.price)}
                                </span>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <strong>
                                  {transaction.transactionType === 'BUY' ? '-' : '+'}
                                  {formatInr(transaction.totalAmount)}
                                </strong>
                                <span>
                                  {dateFormatter.format(new Date(transaction.transactionDate))}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '16px',
                            borderRadius: '16px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            color: '#64748b',
                            fontSize: '0.85rem',
                          }}
                        >
                          No transaction history found for this holding yet.
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
