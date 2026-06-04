// Shared dashboard UI — used by authenticated Dashboard and public Preview.

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import TypewriterText from '../components/ui/TypewriterText'
import ReceiptCard from '../components/receipt/ReceiptCard'
import WarrantyCard from '../components/warranty/WarrantyCard'
import SpendingChart from '../components/charts/SpendingChart'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { groupSpendByWeekday } from '../lib/analytics'

export default function DashboardView({
  profile,
  receipts = [],
  warranties = [],
  notifications = [],
  receiptsLoading = false,
  warrantiesLoading = false,
  preview = false,
}) {
  const navigate = useNavigate()

  const summary = useMemo(() => ({
    receipts: receipts.length,
    warranties: warranties.length,
    alerts: notifications.length,
  }), [receipts.length, warranties.length, notifications.length])

  const expiringSoon = warranties.filter(w => w.status === 'expiring')
  const recentReceipts = receipts.slice(0, 3)
  const spendingData = useMemo(() => groupSpendByWeekday(receipts), [receipts])

  return (
    <PageWrapper title="Dashboard">
      {preview && (
        <div
          style={{
            marginBottom: 'var(--space-6)',
            padding: 'var(--space-3) var(--space-4)',
            backgroundColor: 'var(--color-bg-elevated)',
            border: '1px dashed var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Preview mode — sample data only.{' '}
          <a href="/" style={{ color: 'var(--color-text-primary)' }}>Sign in</a> for your real dashboard.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <section>
          <div
            style={{
              fontSize: 'var(--text-3xl)',
              lineHeight: 'var(--leading-tight)',
              marginBottom: 'var(--space-2)',
            }}
          >
            <TypewriterText text={`Hi ${profile?.first_name || 'there'}`} />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--text-lg)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Here is your receipt overview for this week.
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {[
            { label: 'Total receipts', value: summary.receipts },
            { label: 'Active warranties', value: summary.warranties },
            { label: 'Open alerts', value: summary.alerts },
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

        <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
                Expiring soon
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(preview ? '/preview/dashboard' : '/analytics')}
              >
                View all
              </Button>
            </div>
            {warrantiesLoading ? (
              <EmptyState message="Loading warranties..." />
            ) : expiringSoon.length === 0 ? (
              <EmptyState message="No warranties expiring soon." />
            ) : (
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                {expiringSoon.map(item => (
                  <WarrantyCard
                    key={item.id}
                    warranty={item}
                    onOpen={(id) => navigate(preview ? '/preview/dashboard' : `/warranty/${id}`)}
                  />
                ))}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <SpendingChart data={spendingData} />
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
              Recent receipts
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(preview ? '/preview/dashboard' : '/vault')}
            >
              Open vault
            </Button>
          </div>
          <div
            style={{
              marginTop: 'var(--space-4)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 'var(--space-4)',
            }}
          >
            {receiptsLoading ? (
              <EmptyState message="Loading receipts..." />
            ) : recentReceipts.length === 0 ? (
              <EmptyState message="No receipts yet." />
            ) : (
              recentReceipts.map(receipt => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  onOpen={(id) => navigate(preview ? '/preview/dashboard' : `/receipt/${id}`)}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  )
}
