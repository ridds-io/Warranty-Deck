// =============================================================================
// WARRANTYDECK — REIMBURSEMENT
// src/pages/Reimbursement.jsx
// =============================================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { useReimbursementFolders } from '../hooks/useReimbursementFolders'

export default function Reimbursement() {
  const navigate = useNavigate()
  const { folders, loading, createFolder, deleteFolder } = useReimbursementFolders()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [query, setQuery] = useState('')

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setIsCreating(true)
    const { error } = await createFolder(newFolderName, newFolderDescription)

    if (!error) {
      setShowCreateModal(false)
      setNewFolderName('')
      setNewFolderDescription('')
    }
    setIsCreating(false)
  }

  const handleDeleteFolder = async (folderId, folderName) => {
    if (!confirm(`Are you sure you want to delete "${folderName}"? Receipts will not be deleted, just unlinked from this folder.`)) {
      return
    }
    await deleteFolder(folderId)
  }

  const filtered = folders.filter(folder => {
    if (!query) return true
    return folder.folderName.toLowerCase().includes(query.toLowerCase()) ||
      folder.description.toLowerCase().includes(query.toLowerCase())
  })

  return (
    <PageWrapper title="Reimbursement">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {/* Header with Create Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          flexWrap: 'wrap'
        }}>
          <div>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)'
            }}>
              Organize receipts into folders for different reimbursement purposes
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            + New Folder
          </Button>
        </div>

        {/* Search */}
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search reimbursement folders"
        />

        {/* Folders Grid */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          {loading ? (
            <EmptyState message="Loading folders..." />
          ) : filtered.length === 0 ? (
            <EmptyState message="No reimbursement folders yet. Create one to get started!" />
          ) : (
            filtered.map(folder => (
              <div
                key={folder.id}
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  border: '1px solid var(--color-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-5)',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
                onClick={() => navigate(`/reimbursement/${folder.id}`)}
              >
                {/* Folder Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 'var(--space-3)'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'var(--text-lg)',
                      marginBottom: 'var(--space-2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                    }}>
                      📁 {folder.folderName}
                    </h3>
                    {folder.description && (
                      <p style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-tertiary)',
                        marginBottom: 'var(--space-3)',
                      }}>
                        {folder.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFolder(folder.id, folder.folderName)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-tertiary)',
                      cursor: 'pointer',
                      padding: 'var(--space-1)',
                      fontSize: 'var(--text-sm)',
                    }}
                    title="Delete folder"
                  >
                    🗑️
                  </button>
                </div>

                {/* Folder Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
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
                    }}>
                      Receipts
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xl)',
                      fontWeight: '600',
                      marginTop: 'var(--space-1)',
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
                    }}>
                      Total
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-xl)',
                      fontWeight: '600',
                      marginTop: 'var(--space-1)',
                    }}>
                      ${folder.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    padding: 'var(--space-1) var(--space-2)',
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
            ))
          )}
        </section>

        {/* Create Folder Modal */}
        <Modal
          open={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setNewFolderName('')
            setNewFolderDescription('')
          }}
          title="Create Reimbursement Folder"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                marginBottom: 'var(--space-2)',
                color: 'var(--color-text-secondary)'
              }}>
                Folder Name *
              </label>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., Business Trip - NYC, Medical Expenses 2024"
                autoFocus
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
                Description (Optional)
              </label>
              <textarea
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder="Add details about this reimbursement..."
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

            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewFolderName('')
                  setNewFolderDescription('')
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreating}
                style={{ flex: 1 }}
              >
                {isCreating ? 'Creating...' : 'Create Folder'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </PageWrapper>
  )
}
