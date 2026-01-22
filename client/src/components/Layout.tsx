import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LayoutDashboard, LogOut, BookOpen, GraduationCap, Menu } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 border-r border-border bg-card p-6 fixed h-full z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-foreground">
            SimplifyED
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/" className={`
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
            ${location === "/"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"}
          `}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          <div className="pt-4 mt-4 border-t border-border">
            <div className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Your Account
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground font-bold">
                {user?.firstName?.[0] || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.firstName || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => logout()}
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </Button>
          </div>
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <div className="flex flex-col h-full bg-card p-6">
                <div className="flex items-center gap-3 mb-10 px-2">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <GraduationCap className="w-8 h-8 text-primary" />
                  </div>
                  <span className="font-display font-bold text-2xl tracking-tight text-foreground">
                    SimplifyED
                  </span>
                </div>

                <nav className="flex-1 space-y-2">
                  <Link href="/" className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium
                    ${location === "/"
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                  `}>
                    <LayoutDashboard className="w-5 h-5" />
                    Dashboard
                  </Link>

                  <div className="pt-4 mt-4 border-t border-border">
                    <div className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Your Account
                    </div>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground font-bold">
                        {user?.firstName?.[0] || "U"}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{user?.firstName || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 px-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => logout()}
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </Button>
                  </div>
                </nav>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl">SimplifyED</span>
          </div>
        </div>

        <Button size="icon" variant="ghost" onClick={() => logout()}>
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
