'use client';

import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function DataImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 