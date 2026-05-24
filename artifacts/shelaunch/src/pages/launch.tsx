import { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Sparkles, Copy, Save, RefreshCw, Check } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGenerateBusinessLaunch, useSaveGeneration } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function BusinessLaunch() {
  const [idea, setIdea] = useState("");
  const { toast } = useToast();
  
  const generateMutation = useGenerateBusinessLaunch();
  const saveMutation = useSaveGeneration();

  const handleGenerate = () => {
    if (!idea.trim()) return;
    generateMutation.mutate({ data: { businessIdea: idea } });
  };

  const handleSave = () => {
    if (!generateMutation.data) return;
    
    saveMutation.mutate(
      { 
        data: { 
          title: generateMutation.data.businessNames[0] || idea.slice(0, 20),
          type: "business",
          content: JSON.stringify(generateMutation.data)
        } 
      },
      {
        onSuccess: () => {
          toast({ title: "Saved successfully", description: "Your business plan has been saved to history." });
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
        <Card className="bg-card/40 border-border/50 backdrop-blur-sm h-full flex flex-col group hover:border-primary/30 transition-colors">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-primary">{title}</CardTitle>
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
            <h1 className="text-3xl font-bold font-mono">Business Launch</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">AI Generator</Badge>
          </div>
          <p className="text-muted-foreground">Describe your business idea, and we'll generate everything you need to launch.</p>
        </div>

        <Card className="bg-card/50 border-border/50 backdrop-blur-md mb-8 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
          <CardContent className="pt-6">
            <Textarea 
              placeholder="e.g. A premium sustainable activewear brand for modern working women in urban India..."
              className="min-h-[120px] bg-background/50 border-border/50 text-lg focus-visible:ring-primary/50 resize-none mb-4"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">The more details you provide, the better the results.</p>
              <Button 
                onClick={handleGenerate} 
                disabled={generateMutation.isPending || !idea.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(139,92,246,0.4)]"
              >
                {generateMutation.isPending ? (
                  <>Processing <Sparkles className="ml-2 h-4 w-4 animate-spin" /></>
                ) : (
                  <>Generate Launch Plan <Rocket className="ml-2 h-4 w-4" /></>
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
                className="text-primary flex flex-col items-center gap-4"
              >
                <Sparkles className="h-8 w-8" />
                <span className="font-mono text-sm">Valkey AI Engine processing...</span>
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
                <h2 className="text-xl font-semibold font-mono">Your Launch Plan</h2>
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
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSection("Business Names", generateMutation.data.businessNames, 0.1)}
              {renderSection("Slogans", generateMutation.data.slogans, 0.2)}
              {renderSection("Target Audience", generateMutation.data.targetAudience, 0.3)}
              {renderSection("Brand Voice", generateMutation.data.brandVoice, 0.4)}
              {renderSection("Instagram Bio", generateMutation.data.instagramBio, 0.5)}
              {renderSection("WhatsApp Description", generateMutation.data.whatsappDescription, 0.6)}
              {renderSection("Product Ideas", generateMutation.data.productIdeas, 0.7)}
              {renderSection("Pricing Strategy", generateMutation.data.pricingSuggestions, 0.8)}
              {renderSection("Marketing Captions", generateMutation.data.marketingCaptions, 0.9)}
              {renderSection("Hashtags", generateMutation.data.hashtags, 1.0)}
              {renderSection("SEO Keywords", generateMutation.data.seoKeywords, 1.1)}
              {renderSection("Packaging Ideas", generateMutation.data.packagingSuggestions, 1.2)}
            </div>
            
            <div className="mt-6">
              {renderSection("Launch Strategy", generateMutation.data.launchStrategy, 1.3)}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
