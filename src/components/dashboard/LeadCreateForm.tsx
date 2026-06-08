import { useState } from 'react';
import { Save } from 'lucide-react';
import Modal from '../ui/Modal';
import Spinner from '../ui/Spinner';

interface Props {
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; password: string; phone?: string | null }) => Promise<void>;
}

export default function LeadCreateForm({ onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || null,
      });
      onClose();
    } catch {
      /* erreur gérée par le parent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Ajouter un lead" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        <Field label="Nom complet" value={name} onChange={setName} required />
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          required
          placeholder="Minimum 6 caractères"
          minLength={6}
        />
        <Field label="Téléphone" value={phone} onChange={setPhone} placeholder="+228 90 00 00 00" />

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Le lead pourra se connecter avec cet email et ce mot de passe pour gérer ses communautés.
        </p>

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
            Créer le lead
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
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
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
        minLength={minLength}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-togo-green focus:bg-white focus:ring-2 focus:ring-togo-green/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-togo-yellow dark:focus:bg-slate-800 dark:focus:ring-togo-yellow/20"
      />
    </label>
  );
}
