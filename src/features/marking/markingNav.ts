import {
  AnalyticsIcon,
  AuditIcon,
  DashboardIcon,
  ScriptsIcon,
  SessionsIcon,
  UsersIcon,
} from '@/components/ui/icons'
import type { NavItem } from '@/components/layout/Sidebar'

export const markingNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/marking', icon: DashboardIcon },
  { label: 'Sessions', to: '/marking/sessions', icon: SessionsIcon },
  { label: 'Scripts', to: '/marking/scripts', icon: ScriptsIcon },
  { label: 'Examiners', to: '/marking/examiners', icon: UsersIcon },
  { label: 'Analytics', to: '/marking/analytics', icon: AnalyticsIcon },
  { label: 'Audit Log', to: '/marking/audit', icon: AuditIcon },
]
