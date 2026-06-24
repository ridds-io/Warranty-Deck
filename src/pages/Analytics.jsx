// =============================================================================
// WARRANTYDECK — ANALYTICS
// src/pages/Analytics.jsx
// =============================================================================

import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import SpendingChart from '../components/charts/SpendingChart'
import CategoryPie from '../components/charts/CategoryPie'
import WarrantyCard from '../components/warranty/WarrantyCard'
import ReceiptCard from '../components/receipt/ReceiptCard'
import EmptyState from '../components/ui/EmptyState'
import { useReceipts } from '../hooks/useReceipts'
import { useWarranties } from '../hooks/useWarranties'
import { groupSpendByWeekday, groupSpendByCategory } from '../lib/analytics'

export default function Analytics() {
  const navigate = useNavigate()
  const { receipts, loading: receiptsLoading } = useReceipts()
  const { warranties, loading: warrantiesLoading } = useWarranties()

  const spendByDay = groupSpendByWeekday(receipts)
  const categorySpend = groupSpendByCategory(receipts)
  const totalSpend = receipts.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  const avgReceipt = receipts.length
    ? totalSpend / receipts.length
    : 0

  // Get recent receipts (last 5)
  const recentReceipts = receipts.slice(0, 5)

  // Get expiring warranties (next 60 days)
  const expiringWarranties = warranties.filter(w => {
    if (w.status === 'expired') return false
    const today = new Date()
    const expiry = new Date(w.expiresOn)
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return diffDays <= 60 && diffDays > 0
  }).slice(0, 5)

  return (
    <PageWrapper title="Analytics">
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {[
            { label: 'Total spend', value: `$${totalSpend.toFixed(0)}` },
            { label: 'Avg receipt', value: `$${avgReceipt.toFixed(0)}` },
            { label: 'Active warranties', value: `${warranties.length}` },
          ].map(card => (
            <div
              key={card.label}
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-strong)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-5)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--tracking-widest)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-2xl)',
                  marginTop: 'var(--space-2)',
                }}
              >
                {card.value}
              </div>
            </div>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: 'var(--space-6)',
          }}
        >
          <SpendingChart data={spendByDay} />
          <CategoryPie data={categorySpend} />
        </section>

        <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
              Expiring warranties
            </h2>
            <button
              onClick={() => navigate('/vault?view=warranties')}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              View all in Vault →
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)'
            }}
          >
            {warrantiesLoading ? (
              <EmptyState message="Loading warranties..." />
            ) : expiringWarranties.length === 0 ? (
              <EmptyState message="No warranties expiring soon." />
            ) : (
              expiringWarranties.map(item => (
                <WarrantyCard
                  key={item.id}
                  warranty={item}
                  onClick={() => navigate(`/warranty/${item.id}`)}
                />
              ))
            )}
          </div>
        </section>

        <section style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
              Recent receipts
            </h2>
            <button
              onClick={() => navigate('/vault?view=receipts')}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              View all in Vault →
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)'
            }}
          >
            {receiptsLoading ? (
              <EmptyState message="Loading receipts..." />
            ) : recentReceipts.length === 0 ? (
              <EmptyState message="No receipts available." />
            ) : (
              recentReceipts.map(item => (
                <ReceiptCard
                  key={item.id}
                  receipt={item}
                  onOpen={(id) => navigate(`/receipt/${id}`)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}
