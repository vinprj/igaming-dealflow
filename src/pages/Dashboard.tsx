
import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { 
  Building2, 
  ShoppingCart, 
  MessageSquare, 
  TrendingUp,
  Users,
  FileText
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const isBuyer = profile?.roles.includes("buyer");
  const isSeller = profile?.roles.includes("seller");

  const buyerStats = [
    { name: "Saved Listings", value: "12", icon: Building2, change: "+2 this week" },
    { name: "Active Requests", value: "3", icon: ShoppingCart, change: "2 pending" },
    { name: "Signed NDAs", value: "8", icon: FileText, change: "3 this month" },
  ];

  const sellerStats = [
    { name: "Active Listings", value: "5", icon: TrendingUp, change: "2 pending approval" },
    { name: "Access Requests", value: "24", icon: Users, change: "+8 this week" },
    { name: "Total Views", value: "1,234", icon: Building2, change: "+145 this week" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {profile?.first_name}! Here's what's happening with your account.
          </p>
        </div>

        {isBuyer && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Buyer Activity</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {buyerStats.map((stat) => (
                <Card key={stat.name} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.change}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <stat.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {isSeller && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Seller Activity</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sellerStats.map((stat) => (
                <Card key={stat.name} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.change}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <stat.icon className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">John Smith</p>
                <p className="text-sm text-gray-600">Interested in your casino listing...</p>
              </div>
              <span className="text-xs text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Sarah Johnson</p>
                <p className="text-sm text-gray-600">NDA has been signed for listing #123</p>
              </div>
              <span className="text-xs text-gray-500">1 day ago</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
