import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Plus, Settings, Github, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/', label: 'Projects', icon: LayoutDashboard },
    { href: '/new', label: 'New Project', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-background flex font-sans antialiased text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-full transition-all duration-300 z-20">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <div className="h-8 w-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-sm">
              <span className="font-mono font-bold">CI</span>
            </div>
            <span>GitTEB</span>
          </Link>
        </div>
        
        <ScrollArea className="flex-1 py-4">
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block"
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 mb-1 font-normal",
                      isActive && "bg-secondary text-secondary-foreground font-medium shadow-sm"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="p-4 mt-auto border-t border-border bg-muted/20">
          {user && (
            <div className="flex items-center gap-3 mb-4 px-2">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="h-8 w-8 rounded-full border border-border" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center border border-border">
                  <span className="font-bold text-xs">{user.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={logout} title="Logout">
                <LogOut size={16} />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-3 px-2 py-2 text-xs font-medium text-muted-foreground border-t border-border/50 pt-3">
            <Settings size={16} />
            <span>v1.0.0-beta</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col bg-muted/10">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-8 flex items-center justify-between sticky top-0 z-10">
           <div className="flex items-center text-sm text-muted-foreground">
             <span className="font-medium text-foreground">Workspace</span>
             <span className="mx-2 text-muted-foreground/50">/</span>
             <span>default</span>
           </div>
           
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
                <a href="https://github.com/Soif2Sang/imt-cloud-CI-CD-backend" target="_blank" rel="noopener noreferrer">
                    <Github className="h-5 w-5" />
                </a>
             </Button>
           </div>
        </header>

        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}