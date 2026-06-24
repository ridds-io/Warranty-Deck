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
import ReceiptReviewModal from '../components/receipt/ReceiptReviewModal'
import WarrantyCard from '../components/warranty/WarrantyCard'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { useReceipts } from '../hooks/useReceipts'
import { useWarranties } from '../hooks/useWarranties'
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
  const [viewMode, setViewMode] = useState('receipts') // 'receipts' or 'warranties'
  const { receipts, loading, refresh } = useReceipts()
  const { warranties, loading: loadingWarranties } = useWarranties()
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [uploadedFilePath, setUploadedFilePath] = useState(null)

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

      // 4. Store extracted data and show review modal
      setExtractedData(parsed)
      setUploadedFilePath(uploadResult.path)
      setShowReviewModal(true)
      setIsProcessing(false)
      setStatusMessage('')
    } catch (err) {
      console.error('Error processing receipt:', err)
      setErrorMessage(err.message || 'An error occurred during receipt processing.')
      setIsProcessing(false)
    }
  }

  const handleSaveReceipt = async (formData) => {
    if (!user || !extractedData) return

    setShowReviewModal(false)
    setIsProcessing(true)
    setStatusMessage('Saving receipt to database...')

    try {
      // Save receipt to database
      const receiptInsertData = {
        user_id: user.id,
        store_name: formData.storeName,
        purchase_date: formData.purchaseDate,
        total_amount: parseFloat(formData.totalAmount),
        category_name: formData.category,
        folder_type: formData.folderType,
        notes: formData.memorabiliaNote || null,
        return_deadline: extractedData.returnDeadline,
        ai_summary: extractedData.aiSummary,
        file_url: uploadedFilePath,
      }

      // Add reimbursement_folder_id if reimbursement type and folder selected
      if (formData.folderType === 'reimbursement' && formData.reimbursementFolderId) {
        receiptInsertData.reimbursement_folder_id = formData.reimbursementFolderId
      }

      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert(receiptInsertData)
        .select()
        .single()

      if (receiptError) throw receiptError

      // Insert line items
      if (extractedData.items && extractedData.items.length > 0) {
        const itemsToInsert = extractedData.items.map(item => ({
          receipt_id: receiptData.id,
          product_id: 1, // TODO: Link to actual product or make this nullable
          item_description: item.name,
          quantity: item.qty,
          unit_price: item.price,
          total_price: item.price * item.qty,
        }))
        const { error: itemsError } = await supabase.from('receipt_items').insert(itemsToInsert)
        if (itemsError) console.error('Failed to insert receipt items:', itemsError)
      }

      // Insert warranty if detected
      if (extractedData.warranty) {
        const { data: warrantyData, error: warrantyError } = await supabase.from('warranties').insert({
          user_id: user.id,
          receipt_id: receiptData.id,
          product_name: extractedData.warranty.title,
          brand: extractedData.warranty.provider,
          warranty_start_date: formData.purchaseDate,
          warranty_end_date: extractedData.warranty.expiresOn,
          warranty_benefits: extractedData.warranty.benefits,
        })
          .select()
          .single()

        if (warrantyError) console.error('Failed to insert warranty:', warrantyError)

        // Create notification preference if warranty notification is enabled
        if (formData.notifyWarrantyExpiry && !warrantyError && warrantyData) {
          await createNotificationPreference(
            receiptData.id,
            'warranty_expiry',
            formData.notificationDays,
            extractedData.warranty.expiresOn
          )
        }
      }

      // Create notification preference for return deadline if enabled
      if (formData.notifyReturnDeadline && extractedData.returnDeadline) {
        await createNotificationPreference(
          receiptData.id,
          'return_reminder',
          formData.notificationDays,
          extractedData.returnDeadline
        )
      }

      setStatusMessage('Receipt successfully saved!')
      setTimeout(() => {
        setIsProcessing(false)
        setStatusMessage('')
        setExtractedData(null)
        setUploadedFilePath(null)
      }, 1500)

      refresh()
    } catch (err) {
      console.error('Error saving receipt:', err)
      setErrorMessage(err.message || 'An error occurred while saving the receipt.')
      setIsProcessing(false)
    }
  }

  const createNotificationPreference = async (receiptId, notificationType, daysBeforeExpiry, expiryDate) => {
    try {
      // Calculate scheduled date
      const expiry = new Date(expiryDate)
      const scheduledDate = new Date(expiry)
      scheduledDate.setDate(scheduledDate.getDate() - daysBeforeExpiry)

      await supabase.from('notifications').insert({
        user_id: user.id,
        receipt_id: receiptId,
        notification_type: notificationType,
        delivery_method: 'email',
        title: notificationType === 'warranty_expiry' ? 'Warranty Expiring Soon' : 'Return Deadline Approaching',
        message: `Your ${notificationType === 'warranty_expiry' ? 'warranty' : 'return period'} expires in ${daysBeforeExpiry} days`,
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        status: 'pending',
      })
    } catch (err) {
      console.error('Failed to create notification:', err)
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

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-3)',
          padding: 'var(--space-2)',
          backgroundColor: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-soft)',
          width: 'fit-content'
        }}>
          <button
            onClick={() => setViewMode('receipts')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: viewMode === 'receipts'
                ? 'var(--color-bg-surface)'
                : 'transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              fontWeight: viewMode === 'receipts' ? '500' : 'normal',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'receipts' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            📄 Receipts
          </button>
          <button
            onClick={() => setViewMode('warranties')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: viewMode === 'warranties'
                ? 'var(--color-bg-surface)'
                : 'transparent',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              fontWeight: viewMode === 'warranties' ? '500' : 'normal',
              color: 'var(--color-text-primary)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: viewMode === 'warranties' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            🛡️ Warranties
          </button>
        </div>

        {viewMode === 'receipts' ? (
          <>
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
          </>
        ) : (
          <>
            <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <Input
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search warranties"
              />
            </section>

            <section
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 'var(--space-4)',
              }}
            >
              {loadingWarranties ? (
                <EmptyState message="Loading warranties..." />
              ) : warranties.length === 0 ? (
                <EmptyState message="No warranties found." />
              ) : (
                warranties
                  .filter(warranty =>
                    !query ||
                    warranty.title.toLowerCase().includes(query.toLowerCase()) ||
                    warranty.provider.toLowerCase().includes(query.toLowerCase())
                  )
                  .map(warranty => (
                    <WarrantyCard
                      key={warranty.id}
                      warranty={warranty}
                      onClick={() => navigate(`/warranty/${warranty.id}`)}
                    />
                  ))
              )}
            </section>
          </>
        )}

        {/* Review Modal */}
        <ReceiptReviewModal
          open={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setExtractedData(null)
            setUploadedFilePath(null)
          }}
          extractedData={extractedData}
          onSave={handleSaveReceipt}
        />
      </div>
    </PageWrapper>
  )
}
