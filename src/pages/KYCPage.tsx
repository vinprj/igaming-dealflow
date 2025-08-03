
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { KYCUpload } from '@/components/kyc/KYCUpload';

export default function KYCPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KYC Verification</h1>
          <p className="text-muted-foreground">
            Complete your identity verification to access all platform features
          </p>
        </div>
        
        <KYCUpload />
      </div>
    </DashboardLayout>
  );
}
