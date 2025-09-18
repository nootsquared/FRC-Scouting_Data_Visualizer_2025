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
  Target,
  ClipboardList
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
    href: "/dashboard/match-analysis",
    icon: LayoutDashboard,
  },
  {
    title: "Match Summary",
    href: "/dashboard/match-summary",
    icon: ClipboardList,
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
    <div className="flex min-h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Navigation Sidebar */}
      <div className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-[#0A0A0A] via-[#111111] to-[#0A0A0A] border-r border-gray-700/50 p-6 flex flex-col z-10 shadow-2xl backdrop-blur-sm">
        {/* Logo/Brand */}
        <div className="flex justify-center items-center mb-10">
          <span className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg">Shark Scout</span>
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative overflow-hidden",
                  pathname === item.href
                    ? "text-white bg-gradient-to-r from-white/15 to-white/5 shadow-lg border border-white/20 backdrop-blur-sm"
                    : "text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 hover:shadow-md hover:border hover:border-white/10"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Links */}
        <div className="mt-auto flex justify-center">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 text-sm font-medium group relative overflow-hidden hover:shadow-md hover:border hover:border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Settings size={18} className="relative z-10" />
            <span className="relative z-10">Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 w-0 min-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
} 