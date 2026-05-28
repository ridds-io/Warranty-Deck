// =============================================================================
// WARRANTYDECK — LANDING PAGE
// src/pages/Landing.jsx
//
// Three sections:
//   1. HERO        — Split screen. Left: 3 stat rectangles. Right: hook + auth.
//   2. RECEIPT     — Scroll animation: zoom into receipt → text fades → features.
//   3. HOW-TO      — Interactive guide. Left: list of actions. Right: mockup.
//
// Dependencies:
//   - react-router-dom (useNavigate)
//   - AuthContext (signIn)
//   - No external animation libraries — pure CSS + Intersection Observer
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// =============================================================================
// CONSTANTS
// =============================================================================

// Statistics — real data with sources
// To swap a stat: change the number, label, and sublabel here only.
const STATS = {
  // Vertical rectangle (left) — returns without receipt
  returns: {
  number:   '67',
  unit:     '%',
  label:    'of retailers turn you away',
  sublabel: 'without a receipt',
  detail:   'No receipt. No return. No refund. Most stores require proof of purchase — and without it, you have no case, no matter how recent the purchase.',
  note:     'National Retail Federation, 2024',
  },
  // Top-right card — warranty claims
  warranty: {
    number:   '75',
    unit:     '%',
    label:    'of people don\'t know',
    sublabel: 'how to file a warranty claim',
    note:     'Consumer Reports, 2024',
  },
  // Bottom-right rectangle — reimbursements
  reimbursement: {
    number:   '47',
    unit:     '%',
    label:    'of employees lose out',
    sublabel: 'on reimbursements due to missing receipts',
    note:     'Expensify Survey, 2024',
  },
}

// How-to guide steps
// Each item has: id, title, description, and a mockup config
const HOW_TO_STEPS = [
  {
    id:          'upload',
    title:       'Upload a receipt',
    description: 'Drag and drop or photograph any receipt. Our OCR reads it instantly — store, items, total, date.',
    mockupLabel: 'Receipt Upload',
    mockupIcon:  '↑',
    mockupLines: ['Drag & drop your receipt here', 'or click to browse files', '— — — — — — — — — — —', 'Supported: JPG, PNG, PDF'],
  },
  {
    id:          'warranty',
    title:       'Add a warranty card',
    description: 'Link a warranty to any receipt. WarrantyDeck tracks the expiry date and tells you exactly what you\'re covered for.',
    mockupLabel: 'Warranty Detail',
    mockupIcon:  '◈',
    mockupLines: ['Samsung 65" QLED TV', 'Warranty: 24 months', '— — — — — — — — — — —', 'Expires: 14 Jan 2027', 'Coverage: Parts & Labour'],
  },
  {
    id:          'chat',
    title:       'Ask the AI assistant',
    description: 'Chat about any product. "What does my Samsung warranty cover?" gets you a real answer in seconds.',
    mockupLabel: 'AI Assistant',
    mockupIcon:  '◎',
    mockupLines: ['You: What does my warranty cover?', '— — — — — — — — — — —', 'WD: Your Samsung TV warranty', 'covers manufacturing defects,', 'panel issues & power failures.'],
  },
  {
    id:          'memorabilia',
    title:       'Save a memory',
    description: 'That dinner receipt, the concert ticket, the first rent payment. Some bills deserve to be kept as memories.',
    mockupLabel: 'Memorabilia',
    mockupIcon:  '♡',
    mockupLines: ['Nobu Mumbai', '14 Feb 2025', '— — — — — — — — — — —', 'Added to Memorabilia', '"Anniversary dinner ♡"'],
  },
  {
    id:          'reimburse',
    title:       'File a reimbursement',
    description: 'Store work and medical receipts in one folder. Export them as a PDF when it\'s time to submit.',
    mockupLabel: 'Reimbursement Folder',
    mockupIcon:  '▦',
    mockupLines: ['Q1 2025 — Work Expenses', '— — — — — — — — — — —', 'Flights............₹24,800', 'Hotels.............₹18,200', 'Meals...............₹4,600'],
  },
  {
    id:          'alerts',
    title:       'Get expiry alerts',
    description: 'WarrantyDeck reminds you 30, 14, and 7 days before a warranty expires — so you never miss a claim window.',
    mockupLabel: 'Expiry Alert',
    mockupIcon:  '◷',
    mockupLines: ['⚠ Expiring soon', '— — — — — — — — — — —', 'Dyson V12 Vacuum', 'Warranty expires in 14 days', 'Tap to view coverage →'],
  },
]

// Features shown in section 2 (after receipt fade)
const FEATURES = [
  { icon: '◈', title: 'Warranty Tracking',    desc: 'Every card, every expiry date. Never miss a claim window.' },
  { icon: '↑', title: 'Receipt Vault',         desc: 'All your receipts, organised, searchable, and permanent.' },
  { icon: '◎', title: 'AI Assistant',          desc: 'Ask anything about your products, warranties, or receipts.' },
  { icon: '◷', title: 'Expiry Alerts',         desc: 'Reminders at 30, 14, and 7 days before warranties expire.' },
  { icon: '♡', title: 'Memorabilia',           desc: 'Save meaningful bills as memories, not just expenses.' },
  { icon: '▦', title: 'Reimbursement Folder',  desc: 'Store and export work or medical receipts in one click.' },
]

// =============================================================================
// INTERSECTION OBSERVER HOOK
// Fires a callback when an element enters the viewport.
// Used for scroll-triggered animations throughout the page.
// =============================================================================

function useInView(options = {}) {
  const ref       = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
        // Once visible, stop observing — animation should only trigger once
        observer.unobserve(el)
      }
    }, { threshold: 0.15, ...options })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, inView]
}

// =============================================================================
// STAT CARD COMPONENT
// Renders one of the three stat rectangles on the left hero side.
// orientation: 'vertical' | 'horizontal-top' | 'horizontal-bottom'
// =============================================================================

function StatCard({ stat, orientation, animDelay = 0 }) {
  const [ref, inView] = useInView()

  const isVertical = orientation === 'vertical'

  return (
    <div
      ref={ref}
      className={`stat-card stat-card--${orientation}`}
      style={{
        opacity:          inView ? 1 : 0,
        transform:        inView ? 'translateY(0)' : 'translateY(16px)',
        transition:       `opacity 0.5s ease ${animDelay}ms, transform 0.5s ease ${animDelay}ms`,
        // Layout
        height:          '100%',
        display:          'flex',
        flexDirection:    'column',
        justifyContent:   'space-between',
        padding:          'var(--space-6)',
        background:       'var(--color-bg-surface)',
        border:           '1px solid var(--color-border-strong)',
        boxShadow:        'var(--shadow-receipt)',
        position:         'relative',
        overflow:         'hidden',
      }}
    >
      {/* Watermark receipt lines — purely decorative */}
      <div style={{
        position:   'absolute',
        top:        0,
        left:       0,
        right:      0,
        bottom:     0,
        opacity:    0.04,
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, var(--color-text-primary) 23px, var(--color-text-primary) 24px)',
        pointerEvents: 'none',
      }} />

      {/* Stat number */}
      <div style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      isVertical ? 'var(--text-6xl)' : 'var(--text-5xl)',
        fontWeight:    '600',
        color:         'var(--color-text-primary)',
        lineHeight:    1,
        letterSpacing: 'var(--tracking-tight)',
        marginBottom:  'var(--space-3)',
      }}>
        {stat.number}
        <span style={{ fontSize: isVertical ? 'var(--text-3xl)' : 'var(--text-2xl)' }}>
          {stat.unit}
        </span>
      </div>

      {/* Perforation divider */}
      <div style={{
        borderTop:    '1px dashed var(--color-border-dashed)',
        marginBottom: 'var(--space-3)',
      }} />

      {/* Label + sublabel — always first after perforation */}
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize:   'var(--text-sm)',
          color:      'var(--color-text-primary)',
          fontWeight: '500',
          marginBottom: 'var(--space-1)',
        }}>
          {stat.label}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize:   'var(--text-sm)',
          color:      'var(--color-text-secondary)',
        }}>
          {stat.sublabel}
        </div>
      </div>

      {/* Spacer — only on vertical card, pushes detail to bottom */}
      {isVertical && <div style={{ flex: 1 }} />}

      {/* Second perforation — only on vertical card, before detail 
      {isVertical && stat.detail && (
        <div style={{
          borderTop:    '1px dashed var(--color-border-dashed)',
          marginBottom: 'var(--space-3)',
        }} />
      )}*/}

      {/* Detail text — vertical card only, sits above the note */}
      {isVertical && stat.detail && (
        <div style={{
          fontFamily:  'var(--font-body)',
          fontSize:    'var(--text-sm)',
          color:       'var(--color-text-secondary)',
          lineHeight:  'var(--leading-relaxed)',
          marginBottom:'var(--space-3)',
        }}>
          {stat.detail}
        </div>
      )}

      {/* Source note — bottom right, very small */}
      <div style={{
        fontFamily:  'var(--font-mono)',
        fontSize:    'var(--text-xs)',
        color:       'var(--color-text-tertiary)',
        marginTop:   'var(--space-4)',
        letterSpacing: 'var(--tracking-wide)',
      }}>
        — {stat.note}
      </div>
    </div>
  )
}

// =============================================================================
// TYPEWRITER HOOK
// Animates text appearing character by character.
// Returns the current displayed string and a boolean for when it's done.
// =============================================================================

function useTypewriter(text, speed = 60, startDelay = 0) {
  const [displayed, setDisplayed] = useState('')
  const [done,      setDone]      = useState(false)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    let i = 0

    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) {
          clearInterval(interval)
          setDone(true)
        }
      }, speed)

      return () => clearInterval(interval)
    }, startDelay)

    return () => clearTimeout(startTimer)
  }, [text, speed, startDelay])

  return [displayed, done]
}

// =============================================================================
// SECTION 1 — HERO
// =============================================================================

function HeroSection({ onSignIn }) {
  const [hookText, hookDone] = useTypewriter(
    "WarrantyDeck will make sure you're not one of them.",
    45,
    600
  )

  return (
    <section style={{
      minHeight:       '100vh',
      display:         'grid',
      // Two equal columns
      gridTemplateColumns: '1fr 1fr',
      backgroundColor: 'var(--color-bg-base)',
    }}>

      {/* ── LEFT HALF — STAT RECTANGLES ─────────────────────────────────── */}
      <div style={{
        padding:  'var(--space-12) var(--space-8) var(--space-12) var(--space-12)',
        display:  'flex',
        alignItems: 'center',
      }}>
        {/*
          Layout: a 2-column grid.
          Left column: one tall vertical card (full height).
          Right column: two stacked cards (top horizontal + bottom rectangle).
        */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows:    '1fr 1fr',
          gap:                 'var(--space-4)',
          width:               '100%',
          height:              '520px',
        }}>

          {/* Vertical receipt card — spans both rows on the left */}
          <div style={{ gridRow: '1 / 3', height: '100%' }}>
            <StatCard
              stat={STATS.returns}
              orientation="vertical"
              animDelay={0}
            />
          </div>

          {/* Top-right — warranty stat */}
          <StatCard
            stat={STATS.warranty}
            orientation="horizontal-top"
            animDelay={150}
          />

          {/* Bottom-right — reimbursement stat */}
          <StatCard
            stat={STATS.reimbursement}
            orientation="horizontal-bottom"
            animDelay={300}
          />

        </div>
      </div>

      {/* ── SEPARATOR ───────────────────────────────────────────────────── */}
      {/*
        Currently: dashed vertical perforation line.
        To switch to a faded grey line, comment out the dashed version
        and uncomment the solid version below.
      */}

      {/* DASHED VERSION (active) */}
      <div style={{
        position:        'absolute',
        left:            '50%',
        top:             'var(--space-12)',
        bottom:          'var(--space-12)',
        width:           '1px',
        // Dashed border via repeating gradient
        backgroundImage: 'repeating-linear-gradient(to bottom, var(--color-border-dashed) 0px, var(--color-border-dashed) 8px, transparent 8px, transparent 16px)',
        transform:       'translateX(-50%)',
        zIndex:          1,
      }} />

      {/*
        FADED GREY LINE VERSION (inactive — swap with above to use):
        <div style={{
          position:        'absolute',
          left:            '50%',
          top:             'var(--space-12)',
          bottom:          'var(--space-12)',
          width:           '1px',
          background:      'linear-gradient(to bottom, transparent, var(--color-border-soft) 20%, var(--color-border-soft) 80%, transparent)',
          transform:       'translateX(-50%)',
          zIndex:          1,
        }} />
      */}

      {/* ── RIGHT HALF — HOOK + AUTH ─────────────────────────────────────── */}
      <div style={{
        padding:        'var(--space-12) var(--space-12) var(--space-12) var(--space-8)',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'center',
        gap:            'var(--space-8)',
      }}>

        {/* Brand name */}
        <div style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      'var(--text-xs)',
          fontWeight:    '500',
          letterSpacing: 'var(--tracking-widest)',
          color:         'var(--color-text-tertiary)',
          textTransform: 'uppercase',
        }}>
          WARRANTYDECK
        </div>

        {/* Hook — typewriter animated */}
        <div>
          <h1 style={{
            fontFamily:   'var(--font-display)',
            fontSize:     'var(--text-4xl)',
            fontWeight:   '600',
            lineHeight:   'var(--leading-tight)',
            color:        'var(--color-text-primary)',
            margin:       0,
            minHeight:    '4.5em', // reserve space so layout doesn't jump
          }}>
            {hookText}
            {/* Blinking cursor — shows while typing, stops after done */}
            <span style={{
              display:          'inline-block',
              width:            '3px',
              height:           '0.85em',
              backgroundColor:  'var(--color-text-primary)',
              marginLeft:       '4px',
              verticalAlign:    'middle',
              animation:        hookDone
                ? 'cursorBlink 530ms steps(1) 3'   // blinks 3 more times then stops
                : 'cursorBlink 530ms steps(1) infinite',
            }} />
          </h1>
        </div>

        {/* Perforation divider */}
        <div style={{
          borderTop: '1px dashed var(--color-border-dashed)',
        }} />

        {/* Auth block */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           'var(--space-3)',
          opacity:       hookDone ? 1 : 0,
          transform:     hookDone ? 'translateY(0)' : 'translateY(8px)',
          transition:    'opacity 0.4s ease, transform 0.4s ease',
        }}>

          {/* Label */}
          <div style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      'var(--text-xs)',
            color:         'var(--color-text-tertiary)',
            letterSpacing: 'var(--tracking-wider)',
            textTransform: 'uppercase',
          }}>
            Get started
          </div>

          {/* Google sign-in button */}
          <button
            onClick={onSignIn}
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             'var(--space-3)',
              padding:         'var(--space-4) var(--space-6)',
              backgroundColor: 'var(--color-accent)',
              color:           'var(--color-text-inverse)',
              border:          'none',
              borderRadius:    'var(--radius-md)',
              fontFamily:      'var(--font-mono)',
              fontSize:        'var(--text-sm)',
              fontWeight:      '500',
              letterSpacing:   'var(--tracking-wide)',
              cursor:          'pointer',
              transition:      'var(--transition-base)',
              width:           '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'var(--color-accent)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {/* Google G icon — inline SVG, no dependency needed */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{
            display:     'flex',
            alignItems:  'center',
            gap:         'var(--space-3)',
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-soft)' }} />
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize:   'var(--text-xs)',
              color:      'var(--color-text-tertiary)',
            }}>
              or
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border-soft)' }} />
          </div>

          {/* Email input — visual only for now, Google OAuth is the primary path */}
          <input
            type="email"
            placeholder="your@email.com"
            style={{
              padding:         'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--color-bg-inset)',
              border:          '1px solid var(--color-border-strong)',
              borderRadius:    'var(--radius-md)',
              fontFamily:      'var(--font-mono)',
              fontSize:        'var(--text-sm)',
              color:           'var(--color-text-primary)',
              outline:         'none',
              transition:      'var(--transition-base)',
              width:           '100%',
              boxSizing:       'border-box',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = 'var(--color-border-focus)'
              e.currentTarget.style.boxShadow   = 'var(--shadow-focus)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = 'var(--color-border-strong)'
              e.currentTarget.style.boxShadow   = 'none'
            }}
          />

          <button
            style={{
              padding:         'var(--space-3) var(--space-6)',
              backgroundColor: 'transparent',
              color:           'var(--color-text-primary)',
              border:          '1px solid var(--color-border-strong)',
              borderRadius:    'var(--radius-md)',
              fontFamily:      'var(--font-mono)',
              fontSize:        'var(--text-sm)',
              letterSpacing:   'var(--tracking-wide)',
              cursor:          'pointer',
              transition:      'var(--transition-base)',
              width:           '100%',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)'
              e.currentTarget.style.borderColor      = 'var(--color-border-focus)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor      = 'var(--color-border-strong)'
            }}
          >
            Register with email →
          </button>

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize:   'var(--text-xs)',
            color:      'var(--color-text-tertiary)',
            margin:     0,
            textAlign:  'center',
          }}>
            Already have an account?{' '}
            <span style={{ color: 'var(--color-text-secondary)', cursor: 'pointer', textDecoration: 'underline' }}>
              Sign in
            </span>
          </p>
        </div>

      </div>
    </section>
  )
}

// =============================================================================
// SECTION 2 — RECEIPT ANIMATION → FEATURES
// On scroll: receipt zooms in → text fades (like thermal paper) → features appear
// =============================================================================

function ReceiptSection() {
  const sectionRef    = useRef(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Track scroll progress through this section (0 = top, 1 = bottom)
  useEffect(() => {
    const handleScroll = () => {
      const el = sectionRef.current
      if (!el) return
      const rect   = el.getBoundingClientRect()
      const total  = el.offsetHeight - window.innerHeight
      const passed = -rect.top
      const progress = Math.min(Math.max(passed / total, 0), 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Phase 0.0 → 0.3: receipt zooms in
  // Phase 0.3 → 0.6: receipt text fades out (thermal paper effect)
  // Phase 0.6 → 1.0: features fade in

  const receiptScale   = 1 + scrollProgress * 0.6          // 1x → 1.6x
  const receiptOpacity = scrollProgress < 0.3
    ? 1
    : Math.max(0, 1 - (scrollProgress - 0.3) / 0.3)        // fades 0.3→0.6
  const textFade       = scrollProgress < 0.35
    ? 1
    : Math.max(0, 1 - (scrollProgress - 0.35) / 0.2)       // text fades slightly earlier
  const featuresOpacity = scrollProgress < 0.6
    ? 0
    : Math.min(1, (scrollProgress - 0.6) / 0.3)            // features appear 0.6→0.9
  const featuresY      = scrollProgress < 0.6
    ? 24
    : Math.max(0, 24 - (scrollProgress - 0.6) / 0.3 * 24)

  // Fake receipt lines for the animation
  const receiptLines = [
    { label: 'RELIANCE DIGITAL', value: '',          bold: true  },
    { label: '────────────────────────────', value: '' },
    { label: 'Samsung 65" QLED TV',  value: '₹89,990' },
    { label: 'Extended Warranty',    value: '₹3,999'  },
    { label: 'HDMI Cable × 2',       value: '₹1,198'  },
    { label: '────────────────────────────', value: '' },
    { label: 'SUBTOTAL',             value: '₹95,187' },
    { label: 'GST (18%)',            value: '₹17,134' },
    { label: '════════════════════════════', value: '' },
    { label: 'TOTAL',                value: '₹1,12,321', bold: true },
    { label: '────────────────────────────', value: '' },
    { label: 'Thank you for shopping!', value: '',    italic: true },
    { label: 'WARRANTY: 24 months',   value: '',      small: true  },
    { label: 'RETURN POLICY: 30 days',value: '',      small: true  },
  ]

  return (
    // Tall section — extra height gives scroll distance for the animation
    <section
      ref={sectionRef}
      style={{
        height:          '300vh',  // 3x viewport height = lots of scroll room
        position:        'relative',
        backgroundColor: 'var(--color-bg-base)',
      }}
    >
      {/* Sticky inner — stays fixed while parent scrolls past */}
      <div style={{
        position:   'sticky',
        top:        0,
        height:     '100vh',
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow:   'hidden',
      }}>

        {/* Scroll hint — fades out as user scrolls */}
        <div style={{
          position:  'absolute',
          bottom:    'var(--space-8)',
          left:      '50%',
          transform: 'translateX(-50%)',
          opacity:   Math.max(0, 1 - scrollProgress * 5),
          fontFamily: 'var(--font-mono)',
          fontSize:  'var(--text-xs)',
          color:     'var(--color-text-tertiary)',
          letterSpacing: 'var(--tracking-wider)',
          display:   'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap:       'var(--space-2)',
        }}>
          <span>You know that receipt you stuffed in your wallet? It's already fading.</span>
          <span style={{ animation: 'cursorBlink 1s steps(1) infinite' }}>↓</span>
        </div>

        {/* ── RECEIPT (zooms in + fades) ─────────────────────────────────── */}
        <div style={{
          position:  'absolute',
          opacity:   receiptOpacity,
          transform: `scale(${receiptScale})`,
          transition: 'none', // raw scroll, no CSS transition
        }}>
          <div style={{
            width:           '280px',
            backgroundColor: 'var(--color-receipt-bg)',
            border:          '1px solid var(--color-border-strong)',
            boxShadow:       'var(--shadow-receipt)',
            padding:         'var(--space-6)',
            fontFamily:      'var(--font-mono)',
          }}>
            {receiptLines.map((line, i) => (
              <div
                key={i}
                style={{
                  display:       'flex',
                  justifyContent: 'space-between',
                  fontSize:      line.small  ? 'var(--text-xs)' : 'var(--text-sm)',
                  fontWeight:    line.bold   ? '600'            : '400',
                  fontStyle:     line.italic ? 'italic'         : 'normal',
                  color:         `rgba(28, 26, 23, ${textFade * (line.small ? 0.5 : 0.85)})`,
                  marginBottom:  'var(--space-1)',
                  // Text fades at different rates per line — simulates uneven thermal fade
                  transition: 'color 0.1s ease',
                }}
              >
                <span>{line.label}</span>
                {line.value && <span>{line.value}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES (appear after receipt fades) ──────────────────────── */}
        <div style={{
          opacity:   featuresOpacity,
          transform: `translateY(${featuresY}px)`,
          transition: 'none',
          width:     '100%',
          maxWidth:  'var(--content-max-width)',
          padding:   '0 var(--space-12)',
        }}>
          {/* Section header */}
          <div style={{
            textAlign:    'center',
            marginBottom: 'var(--space-12)',
          }}>
            <div style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      'var(--text-xs)',
              color:         'var(--color-text-tertiary)',
              letterSpacing: 'var(--tracking-widest)',
              textTransform: 'uppercase',
              marginBottom:  'var(--space-4)',
            }}>
              Everything in one place
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize:   'var(--text-3xl)',
              fontWeight: '600',
              color:      'var(--color-text-primary)',
              margin:     0,
            }}>
              Your receipts, finally organised.
            </h2>
          </div>

          {/* Feature grid — 3 columns */}
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap:                 'var(--space-6)',
          }}>
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                style={{
                  padding:    'var(--space-6)',
                  background: 'var(--color-bg-surface)',
                  border:     '1px solid var(--color-border-soft)',
                  borderRadius: 'var(--radius-md)',
                  opacity:    featuresOpacity,
                  transform:  `translateY(${featuresY + i * 4}px)`,
                }}
              >
                <div style={{
                  fontFamily:   'var(--font-mono)',
                  fontSize:     'var(--text-xl)',
                  marginBottom: 'var(--space-3)',
                  color:        'var(--color-text-secondary)',
                }}>
                  {feature.icon}
                </div>
                <div style={{
                  fontFamily:   'var(--font-mono)',
                  fontSize:     'var(--text-sm)',
                  fontWeight:   '500',
                  color:        'var(--color-text-primary)',
                  marginBottom: 'var(--space-2)',
                  letterSpacing: 'var(--tracking-wide)',
                }}>
                  {feature.title}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize:   'var(--text-sm)',
                  color:      'var(--color-text-secondary)',
                  lineHeight: 'var(--leading-relaxed)',
                }}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

// =============================================================================
// SECTION 3 — HOW-TO GUIDE
// Left: clickable list. Right: animated mockup of that step.
// =============================================================================

function HowToSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [ref, inView] = useInView()

  const step = HOW_TO_STEPS[activeStep]

  return (
    <section
      ref={ref}
      style={{
        backgroundColor: 'var(--color-bg-base)',
        padding:         'var(--space-24) var(--space-12)',
        minHeight:       '100vh',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
      }}
    >
      {/* Section header */}
      <div style={{
        textAlign:    'center',
        marginBottom: 'var(--space-16)',
        opacity:      inView ? 1 : 0,
        transform:    inView ? 'translateY(0)' : 'translateY(16px)',
        transition:   'opacity 0.5s ease, transform 0.5s ease',
      }}>
        <div style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      'var(--text-xs)',
          color:         'var(--color-text-tertiary)',
          letterSpacing: 'var(--tracking-widest)',
          textTransform: 'uppercase',
          marginBottom:  'var(--space-4)',
        }}>
          How it works
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize:   'var(--text-3xl)',
          fontWeight: '600',
          color:      'var(--color-text-primary)',
          margin:     0,
        }}>
          Everything you can do.
        </h2>
      </div>

      {/* Two column layout */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 'var(--space-16)',
        width:               '100%',
        maxWidth:            '960px',
        opacity:             inView ? 1 : 0,
        transform:           inView ? 'translateY(0)' : 'translateY(24px)',
        transition:          'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
      }}>

        {/* ── LEFT: Step list ──────────────────────────────────────────── */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           'var(--space-2)',
        }}>
          {HOW_TO_STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(i)}
              style={{
                display:         'flex',
                alignItems:      'flex-start',
                gap:             'var(--space-4)',
                padding:         'var(--space-4) var(--space-5)',
                background:      activeStep === i ? 'var(--color-bg-elevated)' : 'transparent',
                border:          activeStep === i
                  ? '1px solid var(--color-border-strong)'
                  : '1px solid transparent',
                borderRadius:    'var(--radius-md)',
                cursor:          'pointer',
                textAlign:       'left',
                transition:      'var(--transition-base)',
                width:           '100%',
              }}
              onMouseEnter={e => {
                if (activeStep !== i) {
                  e.currentTarget.style.background   = 'var(--color-bg-surface)'
                  e.currentTarget.style.borderColor  = 'var(--color-border-soft)'
                }
              }}
              onMouseLeave={e => {
                if (activeStep !== i) {
                  e.currentTarget.style.background   = 'transparent'
                  e.currentTarget.style.borderColor  = 'transparent'
                }
              }}
            >
              {/* Step number */}
              <span style={{
                fontFamily:   'var(--font-mono)',
                fontSize:     'var(--text-xs)',
                color:        activeStep === i ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                letterSpacing:'var(--tracking-wider)',
                paddingTop:   '2px',
                minWidth:     '20px',
                transition:   'color 0.2s ease',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>

              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   'var(--text-sm)',
                  fontWeight: '500',
                  color:      activeStep === i ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  marginBottom: activeStep === i ? 'var(--space-1)' : 0,
                  transition: 'color 0.2s ease',
                }}>
                  {s.title}
                </div>
                {/* Description only shows for active step */}
                <div style={{
                  fontFamily:  'var(--font-body)',
                  fontSize:    'var(--text-sm)',
                  color:       'var(--color-text-secondary)',
                  lineHeight:  'var(--leading-relaxed)',
                  maxHeight:   activeStep === i ? '100px' : '0',
                  overflow:    'hidden',
                  opacity:     activeStep === i ? 1 : 0,
                  transition:  'max-height 0.3s ease, opacity 0.3s ease',
                }}>
                  {s.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* ── RIGHT: Mockup ─────────────────────────────────────────────── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          {/*
            Placeholder mockup — swap the inner content with real screenshots later.
            To swap: replace the inner div with an <img src={step.screenshot} />
            and remove the mockup lines rendering.
          */}
          <div
            key={activeStep} // key change forces re-mount = fade-in animation resets
            style={{
              width:           '100%',
              maxWidth:        '380px',
              backgroundColor: 'var(--color-receipt-bg)',
              border:          '1px solid var(--color-border-strong)',
              borderRadius:    'var(--radius-md)',
              boxShadow:       'var(--shadow-receipt)',
              overflow:        'hidden',
              animation:       'fadeInUp 0.3s ease forwards',
            }}
          >
            {/* Mockup header bar */}
            <div style={{
              padding:         'var(--space-3) var(--space-5)',
              backgroundColor: 'var(--color-bg-elevated)',
              borderBottom:    '1px solid var(--color-border-strong)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'space-between',
            }}>
              <span style={{
                fontFamily:    'var(--font-mono)',
                fontSize:      'var(--text-xs)',
                color:         'var(--color-text-tertiary)',
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
              }}>
                {step.mockupLabel}
              </span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-base)' }}>
                {step.mockupIcon}
              </span>
            </div>

            {/* Mockup content lines */}
            <div style={{ padding: 'var(--space-6)' }}>
              {step.mockupLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily:  'var(--font-mono)',
                    fontSize:    'var(--text-sm)',
                    color:       line.startsWith('—') ? 'var(--color-border-dashed)' : 'var(--color-text-secondary)',
                    marginBottom:'var(--space-3)',
                    animation:   `fadeInUp 0.3s ease ${i * 60}ms forwards`,
                    opacity:     0,
                  }}
                >
                  {line}
                </div>
              ))}

              {/* Placeholder image area — swap with real screenshot */}
              <div style={{
                marginTop:       'var(--space-4)',
                height:          '120px',
                backgroundColor: 'var(--color-bg-inset)',
                border:          '1px dashed var(--color-border-dashed)',
                borderRadius:    'var(--radius-sm)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
              }}>
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      'var(--text-xs)',
                  color:         'var(--color-text-tertiary)',
                  letterSpacing: 'var(--tracking-wider)',
                }}>
                  {/* Replace with: <img src={step.screenshot} alt={step.title} /> */}
                  SCREENSHOT PLACEHOLDER
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// =============================================================================
// FOOTER
// =============================================================================

function Footer() {
  return (
    <footer style={{
      backgroundColor: 'var(--color-bg-surface)',
      borderTop:       '1px solid var(--color-border-soft)',
      padding:         'var(--space-8) var(--space-12)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'space-between',
    }}>
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      'var(--text-xs)',
        color:         'var(--color-text-tertiary)',
        letterSpacing: 'var(--tracking-wider)',
      }}>
        WARRANTYDECK
      </span>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize:   'var(--text-xs)',
        color:      'var(--color-text-tertiary)',
      }}>
        Never lose a receipt again.
      </span>
    </footer>
  )
}

// =============================================================================
// MAIN LANDING PAGE
// =============================================================================

export default function Landing() {
  const { signIn } = useAuth()

  return (
    <div style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <HeroSection onSignIn={signIn} />
      <ReceiptSection />
      <HowToSection />
      <Footer />
    </div>
  )
}
