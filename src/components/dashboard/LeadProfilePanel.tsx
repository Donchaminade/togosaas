import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import Spinner from '../ui/Spinner';
import ImageUpload from '../ui/ImageUpload';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

export default function LeadProfilePanel() {
  const { user, refresh } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setAvatarUrl(user?.avatarUrl ?? null);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        avatarUrl,
      });
      await refresh();
      notify('Profil mis à jour.', 'success');
    } catch {
      notify('Mise à jour impossible.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <ImageUpload
          label="Photo de profil"
          hint="Optionnelle — affichée dans votre espace lead si vous en ajoutez une."
          value={avatarUrl}
          onChange={setAvatarUrl}
        />
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nom complet</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Email</label>
          <input
            value={user?.email ?? ''}
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50"
          />
          <p className="mt-1 text-xs text-slate-400">L&apos;email ne peut pas être modifié ici.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Téléphone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+228 ..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-2.5 text-sm font-bold text-white hover:bg-togo-green-dark disabled:opacity-60"
        >
          {loading ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </form>
    </div>
  );
}
