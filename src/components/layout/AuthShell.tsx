import type * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Sparkles, Users } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* Panneau gauche illustratif */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-togo-green to-togo-green-dark p-12 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 text-white/10 bg-dots" />
        <div className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-togo-yellow/20 blur-3xl animate-blob" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-64 w-64 rounded-full bg-togo-red/20 blur-3xl animate-blob delay-300" />

        <div className="relative">
          <Logo variant="auth" />
        </div>

        <div className="relative">
          <Sparkles className="h-10 w-10 text-togo-yellow" />
          <h2 className="mt-6 text-4xl font-black leading-tight">
            Rejoignez le hub des communautés du Togo.
          </h2>
          <p className="mt-4 max-w-md text-emerald-50">
            Créez votre espace, exposez votre communauté et gérez vos
            informations en toute autonomie.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: Users, text: 'Un tableau de bord dédié pour vos communautés' },
              { icon: ShieldCheck, text: 'Validation et mise en avant par notre équipe' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                  <f.icon className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-emerald-50">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex overflow-hidden rounded-full">
          <div className="h-1.5 flex-1 bg-white/30" />
          <div className="h-1.5 flex-1 bg-togo-yellow" />
          <div className="h-1.5 flex-1 bg-togo-red" />
        </div>
      </div>

      {/* Panneau droit : formulaire */}
      <div className="relative flex w-full flex-col bg-white px-6 py-8 dark:bg-slate-950 lg:w-1/2 lg:px-16">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-togo-green dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
          </Link>
          <ThemeToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="lg:hidden">
            <Logo variant="auth" />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-900 dark:text-white lg:mt-0">
            {title}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
