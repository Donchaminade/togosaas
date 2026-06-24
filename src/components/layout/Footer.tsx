import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, Phone, Twitter } from 'lucide-react';
import Logo from '../ui/Logo';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-slate-900 text-slate-300 dark:bg-black">
      {/* Décor : halos colorés */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-togo-green/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-togo-red/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo variant="footer" surface="dark" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Togosaas recense, valorise et connecte les solutions SaaS du Togo —
              gratuites et payantes, made in Togo.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <a
                href="mailto:chaminade.dondah.adjolou@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300 transition-colors hover:border-togo-yellow/40 hover:bg-togo-yellow/10 hover:text-white"
              >
                <Mail className="h-4 w-4" />
                chaminade.dondah.adjolou@gmail.com
              </a>
              <a
                href="tel:+22899181626"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-slate-300 transition-colors hover:border-togo-green/40 hover:bg-togo-green/15 hover:text-white"
              >
                <Phone className="h-4 w-4" />
                +22899181626
              </a>
            </div>
            <div className="mt-5 flex items-center gap-3">
              {[
                { icon: Github, href: 'https://github.com', label: 'GitHub' },
                { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
                { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
                { icon: Mail, href: 'mailto:chaminade.dondah.adjolou@gmail.com', label: 'Email' },
              ].map(({ icon: Icon, href, label }, i) => (
                <a
                  key={i}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-slate-300 transition-all hover:bg-togo-green hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/a-propos', label: 'À propos' },
                { to: '/solutions', label: 'Solutions SaaS' },
                { to: '/contact', label: 'Nous contacter' },
                { to: '/inscription', label: 'Proposer une solution' },
                { to: '/mentions-legales', label: 'Mentions légales' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-slate-400 transition-colors hover:text-togo-yellow">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Espace éditeur
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/inscription" className="text-slate-400 transition-colors hover:text-togo-yellow">
                  Publier ma solution
                </Link>
              </li>
              <li>
                <Link to="/connexion" className="text-slate-400 transition-colors hover:text-togo-yellow">
                  Connexion
                </Link>
              </li>
              <li>
                <Link to="/espace-lead" className="text-slate-400 transition-colors hover:text-togo-yellow">
                  Mon tableau de bord
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bandeau drapeau */}
        <div className="mt-12 flex overflow-hidden rounded-full">
          <div className="h-1 flex-1 bg-togo-green" />
          <div className="h-1 flex-1 bg-togo-yellow" />
          <div className="h-1 flex-1 bg-togo-red" />
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-xs text-slate-500 sm:flex-row">
          <p>© {year} Togosaas — Hub SaaS du Togo. Tous droits réservés.</p>
          <Link to="/mentions-legales" className="transition-colors hover:text-togo-yellow">
            Mentions légales
          </Link>
        </div>
      </div>
    </footer>
  );
}
