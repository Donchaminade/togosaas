import { useState } from 'react';
import type * as React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { isStaffRole } from '../lib/roles';

export default function Login() {
  const { login } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from;

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const user = await login(form.email, form.password);
      notify(`Bienvenue, ${user.name} !`, 'success');
      const target = isStaffRole(user.role) ? '/admin' : from || '/espace-lead';
      navigate(target, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) setErrors(err.errors);
        notify(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Connexion" subtitle="Accédez à votre espace de gestion.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Email
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-togo-green focus:bg-white dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="vous@exemple.com"
          />
          {errors.email?.[0] && <p className="mt-1.5 text-xs font-medium text-togo-red">{errors.email[0]}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition-colors focus:border-togo-green focus:bg-white dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-togo-green px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark disabled:opacity-60"
        >
          {loading ? <Spinner /> : <LogIn className="h-5 w-5" />}
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="font-bold text-togo-green hover:underline dark:text-togo-yellow">
          Créer un espace lead
        </Link>
      </p>
    </AuthShell>
  );
}
