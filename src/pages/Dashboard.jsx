// =============================================================================
// WARRANTYDECK — DASHBOARD (authenticated)
// src/pages/Dashboard.jsx
// =============================================================================

import { useAuth } from '../context/AuthContext'
import { useReceipts } from '../hooks/useReceipts'
import { useWarranties } from '../hooks/useWarranties'
import { useNotifications } from '../hooks/useNotifications'
import DashboardView from './DashboardView'

export default function Dashboard() {
  const { profile, profileSyncError } = useAuth()
  const { receipts, loading: receiptsLoading } = useReceipts()
  const { warranties, loading: warrantiesLoading } = useWarranties()
  const { notifications } = useNotifications()

  return (
    <DashboardView
      profile={profile}
      profileSyncError={profileSyncError}
      receipts={receipts}
      warranties={warranties}
      notifications={notifications}
      receiptsLoading={receiptsLoading}
      warrantiesLoading={warrantiesLoading}
    />
  )
}
