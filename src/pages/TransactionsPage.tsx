
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { EscrowManager } from '@/components/escrow/EscrowManager';
import { DocuSignManager } from '@/components/docusign/DocuSignManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage your escrow payments and document signing
          </p>
        </div>
        
        <Tabs defaultValue="escrow" className="space-y-6">
          <TabsList>
            <TabsTrigger value="escrow">Escrow</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="escrow">
            <EscrowManager />
          </TabsContent>
          
          <TabsContent value="documents">
            <DocuSignManager />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
