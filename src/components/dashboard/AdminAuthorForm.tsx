import { useEffect, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import Spinner from '../ui/Spinner';
import ImageUpload from '../ui/ImageUpload';
import { useToast } from '../ui/Toast';
import { api, ApiError } from '../../lib/api';
import type { SiteAuthor } from '../../types';

const EMPTY: SiteAuthor = {
  name: '',
  roleLabel: '',
  badgeLabel: 'Fondateur & Auteur',
  quote: '',
  bio: '',
  photoUrl: '',
  linkedinUrl: '',
  githubUrl: '',
  twitterUrl: '',
};

export default function AdminAuthorForm() {
  const { notify } = useToast();
  const [form, setForm] = useState<SiteAuthor>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    api.adminGetAuthor()
      .then((res) => setForm({ ...EMPTY, ...res.data.author }))
      .catch(() => notify('Impossible de charger le profil fondateur.', 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  const set = (key: keyof SiteAuthor) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api.adminUpdateAuthor(form);
      notify('Profil fondateur enregistré.', 'success');
    } catch (err) {
      if (err instanceof ApiError) {
        notify(err.message, 'error');
        if (err.errors) setErrors(err.errors);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-togo-green" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-togo-green dark:text-togo-yellow">
          Photo & identité
        </h3>
        <div className="space-y-4">
          <ImageUpload
            label="Photo de l'auteur"
            value={form.photoUrl}
            onChange={(url) => setForm((f) => ({ ...f, photoUrl: url ?? '' }))}
            hint="Photo affichée sur la page À propos"
          />
          <Field label="Nom complet" value={form.name} onChange={set('name')} error={errors.name?.[0]} required />
          <Field label="Rôle / titre" value={form.roleLabel} onChange={set('roleLabel')} error={errors.roleLabel?.[0]} required placeholder="Initiateur du projet Togosaas" />
          <Field label="Badge sous la photo" value={form.badgeLabel} onChange={set('badgeLabel')} error={errors.badgeLabel?.[0]} required placeholder="Fondateur & Auteur" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-togo-green dark:text-togo-yellow">
          Textes
        </h3>
        <div className="space-y-4">
          <div>
            <Label>Citation</Label>
            <textarea
              value={form.quote}
              onChange={set('quote')}
              rows={4}
              required
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="La citation mise en avant…"
            />
            {errors.quote?.[0] && <Err>{errors.quote[0]}</Err>}
          </div>
          <div>
            <Label>Biographie courte</Label>
            <textarea
              value={form.bio}
              onChange={set('bio')}
              rows={3}
              required
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            {errors.bio?.[0] && <Err>{errors.bio[0]}</Err>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-togo-green dark:text-togo-yellow">
          Réseaux sociaux
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="LinkedIn" value={form.linkedinUrl ?? ''} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/..." />
          <Field label="GitHub" value={form.githubUrl ?? ''} onChange={set('githubUrl')} placeholder="https://github.com/..." />
          <Field label="Twitter / X" value={form.twitterUrl ?? ''} onChange={set('twitterUrl')} placeholder="https://twitter.com/..." />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-6 py-3 text-sm font-bold text-white shadow-lg shadow-togo-green/25 hover:bg-togo-green-dark disabled:opacity-60"
      >
        {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        Enregistrer
      </button>
    </form>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{children}</label>;
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs font-medium text-togo-red">{children}</p>;
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>
        {label} {required && <span className="text-togo-red">*</span>}
      </Label>
      <input
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      {error && <Err>{error}</Err>}
    </div>
  );
}
