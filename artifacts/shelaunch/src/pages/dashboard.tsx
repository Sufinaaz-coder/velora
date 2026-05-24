import { useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Rocket, 
  Megaphone, 
  MessageSquare, 
  Zap,
  Activity,
  TrendingUp,
  Target
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetDashboardAnalytics, useGetRealtimeStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useGetDashboardAnalytics();
  const { data: realtime, isLoading: realtimeLoading } = useGetRealtimeStats({
    query: { refetchInterval: 5000 }
  });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back. Your empire awaits.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: "Total Launches", value: analytics?.totalGenerations, icon: Rocket, color: "text-primary" },
          { title: "Active Campaigns", value: analytics?.totalCampaigns, icon: Megaphone, color: "text-accent" },
          { title: "AI Conversations", value: analytics?.totalConversations, icon: MessageSquare, color: "text-chart-3" },
          { title: "Cache Hit Rate", value: analytics ? `${(analytics.cacheHitRate * 100).toFixed(1)}%` : null, icon: Zap, color: "text-green-500" }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors hover:shadow-[0_0_15px_rgba(139,92,246,0.1)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-3xl font-bold font-mono">{stat.value || 0}</div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Valkey Performance Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Activity size={120} />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-500" />
                Valkey Realtime Performance
                {realtime?.valkeyConnected && (
                  <span className="ml-2 inline-flex h-2 w-2 animate-pulse rounded-full bg-green-500"></span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {realtimeLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Active Users</div>
                    <div className="text-2xl font-mono text-primary">{realtime?.activeUsers || 0}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Cache Hits</div>
                    <div className="text-2xl font-mono text-green-500">{realtime?.cacheHits || 0}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Total Requests</div>
                    <div className="text-2xl font-mono text-accent">{realtime?.totalRequests || 0}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Readiness Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-chart-3" />
                Launch Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              {analyticsLoading ? (
                <Skeleton className="h-32 w-32 rounded-full" />
              ) : (
                <>
                  <div className="relative h-32 w-32 flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-muted" />
                      <circle 
                        cx="64" cy="64" r="56" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="12" 
                        strokeDasharray={351.8} 
                        strokeDashoffset={351.8 - (351.8 * (analytics?.launchReadinessScore || 0)) / 100}
                        className="text-primary transition-all duration-1000 ease-out" 
                      />
                    </svg>
                    <div className="absolute text-3xl font-bold font-mono">
                      {analytics?.launchReadinessScore || 0}%
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">Score based on completed launches, campaigns, and engagement.</p>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
