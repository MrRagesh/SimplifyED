import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { GraduationCap, Brain, Zap, MessageSquare, ArrowRight } from "lucide-react";
import { Redirect } from "wouter";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/" />;

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-accent/30">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">SimplifyED</span>
        </div>
        <Button onClick={handleLogin} variant="outline" className="rounded-xl border-2 font-semibold">
          Sign In
        </Button>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent-foreground font-semibold text-sm mb-8 animate-in delay-100">
          <Zap className="w-4 h-4 fill-current" />
          <span>AI-Powered Learning Assistant</span>
        </div>
        
        <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-foreground animate-in delay-200">
          Master any topic, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
            simply explained.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 leading-relaxed animate-in delay-300">
          Your personal AI tutor that adapts to your level. From "Explain like I'm 5" to advanced academic breakdowns.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-in delay-300">
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="h-14 px-8 rounded-2xl text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-transform hover:-translate-y-1"
          >
            Start Learning Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Brain,
              title: "Adaptive Learning",
              desc: "Choose your difficulty level. The AI adjusts its explanations to match your current understanding."
            },
            {
              icon: MessageSquare,
              title: "Interactive Chat",
              desc: "Don't just read—ask questions. The AI remembers context and helps you drill down into details."
            },
            {
              icon: Zap,
              title: "Instant Clarity",
              desc: "Get summaries, analogies, and examples instantly. No more digging through 20-page articles."
            }
          ].map((feature, i) => (
            <div key={i} className="bg-card p-8 rounded-3xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-12 mt-12 bg-card">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 SimplifyED. Built for the Hackathon.</p>
        </div>
      </footer>
    </div>
  );
}
