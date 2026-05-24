import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetTrending } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Activity, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function Trending() {
  const { data: trending, isLoading } = useGetTrending({
    query: { refetchInterval: 10000 } // Auto refresh every 10s
  });

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-mono">Live Market Trends</h1>
            <p className="text-muted-foreground mt-2">Realtime demand analysis for the Indian market.</p>
          </div>
          <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30 gap-2 py-1.5 px-3">
            <Activity className="h-4 w-4" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-3 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-chart-3"></span>
            </span>
            Live
          </Badge>
        </div>

        <div className="bg-gradient-to-r from-chart-3/10 via-transparent to-transparent rounded-2xl p-6 border border-chart-3/20 mb-8 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-chart-3/20 flex items-center justify-center text-chart-3">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Powered by Valkey Realtime Analytics</h3>
            <p className="text-sm text-muted-foreground">Monitoring thousands of market signals across India to identify high-potential business opportunities.</p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            // Skeletons
            [1,2,3,4,5].map(i => (
              <div key={i} className="h-20 bg-card/30 rounded-xl border border-border/50 animate-pulse" />
            ))
          ) : (
            <AnimatePresence>
              {trending?.map((niche, index) => (
                <motion.div
                  key={niche.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="flex items-center justify-between p-4 bg-card/40 border-border/50 hover:bg-card/60 transition-colors backdrop-blur-sm group">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center text-2xl border border-border group-hover:scale-110 transition-transform shadow-sm">
                        {niche.emoji}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{niche.name}</h3>
                        <p className="text-sm text-muted-foreground">Market interest score: {niche.count.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className={`flex items-center gap-1.5 font-medium px-3 py-1 rounded-full text-sm
                        ${niche.trend === 'up' ? 'text-green-500 bg-green-500/10' : 
                          niche.trend === 'down' ? 'text-destructive bg-destructive/10' : 
                          'text-muted-foreground bg-muted'}`}
                      >
                        {niche.trend === 'up' && <TrendingUp className="h-4 w-4" />}
                        {niche.trend === 'down' && <TrendingDown className="h-4 w-4" />}
                        {niche.trend === 'stable' && <Minus className="h-4 w-4" />}
                        <span className="capitalize">{niche.trend}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
