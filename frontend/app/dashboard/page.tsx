import DashboardPageClient from '@/components/Dashboard/DashboardPageClient';

export const metadata = {
  title: 'Dashboard',
  description: 'View final rendered videos from completed jobs on Google Drive.',
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
