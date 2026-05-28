// =============================================================================
// WARRANTYDECK — WARRANTY DETAIL
// src/pages/WarrantyDetail.jsx
// =============================================================================

import { useParams, useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import BenefitsList from '../components/warranty/BenefitsList'
import ExpiryCountdown from '../components/ui/ExpiryCountdown'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useWarranty } from '../hooks/useWarranties'

export default function WarrantyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { warranty, loading } = useWarranty(id)

  if (loading) {
    return (
      <PageWrapper title="Warranty">
        <EmptyState message="Loading warranty..." />
      </PageWrapper>
    )
  }

  if (!warranty) {
    return (
      <PageWrapper title="Warranty">
        <EmptyState message="Warranty not found." />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Warranty Detail">
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
        <section
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
                {warranty.title}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-tertiary)' }}>
                {warranty.provider}
              </div>
            </div>
            <ExpiryCountdown expiresOn={warranty.expiresOn} />
          </div>

          <div
            style={{
              marginTop: 'var(--space-4)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-4)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <div>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Purchased</div>
              <div>{warranty.purchaseDate}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Expires</div>
              <div>{warranty.expiresOn}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-tertiary)' }}>Status</div>
              <div>{warranty.status}</div>
            </div>
          </div>
        </section>

        <section
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Coverage benefits
          </div>
          <BenefitsList items={warranty.benefits} />
        </section>

        <Button onClick={() => navigate('/chat')}>Chat about this warranty</Button>
      </div>
    </PageWrapper>
  )
}
