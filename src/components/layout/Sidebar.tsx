
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Search, 
  FileText, 
  MessageCircle, 
  Settings,
  PlusCircle,
  BarChart
} from 'lucide-react';

type UserRole = 'buyer' | 'seller' | 'admin';

const navigationItems = [
  { 
    name: 'Dashboard', 
    icon: Home, 
    href: '/dashboard',
    roles: ['buyer', 'seller', 'admin'] as UserRole[]
  },
  { 
    name: 'Browse Listings', 
    icon: Search, 
    href: '/browse',
    roles: ['buyer'] as UserRole[]
  },
  { 
    name: 'Create Listing', 
    icon: PlusCircle, 
    href: '/create-listing',
    roles: ['seller'] as UserRole[]
  },
  { 
    name: 'My Listings', 
    icon: FileText, 
    href: '/my-listings',
    roles: ['seller'] as UserRole[]
  },
  { 
    name: 'Messages', 
    icon: MessageCircle, 
    href: '/messages',
    roles: ['buyer', 'seller'] as UserRole[]
  },
  { 
    name: 'Analytics', 
    icon: BarChart, 
    href: '/analytics',
    roles: ['admin'] as UserRole[]
  },
  { 
    name: 'Settings', 
    icon: Settings, 
    href: '/settings',
    roles: ['buyer', 'seller', 'admin'] as UserRole[]
  },
];

export const Sidebar = () => {
  const { profile } = useAuth();
  const currentPath = '/dashboard'; // This would normally come from router

  const filteredItems = navigationItems.filter(item => 
    item.roles.some(role => profile?.roles?.includes(role))
  );

  return (
    <aside className="w-64 bg-card border-r border-border">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            
            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};
