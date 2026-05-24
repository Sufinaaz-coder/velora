import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListConversations, useCreateConversation, useGetConversation, getGetConversationQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Plus, BrainCircuit, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface ChatMessage {
  id: number | string;
  role: string;
  content: string;
}

export default function Assistant() {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations } = useListConversations();
  const createMutation = useCreateConversation();
  
  const { data: activeConversation } = useGetConversation(activeId || 0, {
    query: { enabled: !!activeId }
  });

  const allMessages: ChatMessage[] = [
    ...(activeConversation?.messages || []),
    ...(isStreaming ? [{ id: 'stream', role: 'assistant', content: streamingMessage }] : [])
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages.length, streamingMessage]);

  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const handleNewChat = () => {
    createMutation.mutate(
      { data: { title: "New Conversation" } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ["/api/ai/conversations"] });
          setActiveId(data.id);
        }
      }
    );
  };

  const handleSend = async () => {
    if (!input.trim() || !activeId || isStreaming) return;
    
    const userMsg = input;
    setInput("");
    setIsStreaming(true);
    setStreamingMessage("");

    // Optimistically add user message to cache
    queryClient.setQueryData(getGetConversationQueryKey(activeId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [...old.messages, { id: Date.now(), role: 'user', content: userMsg, createdAt: new Date().toISOString() }]
      };
    });

    try {
      const response = await fetch(`/api/ai/conversations/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg })
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                // Done streaming
              } else if (data.content) {
                setStreamingMessage(prev => prev + data.content);
              }
            } catch (e) {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(activeId) });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8rem)] bg-card/30 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm">
        {/* Sidebar */}
        <div className="w-64 border-r border-border/50 bg-background/50 flex flex-col">
          <div className="p-4 border-b border-border/50">
            <Button onClick={handleNewChat} className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30">
              <Plus className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors flex items-center gap-2",
                    activeId === conv.id 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span className="truncate">{conv.title}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-background/50">
            <h2 className="font-semibold font-mono">{activeConversation?.title || "AI Assistant"}</h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1.5">
              <BrainCircuit className="h-3.5 w-3.5" /> Valkey session memory active
            </Badge>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {allMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <BrainCircuit className="h-12 w-12 mb-4 opacity-20" />
                <p>Start a conversation. Context is remembered across the session.</p>
              </div>
            ) : (
              allMessages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-5 py-3.5",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-br-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                      : "bg-secondary text-secondary-foreground rounded-bl-sm border border-border/50"
                  )}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border/50">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative max-w-4xl mx-auto"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your business assistant..."
                className="pr-12 h-14 bg-card border-border/50 focus-visible:ring-primary/50 text-base"
                disabled={!activeId || isStreaming}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || !activeId || isStreaming}
                className="absolute right-2 top-2 h-10 w-10 bg-primary/20 text-primary hover:bg-primary hover:text-white transition-colors"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
