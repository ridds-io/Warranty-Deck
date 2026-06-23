// =============================================================================
// WARRANTYDECK — RECEIPT DETAIL
// src/pages/ReceiptDetail.jsx
// =============================================================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import ReceiptSummary from '../components/receipt/ReceiptSummary'
import WarrantyCard from '../components/warranty/WarrantyCard'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useReceipt } from '../hooks/useReceipts'
import { useWarranties } from '../hooks/useWarranties'
import { useCurrency } from '../context/CurrencyContext'
import { getReceiptFileUrl } from '../lib/supabase'

export default function ReceiptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { receipt, loading } = useReceipt(id)
  const { warranties, loading: warrantiesLoading } = useWarranties()
  const { formatAmount } = useCurrency()
  const [imageUrl, setImageUrl] = useState(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [showImage, setShowImage] = useState(false)

  const linkedWarranty = warranties.find(item => (
    item.id === receipt?.warrantyId || item.receiptId === receipt?.id
  ))

  const handleViewImage = async () => {
    if (showImage) {
      setShowImage(false)
      return
    }
    if (imageUrl) {
      setShowImage(true)
      return
    }
    if (!receipt?.imagePath) {
      alert('No receipt image stored for this receipt.')
      return
    }
    setImageLoading(true)
    const url = await getReceiptFileUrl(receipt.imagePath)
    setImageUrl(url)
    setShowImage(true)
    setImageLoading(false)
  }

  if (loading) {
    return (
      <PageWrapper title="Receipt">
        <EmptyState message="Loading receipt..." />
      </PageWrapper>
    )
  }

  if (!receipt) {
    return (
      <PageWrapper title="Receipt">
        <EmptyState message="Receipt not found." />
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Receipt Detail">
      <div style={{ display: 'grid', gap: 'var(--space-6)' }}>

        {/* Action bar */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <Button
            size="sm"
            variant="outline"
            onClick={handleViewImage}
            disabled={imageLoading}
          >
            {imageLoading ? 'Loading image...' : showImage ? 'Hide receipt image' : 'View receipt image'}
          </Button>
          <Button onClick={() => navigate('/chat')}>Chat about this receipt</Button>
        </div>

        {/* Receipt image viewer */}
        {showImage && imageUrl && (
          <div
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              textAlign: 'center',
            }}
          >
            <img
              src={imageUrl}
              alt={`Receipt from ${receipt.storeName}`}
              style={{
                maxWidth: '100%',
                maxHeight: '600px',
                objectFit: 'contain',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>
        )}

        {/* Receipt paper */}
        <section
          className="animate-receipt-unfold"
          style={{
            backgroundColor: 'var(--color-receipt-bg)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--shadow-receipt)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
            <div style={{ fontSize: 'var(--text-lg)', letterSpacing: 'var(--tracking-wider)' }}>
              {receipt.storeName}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              {receipt.purchaseDate}
            </div>
            {receipt.category && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-1)' }}>
                {receipt.category}
              </div>
            )}
          </div>

          <div style={{ borderTop: '2px dashed var(--color-border-dashed)', margin: 'var(--space-6) 0' }} />

          {/* Line items */}
          {receipt.items.length > 0 ? (
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {receipt.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-text-secondary)',
                    borderBottom: '1px solid var(--color-border-soft)',
                    paddingBottom: 'var(--space-2)',
                    gap: 'var(--space-4)',
                  }}
                >
                  <span style={{ flex: 1 }}>{item.qty}x {item.name}</span>
                  <span style={{ flexShrink: 0 }}>{formatAmount(item.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
              No line items recorded
            </div>
          )}

          <div style={{ borderTop: '2px dashed var(--color-border-dashed)', margin: 'var(--space-6) 0' }} />

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-lg)' }}>
            <span>Total</span>
            <span>{formatAmount(receipt.totalAmount)}</span>
          </div>

          {/* Return window */}
          {receipt.returnDays > 0 && (
            <div
              style={{
                marginTop: 'var(--space-4)',
                padding: 'var(--space-3)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Return window: <strong>{receipt.returnDays} day{receipt.returnDays !== 1 ? 's' : ''} remaining</strong>
            </div>
          )}
        </section>

        {/* AI Summary */}
        <ReceiptSummary
          summary={receipt.aiSummary || 'No AI summary available for this receipt.'}
          benefits={[]}
        />

        {/* Linked warranty */}
        {warrantiesLoading ? (
          <EmptyState message="Loading warranty..." />
        ) : linkedWarranty && (
          <section style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
                Warranty
              </h2>
              <Button size="sm" variant="outline" onClick={() => navigate(`/warranty/${linkedWarranty.id}`)}>
                Open warranty
              </Button>
            </div>
            <WarrantyCard warranty={linkedWarranty} onOpen={() => {}} />
          </section>
        )}
      </div>
    </PageWrapper>
  )
}
