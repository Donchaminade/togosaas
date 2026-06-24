import { useState } from 'react';
import type * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import UserAvatar from '../ui/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS } from '../../lib/roles';

const SIDEBAR_COLLAPSED_KEY = 'tch_sidebar_collapsed';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
  href?: string;
  section?: string;
  external?: boolean;
}

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  nav: DashboardNavItem[];
  active: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
}

function readCollapsedPreference(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function DashboardLayout({
  title,
  subtitle,
  nav,
  active,
  onNavigate,
  children,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Lead';
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const Sidebar = (compact: boolean) => (
    <div className="flex h-full flex-col">
      <div
        className={`border-b border-slate-100 dark:border-slate-800 ${
          compact ? 'px-2 py-4' : 'px-4 py-5'
        }`}
      >
        <div
          className={`flex items-center ${
            compact ? 'flex-col gap-3' : 'justify-between gap-2'
          }`}
        >
          <div className={compact ? 'flex justify-center' : 'min-w-0 flex-1'}>
            <Logo variant="dashboard" className={compact ? '[&_img]:h-10 [&_img]:sm:h-10' : ''} />
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            title={compact ? 'Afficher le menu complet' : 'Réduire le menu'}
            aria-label={compact ? 'Afficher le menu complet' : 'Réduire le menu'}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {compact ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav className={`flex-1 space-y-1 overflow-y-auto ${compact ? 'px-2 py-2' : 'px-4 py-2'}`}>
        {nav.map((item, index) => {
          const isActive = active === item.id;
          const showSection =
            !compact && item.section && (index === 0 || nav[index - 1]?.section !== item.section);
          const className = `relative flex w-full items-center rounded-xl py-3 text-sm font-semibold transition-colors ${
            compact ? 'justify-center px-2' : 'gap-3 px-4'
          } ${
            isActive
              ? 'bg-togo-green text-white shadow-lg shadow-togo-green/25'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`;

          const inner = (
            <>
              <item.icon className="h-5 w-5 shrink-0" />
              {!compact && <span className="flex-1 text-left">{item.label}</span>}
              {!compact && item.badge ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-togo-red text-white'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
              {compact && item.badge ? (
                <span className="absolute right-1.5 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-togo-red px-1 text-[9px] font-bold text-white">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </>
          );

          return (
            <div key={item.id}>
              {showSection && (
                <p className="mb-2 mt-4 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 first:mt-0">
                  {item.section}
                </p>
              )}
              {item.href ? (
                item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className={className}
                    title={compact ? item.label : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </a>
                ) : (
                  <Link
                    to={item.href}
                    className={className}
                    title={compact ? item.label : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {inner}
                  </Link>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    setOpen(false);
                  }}
                  className={className}
                  title={compact ? item.label : undefined}
                >
                  {inner}
                </button>
              )}
            </div>
          );
        })}
      </nav>

      <div
        className={`space-y-1 border-t border-slate-100 dark:border-slate-800 ${
          compact ? 'px-2 py-4' : 'px-4 py-4'
        }`}
      >
        {!compact && (
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2.5 dark:bg-slate-800">
            <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="md" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="text-[11px] font-semibold uppercase text-togo-green dark:text-togo-yellow">
                {roleLabel}
              </p>
            </div>
          </div>
        )}
        {compact && (
          <div className="mb-3 flex justify-center" title={user?.name ?? undefined}>
            <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} size="md" />
          </div>
        )}
        <Link
          to="/"
          className={`flex items-center rounded-xl py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 ${
            compact ? 'justify-center px-2' : 'gap-3 px-4'
          }`}
          title={compact ? 'Retour au site' : undefined}
        >
          <Home className="h-5 w-5 shrink-0" />
          {!compact && 'Retour au site'}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center rounded-xl py-3 text-sm font-semibold text-togo-red transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 ${
            compact ? 'justify-center px-2' : 'gap-3 px-4'
          }`}
          title={compact ? 'Déconnexion' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!compact && 'Déconnexion'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white transition-[width] duration-300 dark:border-slate-800 dark:bg-slate-900 lg:block ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        {Sidebar(collapsed)}
      </aside>

      {/* Sidebar mobile */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white animate-fade-in dark:border-slate-800 dark:bg-slate-900 lg:hidden">
            {Sidebar(false)}
          </aside>
        </>
      )}

      <div
        className={`min-w-0 overflow-x-hidden transition-[padding] duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-4 glass dark:border-slate-800 dark:bg-slate-900/80 sm:gap-4 sm:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300 lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              title={collapsed ? 'Afficher le menu complet' : 'Réduire le menu'}
              aria-label={collapsed ? 'Afficher le menu complet' : 'Réduire le menu'}
              className="hidden h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 lg:grid"
            >
              {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black text-slate-900 dark:text-white sm:text-xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="hidden items-center gap-3 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800 sm:flex">
              <UserAvatar name={user?.name} avatarUrl={user?.avatarUrl} />
              <div className="leading-tight">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user?.name}</p>
                <p className="text-[11px] font-semibold uppercase text-togo-green dark:text-togo-yellow">
                  {roleLabel}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 max-w-full p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
