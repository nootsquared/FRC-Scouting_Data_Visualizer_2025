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
  Plus
} from "lucide-react";

const sidebarNavItems = [
  {
    title: "All Teams View",
    href: "/dashboard/all-teams",
    icon: LayoutDashboard,
  },
  {
    title: "Match Analysis",
    href: "/dashboard/match",
    icon: LineChart,
  },
  {
    title: "Team Analysis",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Data Import",
    href: "/dashboard/import",
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
      <div className="w-64 bg-[#0A0A0A] border-r border-gray-800 p-6 flex flex-col">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xl font-semibold text-white">Shark Scout</span>
        </div>

        {/* Quick Create Button */}
        <button className="flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
          <Plus size={20} />
          <span>Quick Create</span>
        </button>

        {/* Main Navigation */}
        <nav className="space-y-1 mb-8">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  pathname === item.href
                    ? "text-white bg-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon size={20} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Documents Section */}
        <div className="mb-8">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-2 px-3">Documents</h3>
          <nav className="space-y-1">
            <Link href="/dashboard/library" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <Database size={20} />
              <span>Data Library</span>
            </Link>
            <Link href="/dashboard/reports" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <FileText size={20} />
              <span>Reports</span>
            </Link>
            <Link href="/dashboard/match-assistant" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
              <FileCode2 size={20} />
              <span>Match Assistant</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Links */}
        <div className="mt-auto space-y-1">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
          <Link href="/dashboard/help" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <HelpCircle size={20} />
            <span>Help</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
} 