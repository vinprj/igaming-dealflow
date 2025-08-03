
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  FileText, 
  MessageCircle, 
  Eye,
  Plus,
  Search
} from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();

  const isBuyer = profile?.roles?.includes('buyer');
  const isSeller = profile?.roles?.includes('seller');

  const buyerStats = [
    { title: 'Saved Listings', value: '12', icon: FileText },
    { title: 'Active Negotiations', value: '3', icon: MessageCircle },
    { title: 'NDAs Signed', value: '8', icon: Eye },
  ];

  const sellerStats = [
    { title: 'Active Listings', value: '5', icon: FileText },
    { title: 'Total Views', value: '1,284', icon: Eye },
    { title: 'Access Requests', value: '23', icon: MessageCircle },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {profile?.first_name || 'User'}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your account
            </p>
          </div>
          <div className="flex space-x-2">
            {profile?.roles?.map(role => (
              <Badge key={role} variant="secondary" className="capitalize">
                {role}
              </Badge>
            ))}
          </div>
        </div>

        {isBuyer && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Buyer Dashboard</h2>
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Browse Listings
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {buyerStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Your latest interactions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">NDA signed for "Premium Casino License"</span>
                    <span className="text-xs text-muted-foreground ml-auto">2 hours ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">New message from seller regarding "Sports Betting Platform"</span>
                    <span className="text-xs text-muted-foreground ml-auto">1 day ago</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">Access granted to "European iGaming License"</span>
                    <span className="text-xs text-muted-foreground ml-auto">2 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isSeller && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Seller Dashboard</h2>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Listing
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sellerStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {stat.title}
                      </CardTitle>
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Listings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Premium Casino License</p>
                        <p className="text-sm text-muted-foreground">€2.5M</p>
                      </div>
                      <Badge variant="outline">Live</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Sports Betting Platform</p>
                        <p className="text-sm text-muted-foreground">€1.8M</p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">5 new access requests</span>
                      <Button variant="outline" size="sm">Review</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">2 unread messages</span>
                      <Button variant="outline" size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
