'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Users, X, Edit3, Trash2, Send, Plus } from 'lucide-react';
import { useNotifications } from '../components/NotificationContext';
import { useLedger, useSettings } from '../components/FinanceContext';
import { FamilyTransfer } from '@/lib/types';
import { MoneyValue } from '@/app/components/ui/MoneyValue';
import { PageSkeleton, PageState } from '@/app/components/ui/PageState';
import { formatDate, formatDateTime } from '@/lib/utils/format';

const RELATIONSHIPS = ['Parent', 'Spouse', 'Child', 'Sibling', 'Relative', 'Friend', 'Other'];

const relationshipAccent: Record<string, string> = {
  Parent: '#ec4899',
  Spouse: '#8b5cf6',
  Child: '#06b6d4',
  Sibling: '#f59e0b',
  Relative: '#10b981',
  Friend: '#6366f1',
  Other: '#94a3b8',
};

export default function FamilyClient() {
  const {
    accounts,
    familyTransfers,
    addFamilyTransfer,
    updateFamilyTransfer,
    deleteFamilyTransfer,
    loading,
    error,
    lastUpdatedAt,
  } = useLedger();
  const { settings } = useSettings();
  const { showNotification, showActionNotification } = useNotifications();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'history'>('members');

  const [recipient, setRecipient] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');

  const compactNumbers = settings.compactNumbers ?? false;

  const visibleTransfers = useMemo(
    () =>
      familyTransfers
        .filter((transfer) => !pendingDeleteIds.includes(transfer.id))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [familyTransfers, pendingDeleteIds]
  );

  const familyMembers = useMemo(() => {
    const membersMap = visibleTransfers.reduce(
      (acc, transfer) => {
        if (!acc[transfer.recipient]) {
          acc[transfer.recipient] = {
            name: transfer.recipient,
            relationship: transfer.relationship,
            total: 0,
            count: 0,
            latestDate: transfer.date,
            latestAmount: transfer.amount,
          };
        }

        acc[transfer.recipient].total += transfer.amount;
        acc[transfer.recipient].count += 1;
        if (new Date(transfer.date) > new Date(acc[transfer.recipient].latestDate)) {
          acc[transfer.recipient].latestDate = transfer.date;
          acc[transfer.recipient].latestAmount = transfer.amount;
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
          latestDate: string;
          latestAmount: number;
        }
      >
    );

    return Object.values(membersMap).sort((a, b) => b.total - a.total);
  }, [visibleTransfers]);

  const stats = useMemo(() => {
    const totalSent = visibleTransfers.reduce((sum, transfer) => sum + transfer.amount, 0);
    const thisMonth = visibleTransfers
      .filter((transfer) => {
        const transferDate = new Date(transfer.date);
        const now = new Date();
        return (
          transferDate.getMonth() === now.getMonth() &&
          transferDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, transfer) => sum + transfer.amount, 0);

    return {
      totalSent,
      thisMonth,
      recipients: familyMembers.length,
      averageTransfer: visibleTransfers.length ? totalSent / visibleTransfers.length : 0,
    };
  }, [familyMembers.length, visibleTransfers]);

  const resetForm = () => {
    setEditId(null);
    setRecipient('');
    setRelationship('Parent');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPurpose('');
    setNotes('');
    setSelectedAccountId('');
  };

  const openNewTransferModal = () => {
    resetForm();
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  const handleQuickSend = (memberName: string, memberRelationship: string) => {
    resetForm();
    setRecipient(memberName);
    setRelationship(memberRelationship);
    setIsModalOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!recipient.trim() || !amount || Number(amount) <= 0) {
      showNotification('error', 'Recipient and a positive amount are required.');
      return;
    }

    const transferData = {
      recipient: recipient.trim(),
      relationship,
      amount: Number(amount),
      date,
      purpose: purpose.trim(),
      notes: notes.trim(),
      accountId: selectedAccountId ? Number(selectedAccountId) : undefined,
    };

    try {
      if (editId) {
        await updateFamilyTransfer(editId, transferData);
        showNotification('success', 'Family transfer updated');
      } else {
        await addFamilyTransfer(transferData);
        showNotification('success', 'Family transfer saved');
      }

      resetForm();
      setIsModalOpen(false);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the family transfer right now.';
      showNotification('error', message);
    }
  };

  const requestDelete = (transfer: FamilyTransfer) => {
    setPendingDeleteIds((current) => [...current, transfer.id]);
    showActionNotification({
      type: 'warning',
      message: `${transfer.recipient}'s transfer removed from view. Undo within 8 seconds to restore it.`,
      actionLabel: 'Undo',
      duration: 8000,
      onAction: () => {
        setPendingDeleteIds((current) => current.filter((id) => id !== transfer.id));
        showNotification('info', 'Transfer restored');
      },
      onDismiss: async () => {
        await deleteFamilyTransfer(transfer.id);
        setPendingDeleteIds((current) => current.filter((id) => id !== transfer.id));
        showNotification('success', 'Transfer deleted');
      },
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageSkeleton cardCount={4} rowCount={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <PageState
          variant="error"
          title="Family transfers are unavailable right now"
          description={error}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-start',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>
            Family
          </h1>
          <p className="page-subtitle" style={{ marginTop: '8px' }}>
            Track family support with clearer member summaries and transfer history.
          </p>
          {lastUpdatedAt ? (
            <p style={{ margin: '10px 0 0', color: 'var(--muted)', fontSize: '0.82rem' }}>
              As of {formatDateTime(lastUpdatedAt)}
            </p>
          ) : null}
        </div>
        <button type="button" className="add-transaction-btn" onClick={openNewTransferModal}>
          <Plus size={18} />
          Add Transfer
        </button>
      </div>

      <div className="grid-responsive-4" style={{ gap: '16px', marginBottom: '24px' }}>
        <FamilyStatCard
          label="Total sent"
          value={<MoneyValue amount={stats.totalSent} compact={compactNumbers} />}
          accent="#ec4899"
        />
        <FamilyStatCard
          label="This month"
          value={<MoneyValue amount={stats.thisMonth} compact={compactNumbers} />}
          accent="#6aa6ff"
        />
        <FamilyStatCard label="Recipients" value={stats.recipients} accent="#2bd576" />
        <FamilyStatCard
          label="Average transfer"
          value={<MoneyValue amount={stats.averageTransfer} compact={compactNumbers} />}
          accent="#ffb020"
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {[
          { id: 'members', label: 'Members' },
          { id: 'history', label: 'History' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="tab-btn"
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as 'members' | 'history')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleTransfers.length === 0 ? (
        <PageState
          title="No family transfers yet"
          description="Add your first family transfer to keep a clean history of support payments and recipients."
          actionLabel="Add your first transfer"
          onAction={openNewTransferModal}
        />
      ) : activeTab === 'members' ? (
        <div className="grid-responsive-3" style={{ gap: '16px' }}>
          {familyMembers.map((member) => {
            const accent = relationshipAccent[member.relationship] ?? '#94a3b8';
            return (
              <article
                key={member.name}
                className="premium-card"
                style={{ padding: '22px', display: 'grid', gap: '16px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '14px',
                    alignItems: 'flex-start',
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${accent}20`,
                        color: accent,
                        marginBottom: '14px',
                      }}
                    >
                      <Users size={20} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{member.name}</h2>
                    <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
                      {member.relationship}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="action-btn"
                    data-label="Send"
                    aria-label={`Add transfer for ${member.name}`}
                    title="Quick send"
                    onClick={() => handleQuickSend(member.name, member.relationship)}
                  >
                    <Send size={16} />
                  </button>
                </div>

                <div className="grid-responsive-2" style={{ gap: '12px' }}>
                  <FamilyMetric
                    label="Total sent"
                    value={<MoneyValue amount={member.total} compact={compactNumbers} />}
                  />
                  <FamilyMetric label="Transfers" value={member.count} />
                  <FamilyMetric
                    label="Latest transfer"
                    value={<MoneyValue amount={member.latestAmount} compact={compactNumbers} />}
                  />
                  <FamilyMetric label="Last sent" value={formatDate(member.latestDate)} />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {visibleTransfers.map((transfer) => (
            <article
              key={transfer.id}
              className="premium-card"
              style={{
                padding: '18px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: '1 1 260px' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
                >
                  <strong>{transfer.recipient}</strong>
                  <span
                    style={{
                      borderRadius: '999px',
                      padding: '4px 10px',
                      background: `${relationshipAccent[transfer.relationship] ?? '#94a3b8'}20`,
                      color: relationshipAccent[transfer.relationship] ?? '#94a3b8',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                    }}
                  >
                    {transfer.relationship}
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', margin: '8px 0 0' }}>
                  {transfer.purpose || 'General support'} • {formatDate(transfer.date)}
                </p>
                {transfer.notes ? (
                  <p style={{ color: 'var(--muted)', margin: '8px 0 0', lineHeight: 1.6 }}>
                    {transfer.notes}
                  </p>
                ) : null}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  flexWrap: 'wrap',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ color: '#ec4899', fontWeight: 800 }}>
                    <MoneyValue amount={transfer.amount} compact={compactNumbers} />
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: '4px' }}>
                    {transfer.accountId
                      ? (accounts.find((account) => account.id === transfer.accountId)?.name ??
                        'Selected account')
                      : 'No account linked'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="action-btn action-btn--edit"
                    data-label="Edit"
                    aria-label={`Edit transfer to ${transfer.recipient}`}
                    title="Edit transfer"
                    onClick={() => handleEdit(transfer)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    type="button"
                    className="action-btn action-btn--delete"
                    data-label="Delete"
                    aria-label={`Delete transfer to ${transfer.recipient}`}
                    title="Delete transfer"
                    onClick={() => requestDelete(transfer)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen ? (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '560px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0 }}>{editId ? 'Edit transfer' : 'New family transfer'}</h2>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              <input
                className="form-input"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="Recipient name"
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <select
                  className="form-input"
                  value={relationship}
                  onChange={(event) => setRelationship(event.target.value)}
                >
                  {RELATIONSHIPS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  className="form-input table-nums"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="Amount"
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <input
                  className="form-input"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
                <select
                  className="form-input"
                  value={selectedAccountId}
                  onChange={(event) =>
                    setSelectedAccountId(event.target.value ? Number(event.target.value) : '')
                  }
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                className="form-input"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                placeholder="Purpose"
              />
              <textarea
                className="form-input"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Notes"
                rows={4}
                style={{ resize: 'vertical' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="page-state__button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="add-transaction-btn">
                  {editId ? 'Save changes' : 'Save transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FamilyStatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
}) {
  return (
    <div className="premium-card" style={{ padding: '22px' }}>
      <div
        style={{
          color: 'var(--muted)',
          fontSize: '0.76rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '10px',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: accent ?? 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}

function FamilyMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      style={{
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.03)',
        padding: '14px 16px',
      }}
    >
      <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 800 }}>{value}</div>
    </div>
  );
}
