import { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';
import type { AdminUserSummary, UserRole } from '../../types';

interface Props {
  initial: AdminUserSummary;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; phone?: string | null; role: UserRole }) => Promise<void>;
  isSelf?: boolean;
}

export default function AdminUserEditForm({ initial, onClose, onSubmit, isSelf }: Props) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [role, setRole] = useState<UserRole>(initial.role);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
      });
      onClose();
    } catch {
      /* erreur gérée par le parent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Modifier l'utilisateur" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <Field label="Nom complet" value={name} onChange={setName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Téléphone" value={phone} onChange={setPhone} placeholder="+228 90 00 00 00" />

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Rôle</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={isSelf}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-togo-green focus:bg-white focus:ring-2 focus:ring-togo-green/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-togo-yellow dark:focus:ring-togo-yellow/20"
          >
            <option value="admin">Administrateur</option>
            <option value="lead">Lead</option>
          </select>
          {isSelf && (
            <p className="mt-1 text-xs text-slate-400">Vous ne pouvez pas modifier votre propre rôle.</p>
          )}
        </label>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-togo-green px-4 py-3 text-sm font-bold text-white transition-all hover:bg-togo-green-dark disabled:opacity-60"
          >
            {saving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-togo-green focus:bg-white focus:ring-2 focus:ring-togo-green/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-togo-yellow dark:focus:bg-slate-800 dark:focus:ring-togo-yellow/20"
      />
    </label>
  );
}
