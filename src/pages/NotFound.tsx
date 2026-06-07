import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center px-4 pt-below-nav text-center">
      <p className="text-8xl font-black text-gradient-togo">404</p>
      <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">Page introuvable</h1>
      <p className="mt-2 max-w-md text-slate-500 dark:text-slate-400">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-togo-green px-6 py-3 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-colors hover:bg-togo-green-dark"
      >
        <Home className="h-5 w-5" /> Retour à l'accueil
      </Link>
    </section>
  );
}
