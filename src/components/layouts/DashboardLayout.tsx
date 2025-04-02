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
      <div className="fixed top-0 left-0 h-screen w-64 bg-[#0A0A0A] border-r border-gray-800 p-6 flex flex-col">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xl font-semibold text-white">Shark Scout</span>
        </div>

        {/* Quick Create Button */}
        <button className="flex items-center gap-2 px-4 py-2 mb-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
          <Plus size={20} />
          <span>Quick Create</span>
        </button>

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

        {/* Documents Section */}
        <div className="mt-8">
          <h3 className="text-xs uppercase text-gray-500 font-semibold mb-3 px-4">Documents</h3>
          <nav className="space-y-2">
            <Link href="/dashboard/library" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200">
              <Database size={20} />
              <span className="font-medium">Data Library</span>
            </Link>
            <Link href="/dashboard/reports" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200">
              <FileText size={20} />
              <span className="font-medium">Reports</span>
            </Link>
            <Link href="/dashboard/match-assistant" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200">
              <FileCode2 size={20} />
              <span className="font-medium">Match Assistant</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Links */}
        <div className="mt-auto space-y-2">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200">
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </Link>
          <Link href="/dashboard/help" className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200">
            <HelpCircle size={20} />
            <span className="font-medium">Help</span>
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