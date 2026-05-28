// =============================================================================
// WARRANTYDECK — MODAL
// src/components/ui/Modal.jsx
// =============================================================================

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--color-bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal)',
      }}
      onClick={onClose}
    >
      <div
        className="animate-modal-enter"
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: 'min(560px, 92vw)',
          padding: 'var(--space-6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  )
}
