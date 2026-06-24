// =============================================================================
// WARRANTYDECK — RECEIPT REVIEW MODAL
// src/components/receipt/ReceiptReviewModal.jsx
// =============================================================================

import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'
import { useReimbursementFolders } from '../../hooks/useReimbursementFolders'

export default function ReceiptReviewModal({
    open,
    onClose,
    extractedData,
    onSave
}) {
    const { folders } = useReimbursementFolders()

    const [formData, setFormData] = useState({
        storeName: extractedData?.storeName || '',
        purchaseDate: extractedData?.purchaseDate || '',
        totalAmount: extractedData?.totalAmount || '',
        category: extractedData?.category || '',
        folderType: 'vault',
        reimbursementFolderId: null,
        memorabiliaNote: '',
        notifyWarrantyExpiry: false,
        notifyReturnDeadline: false,
        notificationDays: 7,
    })

    // Update form when extractedData changes
    useEffect(() => {
        if (extractedData) {
            setFormData(prev => ({
                ...prev,
                storeName: extractedData.storeName || '',
                purchaseDate: extractedData.purchaseDate || '',
                totalAmount: extractedData.totalAmount || '',
                category: extractedData.category || '',
            }))
        }
    }, [extractedData])

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = () => {
        onSave(formData)
    }

    if (!open) return null

    return (
        <Modal open={open} onClose={onClose} title="Review Receipt Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* Basic Receipt Info */}
                <div>
                    <label style={{
                        display: 'block',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        marginBottom: 'var(--space-2)',
                        color: 'var(--color-text-secondary)'
                    }}>
                        Store Name
                    </label>
                    <Input
                        value={formData.storeName}
                        onChange={(e) => handleChange('storeName', e.target.value)}
                        placeholder="Store name"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-xs)',
                            marginBottom: 'var(--space-2)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            Purchase Date
                        </label>
                        <Input
                            type="date"
                            value={formData.purchaseDate}
                            onChange={(e) => handleChange('purchaseDate', e.target.value)}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-xs)',
                            marginBottom: 'var(--space-2)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            Total Amount
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.totalAmount}
                            onChange={(e) => handleChange('totalAmount', e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div>
                    <label style={{
                        display: 'block',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        marginBottom: 'var(--space-2)',
                        color: 'var(--color-text-secondary)'
                    }}>
                        Category
                    </label>
                    <Input
                        value={formData.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        placeholder="e.g., Electronics, Groceries, Clothing"
                    />
                </div>

                {/* Folder Selection */}
                <div>
                    <label style={{
                        display: 'block',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        marginBottom: 'var(--space-2)',
                        color: 'var(--color-text-secondary)'
                    }}>
                        Save to
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                        {['vault', 'memorabilia', 'reimbursement'].map(type => (
                            <button
                                key={type}
                                onClick={() => handleChange('folderType', type)}
                                style={{
                                    flex: 1,
                                    padding: 'var(--space-3)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid',
                                    borderColor: formData.folderType === type
                                        ? 'var(--color-border-strong)'
                                        : 'var(--color-border-soft)',
                                    backgroundColor: formData.folderType === type
                                        ? 'var(--color-bg-elevated)'
                                        : 'transparent',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 'var(--text-xs)',
                                    textTransform: 'capitalize',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Memorabilia Note */}
                {formData.folderType === 'memorabilia' && (
                    <div>
                        <label style={{
                            display: 'block',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-xs)',
                            marginBottom: 'var(--space-2)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            Memory Note (Optional)
                        </label>
                        <textarea
                            value={formData.memorabiliaNote}
                            onChange={(e) => handleChange('memorabiliaNote', e.target.value)}
                            placeholder="Why is this receipt special to you?"
                            style={{
                                width: '100%',
                                minHeight: '80px',
                                padding: 'var(--space-3)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--color-border-soft)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-bg-surface)',
                                color: 'var(--color-text-primary)',
                                resize: 'vertical',
                            }}
                        />
                    </div>
                )}

                {/* Reimbursement Folder Selection */}
                {formData.folderType === 'reimbursement' && (
                    <div>
                        <label style={{
                            display: 'block',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-xs)',
                            marginBottom: 'var(--space-2)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            Select Reimbursement Folder
                        </label>
                        <select
                            value={formData.reimbursementFolderId || ''}
                            onChange={(e) => handleChange('reimbursementFolderId', e.target.value || null)}
                            style={{
                                width: '100%',
                                padding: 'var(--space-3)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--color-border-soft)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-bg-surface)',
                                color: 'var(--color-text-primary)',
                            }}
                        >
                            <option value="">No folder (general reimbursement)</option>
                            {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.folderName} ({folder.receiptCount} receipts, ${folder.totalAmount.toFixed(2)})
                                </option>
                            ))}
                        </select>
                        {folders.length === 0 && (
                            <p style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-tertiary)',
                                marginTop: 'var(--space-2)',
                            }}>
                                💡 Create folders in the Reimbursement page to organize your receipts
                            </p>
                        )}
                    </div>
                )}
                padding: 'var(--space-3)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                resize: 'vertical',
                            }}
                        />
            </div>
                )}

            {/* Notification Preferences */}
            <div style={{
                padding: 'var(--space-4)',
                backgroundColor: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-soft)'
            }}>
                <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: '500',
                    marginBottom: 'var(--space-3)'
                }}>
                    Notification Preferences
                </div>

                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-2)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)'
                }}>
                    <input
                        type="checkbox"
                        checked={formData.notifyWarrantyExpiry}
                        onChange={(e) => handleChange('notifyWarrantyExpiry', e.target.checked)}
                    />
                    Notify me about warranty expiry
                </label>

                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)'
                }}>
                    <input
                        type="checkbox"
                        checked={formData.notifyReturnDeadline}
                        onChange={(e) => handleChange('notifyReturnDeadline', e.target.checked)}
                    />
                    Notify me about return deadline
                </label>

                {(formData.notifyWarrantyExpiry || formData.notifyReturnDeadline) && (
                    <div>
                        <label style={{
                            display: 'block',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 'var(--text-xs)',
                            marginBottom: 'var(--space-2)',
                            color: 'var(--color-text-secondary)'
                        }}>
                            Notify me (days in advance)
                        </label>
                        <select
                            value={formData.notificationDays}
                            onChange={(e) => handleChange('notificationDays', parseInt(e.target.value))}
                            style={{
                                width: '100%',
                                padding: 'var(--space-2)',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-sm)',
                                border: '1px solid var(--color-border-soft)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--color-bg-surface)',
                                color: 'var(--color-text-primary)',
                            }}
                        >
                            <option value={1}>1 day before</option>
                            <option value={2}>2 days before</option>
                            <option value={3}>3 days before</option>
                            <option value={7}>1 week before</option>
                            <option value={14}>2 weeks before</option>
                            <option value={30}>1 month before</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} style={{ flex: 1 }}>
                    Save Receipt
                </Button>
            </div>
        </div>
        </Modal >
    )
}
