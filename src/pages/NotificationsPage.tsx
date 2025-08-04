import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <NotificationCenter />
    </DashboardLayout>
  );
}