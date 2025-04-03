"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  LineChart, 
  Users, 
  FolderOpen, 
  Database, 
  FileText, 
  FileCode2, 
  Settings, 
  HelpCircle, 
  Plus,
  Target
} from "lucide-react";

const sidebarNavItems = [
  {
    title: "All Teams View",
    href: "/dashboard/all-teams",
    icon: Users,
  },
  {
    title: "Team Analysis",
    href: "/dashboard/team",
    icon: LineChart,
  },
  {
    title: "Match Analysis",
    href: "/dashboard/match",
    icon: LayoutDashboard,
  },
  {
    title: "Targeted Planning",
    href: "/dashboard/targeted-planning",
    icon: Target,
  },
  {
    title: "Data Import",
    href: "/data-import",
    icon: FolderOpen,
  },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Navigation Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-64 bg-[#0A0A0A] border-r border-gray-800 p-6 flex flex-col">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xl font-semibold text-white">Shark Scout</span>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-2">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                  pathname === item.href
                    ? "text-white bg-white/10 shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Links */}
        <div className="mt-auto space-y-2">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {children}
      </div>
    </div>
  );
} 