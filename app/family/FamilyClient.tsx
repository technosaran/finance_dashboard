'use client';

import { useState, useMemo } from 'react';
import { useNotifications } from '../components/NotificationContext';
import { useFinance } from '../components/FinanceContext';
import { FamilyTransfer } from '@/lib/types';
import {
  Users,
  X,
  Heart,
  TrendingDown,
  Clock,
  Edit3,
  Trash2,
  DollarSign,
  Send,
  Plus,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { EmptyFamilyVisual } from '../components/Visuals';

// Relationship emoji map
const relEmoji: Record<string, string> = {
  Parent: '👨‍👩‍👧',
  Father: '👨',
  Mother: '👩',
  Sibling: '👫',
  Grandparent: '👴',
  Spouse: '💑',
  Child: '👶',
  Friend: '🤝',
  Relative: '👪',
  Other: '🧑',
};

// Color palette for family member avatars
const memberColors = [
  { bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)', text: '#ec4899' },
  { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.25)', text: '#8b5cf6' },
  { bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.25)', text: '#06b6d4' },
  { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)', text: '#f59e0b' },
  { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)', text: '#10b981' },
  { bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.25)', text: '#6366f1' },
];

export default function FamilyClient() {
  const {
    accounts,
    familyTransfers,
    addFamilyTransfer,
    updateFamilyTransfer,
    deleteFamilyTransfer,
    loading,
  } = useFinance();
  const { showNotification, confirm: customConfirm } = useNotifications();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'members' | 'history'>('members');

  // Form State
  const [recipient, setRecipient] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');

  // Quick send pre-fill from member card
  const [quickSendMode, setQuickSendMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || parseFloat(amount) <= 0) return;

    const transferData = {
      recipient,
      relationship,
      amount: parseFloat(amount),
      date,
      purpose,
      notes,
      accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
    };

    if (editId) {
      await updateFamilyTransfer(editId, transferData);
      showNotification('success', 'Transfer record updated');
    } else {
      await addFamilyTransfer(transferData);
      showNotification('success', 'Family transfer recorded ❤️');
    }

    resetForm();
    setIsModalOpen(false);
  };

  const resetForm = () => {
    setEditId(null);
    setRecipient('');
    setRelationship('Parent');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPurpose('');
    setNotes('');
    setSelectedAccountId('');
    setQuickSendMode(false);
  };

  const handleEdit = (transfer: FamilyTransfer) => {
    setEditId(transfer.id);
    setRecipient(transfer.recipient);
    setRelationship(transfer.relationship);
    setAmount(transfer.amount.toString());
    setDate(transfer.date);
    setPurpose(transfer.purpose || '');
    setNotes(transfer.notes || '');
    setSelectedAccountId(transfer.accountId || '');
    setQuickSendMode(false);
    setIsModalOpen(true);
  };

  const handleQuickSend = (memberName: string, memberRelationship: string) => {
    resetForm();
    setRecipient(memberName);
    setRelationship(memberRelationship);
    setDate(new Date().toISOString().split('T')[0]);
    setQuickSendMode(true);
    setIsModalOpen(true);
  };

  // Compute family member profiles from transfer history
  const familyMembers = useMemo(() => {
    const membersMap = familyTransfers.reduce(
      (acc, t) => {
        if (!acc[t.recipient]) {
          acc[t.recipient] = {
            name: t.recipient,
            relationship: t.relationship,
            total: 0,
            count: 0,
            lastDate: t.date,
            lastAmount: t.amount,
          };
        }
        acc[t.recipient].total += t.amount;
        acc[t.recipient].count += 1;
        if (new Date(t.date) > new Date(acc[t.recipient].lastDate)) {
          acc[t.recipient].lastDate = t.date;
          acc[t.recipient].lastAmount = t.amount;
        }
        return acc;
      },
      {} as Record<
        string,
        {
          name: string;
          relationship: string;
          total: number;
          count: number;
          lastDate: string;
          lastAmount: number;
        }
      >
    );
    return Object.values(membersMap).sort((a, b) => b.total - a.total);
  }, [familyTransfers]);

  // Calculate statistics
  const totalSent = familyTransfers.reduce((sum, t) => sum + t.amount, 0);
  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return familyTransfers
      .filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [familyTransfers]);

  if (loading) {
    return (
      <div
        className="main-content"
        style={{
          backgroundColor: '#000000',
          minHeight: '100vh',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: '#94a3b8' }}>
            Loading family transfers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="main-content"
      style={{
        backgroundColor: '#000000',
        minHeight: '100vh',
        color: '#f8fafc',
        padding: 'clamp(12px, 4vw, 24px)',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header Section */}
        <div className="page-header" style={{ marginBottom: 'clamp(24px, 5vw, 48px)' }}>
          <div>
            <h1
              className="page-title"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Family Support
            </h1>
            <p className="page-subtitle">Track financial support to your loved ones</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="header-add-btn"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
              boxShadow: '0 10px 30px rgba(236, 72, 153, 0.3)',
            }}
          >
            <Heart size={18} fill="currentColor" /> Log Transfer
          </button>
        </div>

        {/* Stats Row */}
        <div
          className="section-fade-in"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: 'clamp(12px, 3vw, 24px)',
            marginBottom: 'clamp(24px, 5vw, 40px)',
          }}
        >
          {[
            {
              label: 'Total Support',
              value: `₹${totalSent.toLocaleString()}`,
              icon: <TrendingDown size={20} />,
              color: '#ec4899',
              sub: 'Lifetime',
            },
            {
              label: 'This Month',
              value: `₹${thisMonthTotal.toLocaleString()}`,
              icon: <DollarSign size={20} />,
              color: '#8b5cf6',
              sub: new Date().toLocaleString('en-IN', { month: 'long' }),
            },
            {
              label: 'Family Members',
              value: familyMembers.length,
              icon: <Users size={20} />,
              color: '#06b6d4',
              sub: `${familyTransfers.length} transfers`,
            },
          ].map((stat, i) => (
            <div key={i} className="stat-card stat-card--pink" style={{ minHeight: 'auto' }}>
              <div className="stat-card__glow" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: `linear-gradient(135deg, ${stat.color}30, ${stat.color}10)`,
                      border: `1px solid ${stat.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                    fontWeight: '900',
                    color: stat.color,
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>
                  {stat.sub}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        <div
          className="mobile-tab-scroll"
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: 'clamp(20px, 4vw, 32px)',
          }}
        >
          {[
            { key: 'members' as const, label: 'Family Members', icon: <Users size={16} /> },
            { key: 'history' as const, label: 'Transfer History', icon: <Clock size={16} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={activeTab === tab.key ? 'period-btn period-btn--active' : 'period-btn'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                ...(activeTab === tab.key
                  ? {
                      borderColor: '#ec4899',
                      color: '#ec4899',
                      background: 'rgba(236, 72, 153, 0.1)',
                    }
                  : {}),
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── FAMILY MEMBERS TAB ── */}
        {activeTab === 'members' && (
          <div className="section-fade-in">
            {familyMembers.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                  gap: 'clamp(12px, 3vw, 20px)',
                }}
              >
                {familyMembers.map((member, idx) => {
                  const colorScheme = memberColors[idx % memberColors.length];
                  const emoji = relEmoji[member.relationship] || '🧑';
                  const avgPerTransfer = member.count > 0 ? member.total / member.count : 0;

                  return (
                    <div
                      key={member.name}
                      style={{
                        background: '#050505',
                        borderRadius: 'clamp(20px, 4vw, 28px)',
                        border: `1px solid ${colorScheme.border}`,
                        padding: 'clamp(16px, 4vw, 24px)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = colorScheme.text;
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.borderColor = colorScheme.border;
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Background glow */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '-30px',
                          right: '-30px',
                          width: '120px',
                          height: '120px',
                          background: `${colorScheme.text}08`,
                          borderRadius: '50%',
                          filter: 'blur(30px)',
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Top row: Avatar + name + quick send */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'clamp(12px, 3vw, 16px)',
                          marginBottom: '16px',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 'clamp(48px, 10vw, 56px)',
                            height: 'clamp(48px, 10vw, 56px)',
                            borderRadius: '18px',
                            background: colorScheme.bg,
                            border: `1px solid ${colorScheme.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'clamp(1.3rem, 3vw, 1.6rem)',
                            flexShrink: 0,
                          }}
                        >
                          {emoji}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: '800',
                              fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
                              color: '#fff',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {member.name}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              fontWeight: '700',
                              marginTop: '2px',
                            }}
                          >
                            {member.relationship} • {member.count} transfer
                            {member.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                        {/* Quick Send Button */}
                        <button
                          onClick={() => handleQuickSend(member.name, member.relationship)}
                          aria-label={`Quick send to ${member.name}`}
                          style={{
                            width: 'clamp(40px, 8vw, 44px)',
                            height: 'clamp(40px, 8vw, 44px)',
                            borderRadius: '14px',
                            background: `linear-gradient(135deg, ${colorScheme.text}20, ${colorScheme.text}10)`,
                            border: `1px solid ${colorScheme.border}`,
                            color: colorScheme.text,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            flexShrink: 0,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              `${colorScheme.text}30`;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background =
                              `${colorScheme.text}15`;
                          }}
                        >
                          <Send size={18} />
                        </button>
                      </div>

                      {/* Stats row */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '14px',
                            padding: 'clamp(10px, 2vw, 14px)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: '800',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '4px',
                            }}
                          >
                            Total Sent
                          </div>
                          <div
                            style={{
                              fontWeight: '900',
                              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                              color: colorScheme.text,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ₹{member.total.toLocaleString()}
                          </div>
                        </div>
                        <div
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '14px',
                            padding: 'clamp(10px, 2vw, 14px)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: '800',
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '4px',
                            }}
                          >
                            Avg / Transfer
                          </div>
                          <div
                            style={{
                              fontWeight: '900',
                              fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
                              color: '#94a3b8',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ₹
                            {avgPerTransfer.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>

                      {/* Last transfer info */}
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.75rem',
                          color: '#475569',
                          fontWeight: '600',
                          position: 'relative',
                          zIndex: 1,
                        }}
                      >
                        <span>
                          Last:{' '}
                          {new Date(member.lastDate).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span style={{ color: '#f472b6' }}>
                          ₹{member.lastAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Add New Member Card */}
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: 'clamp(20px, 4vw, 28px)',
                    border: '2px dashed #111111',
                    padding: 'clamp(24px, 5vw, 40px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: '#475569',
                    minHeight: '200px',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#ec4899';
                    (e.currentTarget as HTMLButtonElement).style.color = '#ec4899';
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(236, 72, 153, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#111111';
                    (e.currentTarget as HTMLButtonElement).style.color = '#475569';
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(255,255,255,0.02)';
                  }}
                >
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '16px',
                      background: 'rgba(236, 72, 153, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <UserPlus size={24} />
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Add Family Member</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                    Record a transfer to add them
                  </div>
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: 'clamp(40px, 8vw, 80px) 20px',
                  textAlign: 'center',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'clamp(24px, 5vw, 32px)',
                  border: '2px dashed #111111',
                }}
              >
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                  <EmptyFamilyVisual />
                </div>
                <h3
                  style={{
                    color: '#f8fafc',
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
                    fontWeight: '800',
                    marginBottom: '8px',
                  }}
                >
                  No Family Members Yet
                </h3>
                <p
                  style={{
                    color: '#94a3b8',
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    marginBottom: '24px',
                    maxWidth: '400px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  Record your first family transfer and members will appear here as quick-send
                  contacts!
                </p>
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(true);
                  }}
                  style={{
                    padding: 'clamp(12px, 2.5vw, 16px) clamp(24px, 5vw, 32px)',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.95rem',
                    boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)',
                    minHeight: '44px',
                  }}
                >
                  <Plus size={18} /> Record First Transfer
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TRANSFER HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="section-fade-in">
            <div
              style={{
                background: '#050505',
                borderRadius: 'clamp(20px, 4vw, 28px)',
                border: '1px solid #111111',
                padding: 'clamp(16px, 4vw, 28px)',
              }}
            >
              {familyTransfers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {familyTransfers.map((transfer) => {
                    const memberIdx = familyMembers.findIndex((m) => m.name === transfer.recipient);
                    const colorScheme =
                      memberColors[(memberIdx >= 0 ? memberIdx : 0) % memberColors.length];
                    const emoji = relEmoji[transfer.relationship] || '🧑';

                    return (
                      <div
                        key={transfer.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'clamp(10px, 2.5vw, 16px)',
                          padding: 'clamp(12px, 3vw, 16px)',
                          borderRadius: '16px',
                          background: 'rgba(255,255,255,0.02)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background =
                            'rgba(255,255,255,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background =
                            'rgba(255,255,255,0.02)';
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: 'clamp(38px, 8vw, 44px)',
                            height: 'clamp(38px, 8vw, 44px)',
                            borderRadius: '14px',
                            background: colorScheme.bg,
                            border: `1px solid ${colorScheme.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem',
                            flexShrink: 0,
                          }}
                        >
                          {emoji}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: '800',
                              fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                              color: '#e2e8f0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {transfer.recipient}
                          </div>
                          <div
                            style={{
                              fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
                              color: '#475569',
                              fontWeight: '600',
                              marginTop: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <span>{transfer.relationship}</span>
                            <span style={{ opacity: 0.5 }}>•</span>
                            <span>
                              {new Date(transfer.date).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            {transfer.purpose && (
                              <>
                                <span style={{ opacity: 0.5 }}>•</span>
                                <span
                                  style={{
                                    color: '#64748b',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '120px',
                                  }}
                                >
                                  {transfer.purpose}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount + Actions */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'clamp(8px, 2vw, 12px)',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: '900',
                              fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
                              color: '#f472b6',
                              textAlign: 'right',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ₹{transfer.amount.toLocaleString()}
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleEdit(transfer)}
                              aria-label={`Edit transfer to ${transfer.recipient}`}
                              className="action-btn action-btn--edit"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              onClick={async () => {
                                const isConfirmed = await customConfirm({
                                  title: 'Delete Transfer',
                                  message: `Delete record for ${transfer.recipient}?`,
                                  type: 'error',
                                  confirmLabel: 'Delete',
                                });
                                if (isConfirmed) {
                                  await deleteFamilyTransfer(transfer.id);
                                  showNotification('success', 'Transfer deleted');
                                }
                              }}
                              aria-label={`Delete transfer to ${transfer.recipient}`}
                              className="action-btn action-btn--delete"
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    padding: 'clamp(40px, 8vw, 60px) 20px',
                    textAlign: 'center',
                    color: '#64748b',
                  }}
                >
                  <Clock size={40} style={{ opacity: 0.2, marginBottom: '16px' }} />
                  <p style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                    No transfers recorded yet
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="modal-close"
            >
              <X size={20} />
            </button>

            <h2 className="modal-title">
              {editId ? 'Edit Transfer' : quickSendMode ? `Send to ${recipient}` : 'New Transfer'}
            </h2>
            <p className="modal-subtitle">
              {editId
                ? 'Update the transfer details'
                : quickSendMode
                  ? `Quick transfer to ${recipient} (${relationship})`
                  : 'Record a family support transfer'}
            </p>

            {/* Quick send — show member avatar */}
            {quickSendMode && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  background: 'rgba(236, 72, 153, 0.06)',
                  borderRadius: '16px',
                  border: '1px solid rgba(236, 72, 153, 0.15)',
                  marginBottom: '24px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: 'rgba(236, 72, 153, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.3rem',
                    flexShrink: 0,
                  }}
                >
                  {relEmoji[relationship] || '🧑'}
                </div>
                <div>
                  <div style={{ fontWeight: '800', color: '#fff', fontSize: '1rem' }}>
                    {recipient}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: '700' }}>
                    {relationship}
                  </div>
                </div>
                <ChevronRight size={16} style={{ marginLeft: 'auto', color: '#475569' }} />
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* Show recipient/relationship fields only if NOT quick send */}
              {!quickSendMode && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                    gap: '16px',
                  }}
                >
                  <div>
                    <label className="form-label">Recipient Name</label>
                    <input
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="e.g. Mother"
                      required
                      className="form-input"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="form-label">Relationship</label>
                    <select
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      className="form-input"
                    >
                      <option value="Parent">Parent</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend</option>
                      <option value="Relative">Relative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                  gap: '16px',
                }}
              >
                <div>
                  <label className="form-label">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="1"
                    required
                    className="form-input"
                    autoFocus={quickSendMode}
                  />
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Purpose</label>
                <input
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Monthly support, Medical"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Debit from Account (Optional)</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) =>
                    setSelectedAccountId(e.target.value ? Number(e.target.value) : '')
                  }
                  className="form-input"
                >
                  <option value="">No Account (Ledger Only)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} - ₹{acc.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details..."
                  className="form-input"
                  style={{ minHeight: '70px', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 100%)',
                  boxShadow: '0 10px 25px rgba(236, 72, 153, 0.3)',
                }}
              >
                {editId
                  ? 'Update Transfer'
                  : quickSendMode
                    ? `Send to ${recipient}`
                    : 'Record Transfer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
