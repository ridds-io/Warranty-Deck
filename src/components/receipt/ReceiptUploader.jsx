// =============================================================================
// WARRANTYDECK — RECEIPT UPLOADER
// src/components/receipt/ReceiptUploader.jsx
// =============================================================================

import { useState } from 'react'

export default function ReceiptUploader({ onUpload, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [fileName, setFileName] = useState(null)

  const processFile = (file) => {
    if (!file) return
    setFileName(file.name)

    // Show image preview for image files
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(file)
    } else {
      // PDF — show generic icon
      setPreview(null)
    }

    onUpload?.(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const clear = (e) => {
    e.stopPropagation()
    setPreview(null)
    setFileName(null)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        border: isDragging ? '2px dashed var(--color-text-primary)' : '1px dashed var(--color-border-dashed)',
        borderRadius: 'var(--radius-md)',
        padding: preview ? 'var(--space-4)' : 'var(--space-6)',
        backgroundColor: isDragging ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'default',
        position: 'relative',
      }}
    >
      {preview ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={preview}
              alt="Receipt preview"
              style={{
                maxHeight: '200px',
                maxWidth: '100%',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-strong)',
                objectFit: 'contain',
              }}
            />
            {!disabled && (
              <button
                onClick={clear}
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  background: 'var(--color-text-primary)',
                  color: 'var(--color-text-inverse)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
            {fileName}
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: '1.5rem',
              marginBottom: 'var(--space-2)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            ↑
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: isDragging ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              marginBottom: 'var(--space-3)',
              fontWeight: isDragging ? '500' : 'normal',
            }}
          >
            {isDragging ? 'Drop your receipt here' : 'Drag & drop a receipt image or PDF'}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-3)' }}>
            or
          </div>
        </div>
      )}

      {!preview && (
        <label
          style={{
            display: 'inline-block',
            padding: 'var(--space-2) var(--space-4)',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--tracking-wide)',
            textTransform: 'uppercase',
            cursor: disabled ? 'not-allowed' : 'pointer',
            backgroundColor: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
          }}
        >
          Browse file
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            disabled={disabled}
            style={{ display: 'none' }}
          />
        </label>
      )}
    </div>
  )
}
