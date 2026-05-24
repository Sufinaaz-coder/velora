import { useState } from "react";
import { motion } from "framer-motion";
import { Megaphone, Sparkles, Copy, Save, RefreshCw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGenerateCampaign, useSaveGeneration } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CampaignInputTone } from "@workspace/api-client-react/src/generated/api.schemas";

const FESTIVALS = ["Diwali", "Eid", "Ramadan", "Women's Day", "Raksha Bandhan", "New Year", "Seasonal Sale", "Dussehra", "Holi"];
const TONES = ["luxury", "minimal", "cute", "bold"] as CampaignInputTone[];

export default function CampaignGenerator() {
  const [festival, setFestival] = useState<string>("Diwali");
  const [tone, setTone] = useState<CampaignInputTone>("luxury");
  const [context, setContext] = useState("");
  const { toast } = useToast();
  
  const generateMutation = useGenerateCampaign();
  const saveMutation = useSaveGeneration();

  const handleGenerate = () => {
    generateMutation.mutate({ data: { festival, tone, businessContext: context } });
  };

  const handleSave = () => {
    if (!generateMutation.data) return;
    
    saveMutation.mutate(
      { 
        data: { 
          title: `${festival} Campaign - ${tone}`,
          type: "campaign",
          content: JSON.stringify(generateMutation.data)
        } 
      },
      {
        onSuccess: () => {
          toast({ title: "Saved successfully", description: "Your campaign has been saved to history." });
        }
      }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Copied to clipboard." });
  };

  const renderSection = (title: string, content: string | string[], delay: number) => {
    if (!content || (Array.isArray(content) && content.length === 0)) return null;
    
    const textContent = Array.isArray(content) ? content.join('\n• ') : content;
    const displayContent = Array.isArray(content) ? (
      <ul className="list-disc pl-5 space-y-1">
        {content.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    ) : (
      <p className="whitespace-pre-wrap">{content}</p>
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
      >
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm h-full flex flex-col group hover:border-accent/30 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-accent">{title}</CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(Array.isArray(content) ? `• ${textContent}` : textContent)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="text-muted-foreground flex-1">
            {displayContent}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-mono">Festival Campaigns</h1>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">Marketing Engine</Badge>
          </div>
          <p className="text-muted-foreground">Generate high-converting seasonal marketing campaigns instantly.</p>
        </div>

        <Card className="bg-card/50 border-border/50 backdrop-blur-md mb-8 shadow-[0_0_30px_rgba(236,72,153,0.05)]">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Festival/Event</label>
                <Select value={festival} onValueChange={setFestival}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select festival" />
                  </SelectTrigger>
                  <SelectContent>
                    {FESTIVALS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Tone</label>
                <Select value={tone} onValueChange={(v) => setTone(v as CampaignInputTone)}>
                  <SelectTrigger className="bg-background/50 capitalize">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TONES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <label className="text-sm font-medium">Business Context (Optional)</label>
              <Textarea 
                placeholder="What products are you highlighting? Any specific discounts?"
                className="bg-background/50 border-border/50 focus-visible:ring-accent/50 resize-none"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending}
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_0_15px_rgba(236,72,153,0.4)]"
              >
                {generateMutation.isPending ? (
                  <>Generating <Sparkles className="ml-2 h-4 w-4 animate-spin" /></>
                ) : (
                  <>Generate Campaign <Megaphone className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {generateMutation.isPending && (
          <div className="space-y-6">
            <div className="flex items-center justify-center p-8">
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-accent flex flex-col items-center gap-4"
              >
                <Sparkles className="h-8 w-8" />
                <span className="font-mono text-sm">Crafting marketing copy...</span>
              </motion.div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <Card key={i} className="bg-card/30 border-border/30">
                  <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                  <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {generateMutation.data && !generateMutation.isPending && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold font-mono">{festival} Campaign</h2>
                {generateMutation.data.fromCache && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-mono text-xs">
                    ⚡ Served instantly from Valkey cache
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" /> Save
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSection("Offer Ideas", generateMutation.data.offerIdeas, 0.1)}
              {renderSection("Reel Ideas", generateMutation.data.reelIdeas, 0.2)}
              {renderSection("Instagram Captions", generateMutation.data.captions, 0.3)}
              {renderSection("WhatsApp Promos", generateMutation.data.whatsappPromos, 0.4)}
              {renderSection("Poster Text", generateMutation.data.posterText, 0.5)}
              {renderSection("Call to Actions", generateMutation.data.ctaCopy, 0.6)}
              {renderSection("Hashtags", generateMutation.data.hashtags, 0.7)}
            </div>
            
            <div className="mt-6">
              {renderSection("Email Campaign", generateMutation.data.emailCampaign, 0.8)}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
