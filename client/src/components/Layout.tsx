import { NavLink } from 'react-router-dom';
import { Home, Heart, Clock, Settings } from 'lucide-react';
import { ROUTE_PATHS } from '@/lib/index';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navItems = [
    { path: ROUTE_PATHS.HOME, icon: Home, label: 'Home' },
    { path: ROUTE_PATHS.SCAN_SELECT, icon: Heart, label: 'Scan' },
    { path: ROUTE_PATHS.HISTORY, icon: Clock, label: 'History' },
    { path: ROUTE_PATHS.SETTINGS, icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto pb-20">
        <main>{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
                  isActive
                    ? 'text-blue-brand'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}