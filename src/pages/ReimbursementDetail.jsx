// =============================================================================
// WARRANTYDECK — REIMBURSEMENT DETAIL
// src/pages/ReimbursementDetail.jsx
// =============================================================================

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import ReceiptCard from '../components/receipt/ReceiptCard'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { useReimbursementFolder } from '../hooks/useReimbursementFolders'

export default function ReimbursementDetail() {
    const { folderId } = useParams()
    const navigate = useNavigate()
    const { folder, receipts, loading } = useReimbursementFolder(folderId)
    const [query, setQuery] = useState('')

    const filtered = receipts.filter(receipt => {
        if (!query) return true
        return receipt.store_name?.toLowerCase().includes(query.toLowerCase()) ||
            receipt.category_name?.toLowerCase().includes(query.toLowerCase())
    })

    if (loading) {
        return (
            <PageWrapper title="Loading...">
                <EmptyState message="Loading folder details..." />
            </PageWrapper>
        )
    }

    if (!folder) {
        return (
            <PageWrapper title="Not Found">
                <EmptyState message="Folder not found" />
            </PageWrapper>
        )
    }

    return (
        <PageWrapper title={folder.folderName}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Back Button */}
                <Button
                    variant="secondary"
                    onClick={() => navigate('/reimbursement')}
                    style={{ width: 'fit-content' }}
                >
                    ← Back to Folders
                </Button>

                {/* Folder Info Card */}
                <div
                    style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        border: '1px solid var(--color-border-strong)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-5)',
                        boxShadow: 'var(--shadow-sm)',
                    }}
                >
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <h2 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'var(--text-2xl)',
                            marginBottom: 'var(--space-2)',
                        }}>
                            📁 {folder.folderName}
                        </h2>
                        {folder.description && (
                            <p style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-text-secondary)',
                            }}>
                                {folder.description}
                            </p>
                        )}
                    </div>

                    {/* Summary Stats */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: 'var(--space-4)',
                        padding: 'var(--space-4)',
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: 'var(--tracking-wide)',
                                marginBottom: 'var(--space-1)',
                            }}>
                                Total Receipts
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-3xl)',
                                fontWeight: '700',
                            }}>
                                {folder.receiptCount}
                            </div>
                        </div>

                        <div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: 'var(--tracking-wide)',
                                marginBottom: 'var(--space-1)',
                            }}>
                                Total Amount
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-3xl)',
                                fontWeight: '700',
                                color: 'var(--color-success)',
                            }}>
                                ${folder.totalAmount.toFixed(2)}
                            </div>
                        </div>

                        <div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: 'var(--tracking-wide)',
                                marginBottom: 'var(--space-1)',
                            }}>
                                Status
                            </div>
                            <div style={{ marginTop: 'var(--space-2)' }}>
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 'var(--text-sm)',
                                    padding: 'var(--space-2) var(--space-3)',
                                    backgroundColor: folder.status === 'active'
                                        ? 'var(--color-success-bg)'
                                        : folder.status === 'submitted'
                                            ? 'var(--color-warning-bg)'
                                            : 'var(--color-text-tertiary)',
                                    color: folder.status === 'active'
                                        ? 'var(--color-success)'
                                        : folder.status === 'submitted'
                                            ? 'var(--color-warning)'
                                            : 'var(--color-text-primary)',
                                    borderRadius: 'var(--radius-full)',
                                    textTransform: 'uppercase',
                                    letterSpacing: 'var(--tracking-wide)',
                                }}>
                                    {folder.status}
                                </span>
                            </div>
                        </div>

                        <div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-xs)',
                                color: 'var(--color-text-tertiary)',
                                textTransform: 'uppercase',
                                letterSpacing: 'var(--tracking-wide)',
                                marginBottom: 'var(--space-1)',
                            }}>
                                Average Receipt
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-3xl)',
                                fontWeight: '700',
                            }}>
                                ${folder.receiptCount > 0 ? (folder.totalAmount / folder.receiptCount).toFixed(2) : '0.00'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <Input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search receipts in this folder"
                />

                {/* Receipts Grid */}
                <section>
                    <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'var(--text-xl)',
                        marginBottom: 'var(--space-4)'
                    }}>
                        Receipts ({filtered.length})
                    </h3>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: 'var(--space-4)',
                        }}
                    >
                        {filtered.length === 0 ? (
                            <EmptyState message="No receipts in this folder yet. Upload receipts and select this folder to add them here." />
                        ) : (
                            filtered.map(receipt => (
                                <ReceiptCard
                                    key={receipt.id}
                                    receipt={{
                                        id: receipt.id,
                                        storeName: receipt.store_name || 'Unknown',
                                        purchaseDate: receipt.purchase_date,
                                        totalAmount: Number(receipt.total_amount || 0),
                                        category: receipt.category_name || 'Uncategorized',
                                        folderType: receipt.folder_type,
                                    }}
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
