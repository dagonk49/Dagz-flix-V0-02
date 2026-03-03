'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Search, X, Home, Film, Tv, LogOut, User, Heart, Shield, ChevronDown, Wand2 } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function Navbar() {
  const { user, onLogout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [sq, setSq] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const submit = (e) => {
    e.preventDefault();
    if (sq.trim()) {
      router.push(`/search?q=${encodeURIComponent(sq.trim())}`);
      setSearchOpen(false);
      setSq('');
    }
  };

  const navItems = [
    { href: '/', label: 'Accueil', icon: Home },
    { href: '/movies', label: 'Films', icon: Film },
    { href: '/series', label: 'Séries', icon: Tv },
  ];

  const menuItems = [
    { label: 'Mon Profil', icon: User, href: '/profile' },
    { label: 'Mes Favoris', icon: Heart, href: '/favorites' },
    ...(user?.role === 'admin' ? [{ label: 'Administration', icon: Shield, href: '/admin' }] : []),
  ];

  return (
    <nav data-testid="main-navbar" className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-2xl shadow-2xl' : 'bg-gradient-to-b from-black/60 to-transparent'}`}>
      <div className="max-w-[1800px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <button data-testid="nav-logo" onClick={() => router.push('/')}>
            <h1 className="text-2xl font-black tracking-tighter"><span className="text-red-600">DAGZ</span><span>FLIX</span></h1>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(t => {
              const isActive = pathname === t.href || (t.href !== '/' && pathname.startsWith(t.href));
              return (
                <button key={t.href} data-testid={`nav-${t.href === '/' ? 'dashboard' : t.href.slice(1)}`} onClick={() => router.push(t.href)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <t.icon className="w-4 h-4" />{t.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {searchOpen ? (
              <motion.form key="s" initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} onSubmit={submit} className="relative">
                <Input data-testid="nav-search-input" value={sq} onChange={e => setSq(e.target.value)} placeholder="Rechercher..." className="bg-white/5 border-white/10 text-white h-10 pl-10 pr-10 rounded-xl" autoFocus />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <button type="button" onClick={() => { setSearchOpen(false); setSq(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
              </motion.form>
            ) : (
              <button data-testid="nav-search-toggle" onClick={() => setSearchOpen(true)} className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5">
                <Search className="w-5 h-5" />
              </button>
            )}
          </AnimatePresence>

          {/* User Avatar with Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              data-testid="nav-user-avatar"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-red-600/20">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                  data-testid="user-dropdown-menu"
                >
                  {/* User header */}
                  <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-white/40 capitalize">{user?.role}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {menuItems.map(item => (
                      <button
                        key={item.href}
                        data-testid={`menu-${item.href.slice(1)}`}
                        onClick={() => { router.push(item.href); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-white/5 py-1">
                    <button
                      data-testid="menu-logout"
                      onClick={() => { onLogout(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
