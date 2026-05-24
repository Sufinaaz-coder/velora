import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListHistory, useDeleteGeneration, getListHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function History() {
  const [filter, setFilter] = useState<string>("all");
  const { data: history, isLoading } = useListHistory();
  const deleteMutation = useDeleteGeneration();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filteredHistory = history?.filter(item => filter === "all" || item.type === filter) || [];

  const handleDelete = (id: number) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Deleted", description: "Item removed from history." });
          queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
        }
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono">Saved Generations</h1>
          <p className="text-muted-foreground mt-2">Your repository of business ideas and campaigns.</p>
        </div>
        
        <div className="flex bg-card border border-border rounded-lg p-1">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter("business")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === "business" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Business Plans
          </button>
          <button 
            onClick={() => setFilter("campaign")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === "campaign" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
          >
            Campaigns
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-card/50 border-border/50 animate-pulse h-48" />
          ))}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-20 bg-card/30 rounded-2xl border border-border/50 border-dashed">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No saved items found</h3>
          <p className="text-muted-foreground">Save generated plans and campaigns to see them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((item, i) => {
            let preview = "";
            try {
              const content = JSON.parse(item.content);
              if (item.type === "business") {
                preview = content.businessNames?.[0] || content.launchStrategy || "Business launch details...";
              } else {
                preview = content.offerIdeas?.[0] || content.captions?.[0] || "Campaign details...";
              }
            } catch {
              preview = item.content.slice(0, 100);
            }

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="bg-card/40 border-border/50 hover:border-primary/40 transition-colors flex flex-col h-full group">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className={
                        item.type === 'business' 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "bg-accent/10 text-accent border-accent/20"
                      }>
                        {item.type}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-1">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {preview}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(item.createdAt), 'MMM d, yyyy • h:mm a')}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
