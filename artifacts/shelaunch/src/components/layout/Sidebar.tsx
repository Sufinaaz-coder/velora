import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Rocket, 
  Megaphone, 
  MessageSquare, 
  History, 
  TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/launch", label: "Business Launch", icon: Rocket },
  { href: "/campaign", label: "Campaigns", icon: Megaphone },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/history", label: "History", icon: History },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-sidebar px-4 py-6 text-sidebar-foreground">
      <Link href="/">
        <div className="flex items-center gap-3 px-2 mb-8 cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
            S
          </div>
          <span className="text-xl font-bold font-mono tracking-tight">SheLaunch<span className="text-primary">.ai</span></span>
        </div>
      </Link>

      <nav className="flex-1 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/10 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]" 
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <item.icon className="h-5 w-5" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 p-4 border border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Rocket size={48} />
          </div>
          <h4 className="text-sm font-semibold mb-1 relative z-10 text-foreground">Pro Plan</h4>
          <p className="text-xs text-muted-foreground mb-3 relative z-10">Unleash your full potential.</p>
          <Button size="sm" className="w-full relative z-10 shadow-[0_0_15px_rgba(139,92,246,0.5)]">Upgrade</Button>
        </div>
      </div>
    </div>
  );
}
