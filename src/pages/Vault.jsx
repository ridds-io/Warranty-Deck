// =============================================================================
// WARRANTYDECK — VAULT
// src/pages/Vault.jsx
// =============================================================================

import { useMemo, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import ReceiptCard from '../components/receipt/ReceiptCard'
import ReceiptUploader from '../components/receipt/ReceiptUploader'
import ReceiptScanner from '../components/receipt/ReceiptScanner'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { useReceipts } from '../hooks/useReceipts'
import { useAuth } from '../context/AuthContext'
import { uploadReceiptFile, supabase } from '../lib/supabase'
import { analyzeReceiptImage } from '../lib/groq'

export default function Vault() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const searchQuery = params.get('search') || ''
  const [query, setQuery] = useState(searchQuery)
  const [category, setCategory] = useState('All')
  const { receipts, loading, refresh } = useReceipts()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const categories = useMemo(() => {
    const unique = new Set(receipts.map(item => item.category))
    return ['All', ...Array.from(unique)]
  }, [receipts])

  const filtered = receipts.filter(receipt => {
    if (receipt.folderType !== 'vault') return false
    const matchesCategory = category === 'All' || receipt.category === category
    const matchesQuery = !query
      || receipt.storeName.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  })

  const handleSearch = (value) => {
    setQuery(value)
    if (value) {
      params.set('search', value)
    } else {
      params.delete('search')
    }
    navigate({ search: params.toString() })
  }

  const handleUpload = async (file) => {
    if (!file) return
    if (!user) {
      setErrorMessage('You must be signed in to upload receipts.')
      return
    }

    setIsProcessing(true)
    setErrorMessage('')

    try {
      // 1. Upload to Supabase Storage
      setStatusMessage('Uploading receipt to secure vault storage...')
      const uploadResult = await uploadReceiptFile(user.id, file)
      if (!uploadResult) {
        throw new Error('Failed to upload file to storage bucket.')
      }

      // 2. Read file to Base64 for Groq Vision API
      setStatusMessage('Scanning receipt details with Groq Vision AI...')
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const base64Str = reader.result.split(',')[1]
          resolve(base64Str)
        }
        reader.onerror = error => reject(error)
      })

      // 3. Send to Groq Vision model
      const parsed = await analyzeReceiptImage(base64Data, file.type)

      // 4. Save to Database
      setStatusMessage('Saving extracted items and return policies to database...')

      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          user_id: user.id,
          store_name: parsed.storeName,
          purchase_date: parsed.purchaseDate,
          total_amount: parsed.totalAmount,
          category_name: parsed.category,
          folder_type: parsed.folderType || 'vault',
          return_deadline: parsed.returnDeadline,
          ai_summary: parsed.aiSummary,
          image_path: uploadResult.path,
        })
        .select()
        .single()

      if (receiptError) throw receiptError

      // Insert line items
      if (parsed.items && parsed.items.length > 0) {
        const itemsToInsert = parsed.items.map(item => ({
          receipt_id: receiptData.id,
          item_name: item.name,
          quantity: item.qty,
          price: item.price,
        }))
        const { error: itemsError } = await supabase.from('receipt_items').insert(itemsToInsert)
        if (itemsError) console.error('Failed to insert receipt items:', itemsError)
      }

      // Insert warranty if detected
      if (parsed.warranty) {
        const { error: warrantyError } = await supabase.from('warranties').insert({
          user_id: user.id,
          receipt_id: receiptData.id,
          title: parsed.warranty.title,
          provider: parsed.warranty.provider,
          purchase_date: parsed.purchaseDate,
          expires_on: parsed.warranty.expiresOn,
          warranty_benefits: parsed.warranty.benefits,
        })
        if (warrantyError) console.error('Failed to insert warranty:', warrantyError)
      }

      setStatusMessage('Receipt successfully analyzed and saved!')
      setTimeout(() => {
        setIsProcessing(false)
        setStatusMessage('')
      }, 1500)

      refresh()
    } catch (err) {
      console.error('Error processing receipt:', err)
      setErrorMessage(err.message || 'An error occurred during receipt processing.')
      setIsProcessing(false)
    }
  }

  const triggerScan = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  return (
    <PageWrapper title="Vault">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {errorMessage && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-danger)',
            }}
          >
            {errorMessage}
          </div>
        )}

        {isProcessing && (
          <div
            style={{
              padding: 'var(--space-4)',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <div style={{ fontWeight: '500' }}>{statusMessage}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              Please do not close this window.
            </div>
          </div>
        )}

        <ReceiptUploader onUpload={handleUpload} disabled={isProcessing} />
        <ReceiptScanner onScan={triggerScan} />

        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {categories.map(item => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: category === item
                    ? 'var(--color-border-strong)'
                    : 'var(--color-border-soft)',
                  backgroundColor: category === item
                    ? 'var(--color-bg-elevated)'
                    : 'transparent',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-xs)',
                  letterSpacing: 'var(--tracking-wide)',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <Input
            value={query}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search vault receipts"
          />
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {loading ? (
            <EmptyState message="Loading receipts..." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No receipts found." />
          ) : (
            filtered.map(receipt => (
              <ReceiptCard
                key={receipt.id}
                receipt={receipt}
                onOpen={(id) => navigate(`/receipt/${id}`)}
              />
            ))
          )}
        </section>
      </div>
    </PageWrapper>
  )
}
