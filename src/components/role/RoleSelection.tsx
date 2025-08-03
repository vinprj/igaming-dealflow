
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ShoppingCart, Store } from 'lucide-react';

type UserRole = 'buyer' | 'seller' | 'admin';

const roleOptions = [
  {
    id: 'buyer' as UserRole,
    title: 'Buyer',
    description: 'Browse and acquire iGaming assets',
    icon: ShoppingCart,
    features: [
      'Browse verified listings',
      'Access detailed asset information',
      'Secure escrow transactions',
      'Direct seller communication'
    ]
  },
  {
    id: 'seller' as UserRole,
    title: 'Seller',
    description: 'List and sell your iGaming assets',
    icon: Store,
    features: [
      'Create detailed listings',
      'Manage data rooms',
      'Approve buyer access',
      'Track listing performance'
    ]
  }
];

export const RoleSelection = () => {
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const { updateProfile, loading } = useAuth();

  const toggleRole = (roleId: UserRole) => {
    setSelectedRoles(prev => 
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleContinue = async () => {
    if (selectedRoles.length === 0) return;
    
    await updateProfile({ roles: selectedRoles });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Choose Your Role
          </h1>
          <p className="text-muted-foreground">
            Select one or more roles to get started. You can change this later.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRoles.includes(role.id);
            
            return (
              <Card 
                key={role.id}
                className={`cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary bg-accent' : 'hover:shadow-lg'
                }`}
                onClick={() => toggleRole(role.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-xl">{role.title}</CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {role.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={handleContinue}
            disabled={selectedRoles.length === 0 || loading}
          >
            {loading ? 'Setting up...' : `Continue as ${selectedRoles.join(' & ')}`}
          </Button>
          
          {selectedRoles.length > 0 && (
            <div className="mt-4 flex justify-center space-x-2">
              {selectedRoles.map(roleId => (
                <Badge key={roleId} variant="secondary">
                  {roleOptions.find(r => r.id === roleId)?.title}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
