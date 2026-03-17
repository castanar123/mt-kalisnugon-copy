import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Mountain, Map, MessageSquare, CalendarCheck, LayoutDashboard, LogOut, Menu, X, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logo.png';

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const dashboardPath = role === 'admin' ? '/admin' : role === 'ranger' ? '/ranger' : '/hiker';

  const navLinks = user
    ? [
        { to: '/map', label: 'Trail Map', icon: Map },
        { to: '/chat', label: 'AI Assistant', icon: MessageSquare },
        { to: '/booking', label: 'Book Hike', icon: CalendarCheck },
        { to: dashboardPath, label: 'Dashboard', icon: LayoutDashboard },
      ]
    : [];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await signOut();
    setMobileOpen(false);
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card-strong border-b border-border/30">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src={logo}
            alt="Mt. Kalisungan logo"
            className="h-8 w-8 rounded-full object-cover bg-white/5 group-hover:scale-110 transition-transform"
            loading="eager"
          />
          <span className="text-lg font-bold text-gradient">Mt. Kalisungan</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                isActive(l.to) ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="mr-1"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary capitalize">{role}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Login</Button>
              <Button size="sm" onClick={() => navigate('/register')}>Sign Up</Button>
            </>
          )}
        </div>

        {/* Mobile toggle + theme */}
        <div className="md:hidden flex items-center gap-2">
          <button
            className="text-foreground"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-card-strong border-t border-border/30 overflow-hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    isActive(l.to) ? 'bg-primary/20 text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <l.icon className="h-4 w-4" />
                  {l.label}
                </Link>
              ))}
              <div className="border-t border-border/30 my-2" />
              {user ? (
                <Button variant="ghost" size="sm" className="justify-start" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" /> Logout ({role})
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => { navigate('/login'); setMobileOpen(false); }}>Login</Button>
                  <Button size="sm" className="justify-start" onClick={() => { navigate('/register'); setMobileOpen(false); }}>Sign Up</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
