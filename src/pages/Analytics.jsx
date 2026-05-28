// =============================================================================
// WARRANTYDECK — ANALYTICS
// src/pages/Analytics.jsx
// =============================================================================

import PageWrapper from '../components/layout/PageWrapper'
import SpendingChart from '../components/charts/SpendingChart'
import CategoryPie from '../components/charts/CategoryPie'
import WarrantyCard from '../components/warranty/WarrantyCard'
import EmptyState from '../components/ui/EmptyState'
import { useReceipts } from '../hooks/useReceipts'
import { useWarranties } from '../hooks/useWarranties'
import { groupSpendByWeekday, groupSpendByCategory } from '../lib/analytics'

export default function Analytics() {
  const { receipts, loading: receiptsLoading } = useReceipts()
  const { warranties, loading: warrantiesLoading } = useWarranties()

  const spendByDay = groupSpendByWeekday(receipts)
  const categorySpend = groupSpendByCategory(receipts)
  const totalSpend = receipts.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
  const avgReceipt = receipts.length
    ? totalSpend / receipts.length
    : 0

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
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
            Expiring warranties
          </h2>
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {warrantiesLoading || receiptsLoading ? (
              <EmptyState message="Loading analytics..." />
            ) : warranties.length === 0 ? (
              <EmptyState message="No warranties available." />
            ) : (
              warranties.map(item => (
                <WarrantyCard key={item.id} warranty={item} onOpen={() => {}} />
              ))
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}
