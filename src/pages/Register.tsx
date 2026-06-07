import { useState } from 'react';
import type * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Rocket } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

export default function Register() {
  const { register } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', passwordConfirmation: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (form.password !== form.passwordConfirmation) {
      setErrors({ passwordConfirmation: ['Les mots de passe ne correspondent pas.'] });
      notify('Les mots de passe ne correspondent pas.', 'error');
      return;
    }

    setLoading(true);
    try {
      const user = await register(form);
      notify(`Compte créé. Bienvenue, ${user.name} !`, 'success');
      navigate('/espace-lead', { replace: true });
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
    <AuthShell
      title="Exposer ma communauté"
      subtitle="Créez votre espace lead pour gérer vos communautés."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Nom complet" value={form.name} onChange={update('name')} error={errors.name?.[0]} required placeholder="Ex: Koffi Mensah" />
        <Field label="Email" type="email" value={form.email} onChange={update('email')} error={errors.email?.[0]} required placeholder="vous@exemple.com" />
        <Field label="Téléphone (optionnel)" value={form.phone} onChange={update('phone')} error={errors.phone?.[0]} placeholder="+228 ..." />

        <PasswordField
          label="Mot de passe"
          value={form.password}
          onChange={update('password')}
          show={showPass}
          onToggleShow={() => setShowPass((v) => !v)}
          error={errors.password?.[0]}
          placeholder="6 caractères minimum"
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirmer le mot de passe"
          value={form.passwordConfirmation}
          onChange={update('passwordConfirmation')}
          show={showConfirmPass}
          onToggleShow={() => setShowConfirmPass((v) => !v)}
          error={errors.passwordConfirmation?.[0]}
          placeholder="Retapez le mot de passe"
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-togo-green px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark disabled:opacity-60"
        >
          {loading ? <Spinner /> : <Rocket className="h-5 w-5" />}
          {loading ? 'Création...' : 'Créer mon espace'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Déjà inscrit ?{' '}
        <Link to="/connexion" className="font-bold text-togo-green hover:underline dark:text-togo-yellow">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}

function Field({
  label,
  error,
  required,
  ...props
}: { label: string; error?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label} {required && <span className="text-togo-red">*</span>}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-togo-green focus:bg-white dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {error && <p className="mt-1.5 text-xs font-medium text-togo-red">{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggleShow,
  error,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggleShow: () => void;
  error?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label} <span className="text-togo-red">*</span>
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition-colors focus:border-togo-green focus:bg-white dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-togo-red">{error}</p>}
    </div>
  );
}
