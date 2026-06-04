// Public preview of the dashboard UI (no sign-in). Visit /preview/dashboard

import DashboardView from './DashboardView'
import { receipts, warranties, notifications } from '../lib/mockData'

export default function DashboardPreview() {
  return (
    <DashboardView
      preview
      profile={{ first_name: 'Alex' }}
      receipts={receipts}
      warranties={warranties}
      notifications={notifications}
    />
  )
}
