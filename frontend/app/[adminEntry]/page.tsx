import { notFound } from 'next/navigation'
import { AdminDashboard } from '../../components/admin/AdminDashboard'
import { adminRouteSegmentFromPrefix, resolveAdminRoutePrefix } from '../../lib/adminRoute'

type AdminEntryPageProps = {
  params: {
    adminEntry: string
  }
}

export default function AdminEntryPage({ params }: AdminEntryPageProps) {
  const adminRoutePrefix = resolveAdminRoutePrefix()
  const expectedSegment = adminRouteSegmentFromPrefix(adminRoutePrefix)
  if (params.adminEntry !== expectedSegment) notFound()
  return <AdminDashboard adminRoutePrefix={adminRoutePrefix} />
}
