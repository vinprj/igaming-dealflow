
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, TrendingUp, Crown } from "lucide-react";

const roles = [
  {
    id: "buyer" as const,
    title: "Buyer",
    description: "Browse and purchase iGaming assets",
    icon: ShoppingCart,
    features: ["Browse listings", "Request access", "Sign NDAs", "Enter escrow"],
  },
  {
    id: "seller" as const,
    title: "Seller", 
    description: "List and sell your iGaming assets",
    icon: TrendingUp,
    features: ["Create listings", "Manage data rooms", "Approve requests", "Enter escrow"],
  },
];

export const RoleSelection: React.FC = () => {
  const [selectedRoles, setSelectedRoles] = useState<("buyer" | "seller")[]>([]);
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useAuth();
  const { toast } = useToast();

  const toggleRole = (role: "buyer" | "seller") => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleContinue = async () => {
    if (selectedRoles.length === 0) {
      toast({
        variant: "destructive",
        title: "Select Role",
        description: "Please select at least one role to continue.",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await updateProfile({ roles: selectedRoles });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your roles have been set successfully.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "An unexpected error occurred.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <Crown className="mx-auto h-12 w-12 text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h1>
          <p className="text-gray-600">Select your role(s) to get started on the marketplace</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg ${
                selectedRoles.includes(role.id)
                  ? "ring-2 ring-blue-500 bg-blue-50"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => toggleRole(role.id)}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-lg ${
                  selectedRoles.includes(role.id)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{role.title}</h3>
                  <p className="text-gray-600">{role.description}</p>
                </div>
              </div>

              <ul className="space-y-2">
                {role.features.map((feature) => (
                  <li key={feature} className="flex items-center text-sm text-gray-600">
                    <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={loading || selectedRoles.length === 0}
            size="lg"
            className="px-8"
          >
            {loading ? "Setting up..." : "Continue"}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            You can add more roles later in your settings
          </p>
        </div>
      </div>
    </div>
  );
};
