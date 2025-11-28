import DashboardPageClient from '@/components/Dashboard/DashboardPageClient';
import { getOutputVideos } from '@/services/dashboardServer';

export const metadata = {
  title: 'Dashboard',
  description: 'View final rendered videos from completed jobs on Google Drive.',
};

export default async function DashboardPage() {
  const data = await getOutputVideos();
  return <DashboardPageClient jobs={data.jobs} />;
}
