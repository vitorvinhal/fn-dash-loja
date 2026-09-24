"use client";

import { useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const KPICards = lazy(() => import("@/components/dashboard/kpi-cards").then(m => ({ default: m.KPICards })));
const SalesCharts = lazy(() => import("@/components/dashboard/sales-charts").then(m => ({ default: m.SalesCharts })));
const RecentSales = lazy(() => import("@/components/dashboard/recent-sales").then(m => ({ default: m.RecentSales })));

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-3xl bg-secondary/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 rounded-3xl bg-secondary/50" />
        <div className="h-80 rounded-3xl bg-secondary/50" />
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--ring)]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-6" style={{ marginLeft: "var(--sidebar-width, 260px)" }}>
        <TopBar />
        <div className="p-4 md:p-6 space-y-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl font-bold text-foreground mb-1">Visão Geral</h1>
            <p className="text-muted-foreground text-sm">Acompanhe seu negócio em tempo real</p>
          </motion.div>
          <Suspense fallback={<DashboardSkeleton />}>
            <KPICards />
            <SalesCharts />
            <RecentSales />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
