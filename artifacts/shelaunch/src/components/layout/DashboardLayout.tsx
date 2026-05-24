import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
