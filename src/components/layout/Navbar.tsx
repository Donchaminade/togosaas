import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Menu, Rocket, User2, X } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import { useAuth } from '../../context/AuthContext';

const NAV_LINKS = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/a-propos', label: 'À propos' },
  { to: '/solutions', label: 'Solutions SaaS' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const heroNav = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const dashboardPath = isAdmin ? '/admin' : '/espace-lead';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const shellClass = heroNav
    ? 'border-white/15 bg-slate-950/45 shadow-xl shadow-black/30 backdrop-blur-xl ring-1 ring-white/5'
    : scrolled
      ? 'border-slate-200/80 bg-white/90 shadow-xl shadow-slate-900/10 glass ring-1 ring-black/5 dark:border-slate-700/60 dark:bg-slate-950/90 dark:shadow-black/40 dark:ring-white/5'
      : 'border-slate-200/60 bg-white/80 shadow-lg shadow-slate-900/5 glass ring-1 ring-black/5 dark:border-slate-700/50 dark:bg-slate-950/85 dark:shadow-black/30 dark:ring-white/5';

  const linkClass = (isActive: boolean) => {
    if (heroNav) {
      return `whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors xl:px-3 xl:text-sm ${
        isActive ? 'text-togo-yellow' : 'text-white/85 hover:text-white'
      }`;
    }
    return `whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors xl:px-3 xl:text-sm ${
      isActive
        ? 'text-togo-red dark:text-togo-yellow'
        : 'text-slate-600 hover:text-togo-green dark:text-slate-300 dark:hover:text-togo-yellow'
    }`;
  };

  return (
    <header
      className={`fixed left-1/2 z-50 w-[calc(100%-1rem)] max-w-7xl -translate-x-1/2 transition-all duration-300 sm:w-[calc(100%-2rem)] ${
        open ? 'top-3 rounded-3xl' : 'top-3 rounded-full'
      } ${shellClass}`}
    >
      <nav className="flex min-h-[3.75rem] items-center gap-2 px-3 py-2 sm:min-h-[4.25rem] sm:gap-3 sm:px-5 lg:px-6">
        {/* Logo */}
        <div className="flex shrink-0 items-center">
          <Logo variant="nav" surface={heroNav ? 'dark' : 'auto'} />
        </div>

        {/* Liens centrés (desktop) */}
        <ul className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1">
          {NAV_LINKS.map((link) => (
            <li key={link.to} className="shrink-0">
              <NavLink to={link.to} end={link.end} className={({ isActive }) => linkClass(isActive)}>
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Actions (desktop) */}
        <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex xl:gap-2.5">
          <ThemeToggle
            className={
              heroNav
                ? 'border-white/20 bg-white/10 text-white hover:border-togo-yellow hover:text-togo-yellow dark:border-white/20 dark:bg-white/10 dark:text-white'
                : ''
            }
          />
          {isAuthenticated ? (
            <>
              <Link
                to={dashboardPath}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors xl:px-4 xl:py-2.5 ${
                  heroNav
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="hidden xl:inline">{isAdmin ? 'Admin' : 'Mon espace'}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title={`Déconnexion (${user?.name})`}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${
                  heroNav
                    ? 'border-white/20 text-white/80 hover:border-togo-red hover:text-togo-red'
                    : 'border-slate-200 text-slate-500 hover:border-togo-red hover:text-togo-red dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/connexion"
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors xl:px-4 xl:py-2.5 ${
                  heroNav
                    ? 'text-white/90 hover:text-white'
                    : 'text-slate-700 hover:text-togo-green dark:text-slate-200 dark:hover:text-togo-yellow'
                }`}
              >
                <User2 className="h-4 w-4 shrink-0" />
                <span className="hidden xl:inline">Connexion</span>
              </Link>
              {!heroNav && (
                <Link
                  to="/inscription"
                  className="group flex shrink-0 items-center gap-2 rounded-xl bg-togo-green px-3 py-2 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark xl:px-4 xl:py-2.5 dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/20 dark:hover:bg-togo-yellow/90"
                >
                  <Rocket className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5" />
                  <span className="hidden xl:inline">Publier ma solution</span>
                  <span className="xl:hidden">S&apos;inscrire</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile */}
        <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
          <ThemeToggle
            className={
              heroNav
                ? 'border-white/20 bg-white/10 text-white hover:border-togo-yellow hover:text-togo-yellow'
                : ''
            }
          />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={`grid h-10 w-10 place-items-center rounded-xl border ${
              heroNav
                ? 'border-white/20 text-white'
                : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
            }`}
            aria-label="Menu"
            aria-expanded={open ? 'true' : 'false'}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Panneau mobile */}
      {open && (
        <div
          className={`border-t px-4 py-4 animate-fade-in lg:hidden ${
            heroNav ? 'border-white/15' : 'border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-colors ${
                      isActive
                        ? heroNav
                          ? 'bg-white/15 text-togo-yellow'
                          : 'bg-togo-green/10 text-togo-green dark:text-togo-yellow'
                        : heroNav
                          ? 'text-white/90 hover:bg-white/10'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div
            className={`mt-4 flex flex-col gap-2 border-t pt-4 ${
              heroNav ? 'border-white/15' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            {isAuthenticated ? (
              <>
                <Link
                  to={dashboardPath}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                    heroNav ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {isAdmin ? 'Tableau de bord admin' : 'Mon espace éditeur'}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-togo-red ${
                    heroNav ? 'border-white/20 text-rose-300' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/connexion"
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                    heroNav
                      ? 'border-white/20 text-white'
                      : 'border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                  }`}
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  className="flex items-center justify-center gap-2 rounded-xl bg-togo-green px-4 py-3 text-sm font-bold text-white dark:bg-togo-yellow dark:text-slate-900"
                >
                  <Rocket className="h-4 w-4" />
                  Publier ma solution
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
