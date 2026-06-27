import { useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ShieldCheck, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../ui/Toast';
import Spinner from '../ui/Spinner';

/**
 * Garde de complétion de profil.
 *
 * Lorsqu'un compte lead a été créé par l'admin sans email réel (adresse sentinelle),
 * le backend renvoie `profileIncomplete = true`. Tant que c'est le cas, une modale
 * NON fermable (pas de bouton fermer, pas de fermeture au clic extérieur ou via Échap)
 * recouvre toute l'interface et force le lead à renseigner son vrai email et son
 * téléphone avant de pouvoir naviguer.
 */
export default function CompleteProfileGuard({ children }: { children: ReactNode }) {
  const { user, profileIncomplete } = useAuth();

  return (
    <>
      {children}
      {profileIncomplete && user && <CompleteProfileModal />}
    </>
  );
}

function CompleteProfileModal() {
  const { user, refresh } = useAuth();
  const { notify } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.updateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      });
      notify('Profil complété. Bienvenue !', 'success');
      // Recharge l'utilisateur : profileIncomplete repassera à false et la modale disparaîtra.
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) setErrors(err.errors);
        notify(err.message, 'error');
      } else {
        notify('Une erreur est survenue. Réessayez.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-slate-900/80 p-4 py-8 backdrop-blur-sm sm:py-12"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-profile-title"
    >
      <div className="mx-auto flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-togo-green/5 px-6 py-5 dark:border-slate-800 dark:bg-togo-green/10">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-togo-green/15 text-togo-green dark:text-togo-yellow">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2
              id="complete-profile-title"
              className="text-lg font-black text-slate-900 dark:text-white"
            >
              Complétez votre profil
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Étape obligatoire pour accéder à votre espace.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            Votre compte a été créé par l&apos;équipe Togosaas. Renseignez votre véritable
            adresse e-mail et votre téléphone pour finaliser l&apos;activation. Vous utiliserez
            ensuite cette adresse pour vous connecter.
          </p>

          <Field
            label="Nom complet"
            value={name}
            onChange={setName}
            required
            error={errors.name?.[0]}
          />
          <Field
            label="Adresse e-mail réelle"
            type="email"
            value={email}
            onChange={setEmail}
            required
            placeholder="vous@exemple.com"
            error={errors.email?.[0]}
          />
          <Field
            label="Téléphone"
            value={phone}
            onChange={setPhone}
            required
            placeholder="+228 ..."
            error={errors.phone?.[0]}
          />

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-togo-green px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark disabled:opacity-60"
          >
            {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            Enregistrer et continuer
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label} {required && <span className="text-togo-red">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-togo-green focus:bg-white focus:ring-2 focus:ring-togo-green/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-togo-yellow dark:focus:ring-togo-yellow/20"
      />
      {error && <p className="mt-1.5 text-xs font-medium text-togo-red">{error}</p>}
    </label>
  );
}
