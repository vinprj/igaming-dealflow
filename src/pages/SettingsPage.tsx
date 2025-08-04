import { SettingsPage as Settings } from '@/components/settings/SettingsPage';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Settings />
    </DashboardLayout>
  );
}