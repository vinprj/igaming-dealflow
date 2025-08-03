
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Building2, 
  ShoppingCart, 
  MessageSquare, 
  FileText, 
  Settings,
  X,
  TrendingUp,
  Users
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home, roles: ["buyer", "seller"] },
  { name: "Browse Listings", href: "/browse", icon: Building2, roles: ["buyer"] },
  { name: "My Listings", href: "/listings", icon: TrendingUp, roles: ["seller"] },
  { name: "Access Requests", href: "/access-requests", icon: Users, roles: ["seller"] },
  { name: "My Requests", href: "/my-requests", icon: ShoppingCart, roles: ["buyer"] },
  { name: "Messages", href: "/messages", icon: MessageSquare, roles: ["buyer", "seller"] },
  { name: "Documents", href: "/documents", icon: FileText, roles: ["buyer", "seller"] },
  { name: "Settings", href: "/settings", icon: Settings, roles: ["buyer", "seller"] },
];

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const { profile } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    item.roles.some(role => profile?.roles.includes(role as any))
  );

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
      <div className="flex h-16 shrink-0 items-center">
        <h1 className="text-xl font-bold text-gray-900">iGaming M&A</h1>
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {filteredNavigation.map((item) => (
                <li key={item.name}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-x-3 px-2 py-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50"
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Button>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>

      <div className="mt-auto">
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex items-center gap-x-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {profile?.first_name?.[0]}{profile?.last_name?.[0]}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-gray-500">
                {profile?.roles.join(", ") || "User"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-xs w-full">
          <div className="relative flex w-full max-w-xs flex-1 flex-col">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full"
              >
                <X className="h-6 w-6 text-white" />
              </Button>
            </div>
            <SidebarContent />
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};
