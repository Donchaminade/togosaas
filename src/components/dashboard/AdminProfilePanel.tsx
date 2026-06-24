import { useEffect, useState } from 'react';
import { KeyRound, Save, Shield } from 'lucide-react';
import Spinner from '../ui/Spinner';
import ImageUpload from '../ui/ImageUpload';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from '../../lib/roles';

export default function AdminProfilePanel() {
  const { user, refresh } = useAuth();
  const { notify } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [loading, setLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setAvatarUrl(user?.avatarUrl ?? null);
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateProfile({ name: name.trim(), phone: phone.trim() || null, avatarUrl });
      await refresh();
      notify('Profil mis à jour.', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Mise à jour impossible.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      notify('Les deux mots de passe ne correspondent pas.', 'error');
      return;
    }
    setSavingPwd(true);
    try {
      await api.updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        avatarUrl,
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      });
      notify('Mot de passe mis à jour.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Changement de mot de passe impossible.', 'error');
    } finally {
      setSavingPwd(false);
    }
  };

  const roleLabel = user?.role ? ROLE_LABELS[user.role] : '—';
  const roleDescription = user?.role ? ROLE_DESCRIPTIONS[user.role] : '';

  return (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleProfileSubmit}
        className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Shield className="h-4 w-4 text-togo-green dark:text-togo-yellow" /> Informations du compte
        </div>

        <ImageUpload
          label="Photo de profil"
          hint="Optionnelle — affichée dans l'espace d'administration."
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

        <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Rôle</p>
          <p className="mt-0.5 text-sm font-bold text-togo-green dark:text-togo-yellow">{roleLabel}</p>
          {roleDescription && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{roleDescription}</p>}
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

      <form
        onSubmit={handlePasswordSubmit}
        className="space-y-5 self-start rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <KeyRound className="h-4 w-4 text-togo-green dark:text-togo-yellow" /> Changer le mot de passe
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Mot de passe actuel</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Nouveau mot de passe</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="Minimum 6 caractères"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={savingPwd}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {savingPwd ? <Spinner className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
          Mettre à jour le mot de passe
        </button>
      </form>
    </div>
  );
}
