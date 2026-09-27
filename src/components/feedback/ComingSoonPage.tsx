import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

interface ComingSoonPageProps {
  title: string
  description: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={title} />
      <EmptyState title="Not available yet" description={description} />
    </div>
  )
}
