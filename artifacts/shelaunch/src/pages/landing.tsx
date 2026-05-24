import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Sparkles, Rocket, Zap, Heart, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-border/50 bg-background/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
            S
          </div>
          <span className="text-xl font-bold font-mono tracking-tight">SheLaunch<span className="text-primary">.ai</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#technology" className="hover:text-foreground transition-colors">Technology</a>
          <a href="#impact" className="hover:text-foreground transition-colors">Impact</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">Log in</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-shadow">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center text-center">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-8"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          <span>Powered by Valkey Realtime Intelligence</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter max-w-5xl leading-[1.1] mb-6 font-mono"
        >
          Launch Your Dream Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-chart-3">with AI</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10"
        >
          AI-powered business growth platform for India's next generation of women entrepreneurs. Fast, intelligent, and built for scale.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-8 text-lg shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] hover:scale-105 transition-all">
              Launch Now <Rocket className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Feature Showcase */}
      <section id="features" className="py-24 px-6 bg-card/50 border-y border-border">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Rocket,
                title: "Instant Business Plans",
                description: "Generate comprehensive business strategies, from branding to marketing, in milliseconds.",
                color: "text-primary"
              },
              {
                icon: Zap,
                title: "Realtime Analytics",
                description: "Monitor trending niches and market demands live, powered by Valkey architecture.",
                color: "text-accent"
              },
              {
                icon: Heart,
                title: "Built for Women",
                description: "Context-aware AI that understands the unique challenges and opportunities in the Indian market.",
                color: "text-chart-3"
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 rounded-2xl bg-background border border-border hover:border-primary/50 transition-colors"
              >
                <div className={`h-12 w-12 rounded-xl bg-card border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Call to action */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-mono">Ready to command your future?</h2>
          <p className="text-xl text-muted-foreground mb-10">Join thousands of ambitious women building the next generation of startups.</p>
          <Link href="/dashboard">
            <Button size="lg" className="h-14 px-10 text-lg shadow-[0_0_30px_rgba(236,72,153,0.4)] hover:shadow-[0_0_40px_rgba(236,72,153,0.6)] hover:scale-105 transition-all bg-accent text-accent-foreground">
              Enter Dashboard <Activity className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} SheLaunch.ai. Powered by Valkey Realtime Intelligence.</p>
      </footer>
    </div>
  );
}
