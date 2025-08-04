import { MessageCenter } from '@/components/messaging/MessageCenter';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <MessageCenter />
    </DashboardLayout>
  );
}