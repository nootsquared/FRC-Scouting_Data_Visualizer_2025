"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  LineChart,
  Users,
  FolderOpen,
  Settings,
  Target,
  ClipboardList,
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
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const activeIndex = sidebarNavItems.findIndex((item) => item.href === pathname);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [highlightStyle, setHighlightStyle] = useState<{ top: number; height: number; visible: boolean }>({
    top: 0,
    height: 0,
    visible: false,
  });

  const updateHighlight = (index: number | null) => {
    const navEl = navRef.current;
    if (!navEl) return;

    if (index === null || !linkRefs.current[index]) {
      setHighlightStyle((prev) => ({ ...prev, visible: false }));
      return;
    }

    const linkEl = linkRefs.current[index];
    if (!linkEl) return;

    const navRect = navEl.getBoundingClientRect();
    const linkRect = linkEl.getBoundingClientRect();

    setHighlightStyle({
      top: linkRect.top - navRect.top,
      height: linkRect.height,
      visible: true,
    });
  };

  const resolveTargetIndex = () => {
    if (hoverIndex !== null) return hoverIndex;
    if (activeIndex >= 0) return activeIndex;
    return null;
  };

  useLayoutEffect(() => {
    const targetIndex = resolveTargetIndex();
    updateHighlight(targetIndex);
  }, [hoverIndex, activeIndex]);

  useLayoutEffect(() => {
    const handleResize = () => {
      const targetIndex = resolveTargetIndex();
      updateHighlight(targetIndex);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hoverIndex, activeIndex]);

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] overflow-hidden">
      <div className="fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-[#0A0A0A] via-[#111111] to-[#0A0A0A] border-r border-gray-700/50 p-6 flex flex-col z-10 shadow-2xl backdrop-blur-sm">
        <div className="flex justify-center items-center mb-10">
          <span className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent drop-shadow-lg">Shark Scout</span>
        </div>

        <nav
          className="relative"
          ref={navRef}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <div
            className={cn(
              "pointer-events-none absolute rounded-xl bg-gradient-to-r from-white/14 via-white/10 to-white/6 border border-white/15 shadow-lg transition-all duration-300 ease-out will-change-transform",
              highlightStyle.visible ? "opacity-100" : "opacity-0"
            )}
            style={{
              left: "6px",
              right: "6px",
              top: 0,
              transform: `translateY(${highlightStyle.top}px)`,
              height: highlightStyle.height || 0,
            }}
          />
          <div className="flex flex-col gap-2">
            {sidebarNavItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const isHovered = hoverIndex === index;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => {
                    linkRefs.current[index] = el;
                  }}
                  onMouseEnter={() => setHoverIndex(index)}
                  onFocus={() => setHoverIndex(index)}
                  className={cn(
                    "relative z-10 flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium",
                    isActive || isHovered ? "text-white" : "text-gray-400"
                  )}
                >
                  <Icon
                    size={18}
                    className={cn(
                      "transition-transform duration-300",
                      isActive || isHovered ? "scale-105" : "scale-100"
                    )}
                  />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto flex justify-center">
          <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white rounded-xl hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 text-sm font-medium group relative overflow-hidden hover:shadow-md hover:border hover:border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <Settings size={18} className="relative z-10" />
            <span className="relative z-10">Settings</span>
          </Link>
        </div>
      </div>

      <div className="flex-1 ml-64 w-0 min-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
} 
