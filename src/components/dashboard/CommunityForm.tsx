import { useState } from 'react';
import type * as React from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import Spinner from '../ui/Spinner';
import ImageUpload from '../ui/ImageUpload';
import GalleryUpload from '../ui/GalleryUpload';
import { COUNTRIES, DEFAULT_COUNTRY, AVAILABLE_TAGS, TOGO_CITIES } from '../../data/togoData';
import type { CoLead, Community, MembershipRole } from '../../types';

interface CommunityFormProps {
  initial?: Partial<Community> | null;
  membershipRole?: MembershipRole;
  onSubmit: (data: Partial<Community>) => Promise<void>;
  /** Rend l'email du fondateur facultatif (mode admin « lead inconnu »). */
  leaderEmailOptional?: boolean;
}

const EMPTY: Partial<Community> = {
  name: '',
  description: '',
  shortDescription: '',
  mission: '',
  country: DEFAULT_COUNTRY,
  city: '',
  tags: [],
  logoUrl: '',
  bannerUrl: '',
  whatsappUrl: '',
  telegramUrl: '',
  linkedinUrl: '',
  twitterUrl: '',
  websiteUrl: '',
  leaderName: '',
  leaderEmail: '',
  leaderPhone: '',
  leaderPhotoUrl: '',
  leaderBio: '',
  coLeads: [],
  gallery: [],
  foundedYear: undefined,
  memberCount: undefined,
  meetingInfo: '',
  publicEmail: '',
  pricingType: 'free',
  priceAmount: undefined,
  currency: 'XOF',
  billingPeriod: undefined,
  appUrl: '',
  demoUrl: '',
};

export default function CommunityForm({ initial, membershipRole = 'owner', onSubmit, leaderEmailOptional = false }: CommunityFormProps) {
  const isCoLead = membershipRole === 'co_lead';
  const isNew = !initial?.id;

  const [form, setForm] = useState<Partial<Community>>(() => ({
    ...EMPTY,
    ...(initial ?? {}),
    tags: initial?.tags ?? [],
    coLeads: initial?.coLeads ?? [],
    gallery: initial?.gallery ?? [],
  }));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const set = (key: keyof Community) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setValue = (key: keyof Community, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleTag = (tag: string) => {
    setForm((f) => {
      const tags = f.tags ?? [];
      if (tags.includes(tag)) return { ...f, tags: tags.filter((t) => t !== tag) };
      if (tags.length >= 6) return f;
      return { ...f, tags: [...tags, tag] };
    });
  };

  const updateCoLead = (index: number, field: keyof CoLead, value: string) => {
    setForm((f) => {
      const list = [...(f.coLeads ?? [])];
      list[index] = { ...list[index], [field]: value };
      return { ...f, coLeads: list };
    });
  };

  const updateCoLeadPhoto = (index: number, url: string | null) => {
    setForm((f) => {
      const list = [...(f.coLeads ?? [])];
      list[index] = { ...list[index], photoUrl: url ?? undefined };
      return { ...f, coLeads: list };
    });
  };

  const addCoLead = () => {
    setForm((f) => ({
      ...f,
      coLeads: [...(f.coLeads ?? []), { name: '', role: 'Co-lead' }],
    }));
  };

  const removeCoLead = (index: number) => {
    setForm((f) => ({
      ...f,
      coLeads: (f.coLeads ?? []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await onSubmit(form);
    } catch (err: any) {
      if (err?.errors) setErrors(err.errors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isCoLead && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          Vous êtes co-lead : vous pouvez modifier le contenu, la galerie et les infos pratiques.
          Le logo, l&apos;identité, l&apos;équipe et la suppression restent réservés au responsable principal.
        </div>
      )}

      {!isCoLead && (
        <Section title="Logo & visuels">
          <ImageUpload
            label="Logo de la solution"
            value={form.logoUrl}
            onChange={(url) => setValue('logoUrl', url ?? '')}
            required={isNew}
            hint="Format carré recommandé — JPG, PNG ou WebP"
          />
          <ImageUpload
            label="Bannière (image en haut de la fiche publique)"
            value={form.bannerUrl}
            onChange={(url) => setValue('bannerUrl', url ?? '')}
            aspect="banner"
          />
        </Section>
      )}

      <Section title="Identité">
        <Input
          label="Nom de la solution"
          value={form.name}
          onChange={set('name')}
          error={errors.name?.[0]}
          required
          disabled={isCoLead}
        />
        <Input
          label="Accroche courte"
          value={form.shortDescription ?? ''}
          onChange={set('shortDescription')}
          placeholder="Une phrase qui résume votre solution SaaS"
          maxLength={300}
          disabled={isCoLead}
        />
        <div>
          <Label>Description {!isCoLead && <span className="text-togo-red">*</span>}</Label>
          <textarea
            value={form.description ?? ''}
            onChange={set('description')}
            rows={4}
            required={!isCoLead}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green focus:bg-white dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Décrivez votre solution : fonctionnalités, public cible, avantages (20 caractères min.)"
          />
          {errors.description?.[0] && <Err>{errors.description[0]}</Err>}
        </div>
        <div>
          <Label>Proposition de valeur</Label>
          <textarea
            value={form.mission ?? ''}
            onChange={set('mission')}
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green focus:bg-white dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            placeholder="Quel problème résout votre solution ?"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Pays {!isCoLead && <span className="text-togo-red">*</span>}</Label>
            <select
              value={form.country ?? DEFAULT_COUNTRY}
              onChange={set('country')}
              required={!isCoLead}
              disabled={isCoLead}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>{c.name}</option>
              ))}
            </select>
            {errors.country?.[0] && <Err>{errors.country[0]}</Err>}
          </div>
          <div>
            <Label>Ville (facultatif)</Label>
            <select
              value={form.city ?? ''}
              onChange={set('city')}
              disabled={isCoLead}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
            >
              <option value="">— Choisir une ville —</option>
              {TOGO_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Grandes villes du Togo uniquement — pas de quartier.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Catégories (max 6)">
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => {
            const selected = form.tags?.includes(tag);
            return (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  selected
                    ? 'bg-togo-green text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </Section>

      {!isCoLead && (
        <Section title="Tarification">
          <p className="-mt-2 mb-3 text-xs text-slate-500 dark:text-slate-400">
            Indiquez si votre solution est gratuite, freemium ou payante. Le badge s&apos;affichera sur le catalogue.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {(['free', 'freemium', 'paid'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setValue('pricingType', type)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  form.pricingType === type
                    ? 'border-togo-green bg-togo-green/10 text-togo-green dark:border-togo-yellow dark:bg-togo-yellow/10 dark:text-togo-yellow'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {type === 'free' && 'Gratuit'}
                {type === 'freemium' && 'Freemium'}
                {type === 'paid' && 'Payant'}
              </button>
            ))}
          </div>
          {(form.pricingType === 'paid' || form.pricingType === 'freemium') && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Prix (optionnel pour freemium)"
                type="number"
                min={0}
                step={1}
                value={form.priceAmount ?? ''}
                onChange={set('priceAmount')}
                placeholder="5000"
              />
              <div>
                <Label>Devise</Label>
                <select
                  value={form.currency ?? 'XOF'}
                  onChange={set('currency')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                >
                  <option value="XOF">XOF (FCFA)</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div>
                <Label>Période de facturation</Label>
                <select
                  value={form.billingPeriod ?? ''}
                  onChange={set('billingPeriod')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
                >
                  <option value="">— Choisir —</option>
                  <option value="monthly">Mensuel</option>
                  <option value="yearly">Annuel</option>
                  <option value="one_time">Paiement unique</option>
                </select>
              </div>
            </div>
          )}
        </Section>
      )}

      <Section title="Accès à la solution">
        <p className="-mt-2 mb-3 text-xs text-slate-500 dark:text-slate-400">
          Lien direct pour que les visiteurs accèdent à votre application depuis la fiche publique.
        </p>
        <Input
          label="URL de l'application"
          value={form.appUrl ?? ''}
          onChange={set('appUrl')}
          placeholder="https://app.votre-solution.tg"
          disabled={isCoLead}
        />
        <Input
          label="URL démo / essai gratuit"
          value={form.demoUrl ?? ''}
          onChange={set('demoUrl')}
          placeholder="https://demo.votre-solution.tg"
        />
        <Input
          label="Site web (optionnel)"
          value={form.websiteUrl ?? ''}
          onChange={set('websiteUrl')}
          placeholder="https://votre-solution.tg"
        />
      </Section>

      <Section title="Réseaux sociaux (optionnel)">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="WhatsApp" value={form.whatsappUrl ?? ''} onChange={set('whatsappUrl')} placeholder="https://chat.whatsapp.com/..." />
          <Input label="Telegram" value={form.telegramUrl ?? ''} onChange={set('telegramUrl')} placeholder="https://t.me/..." />
          <Input label="LinkedIn" value={form.linkedinUrl ?? ''} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/..." />
          <Input label="Twitter / X" value={form.twitterUrl ?? ''} onChange={set('twitterUrl')} placeholder="https://twitter.com/..." />
        </div>
      </Section>

      {!isCoLead && (
        <Section title="Fondateur / éditeur">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nom" value={form.leaderName ?? ''} onChange={set('leaderName')} error={errors.leaderName?.[0]} required />
            <Input
              label={leaderEmailOptional ? 'Email (privé, facultatif)' : 'Email (privé, admin)'}
              type="email"
              value={form.leaderEmail ?? ''}
              onChange={set('leaderEmail')}
              error={errors.leaderEmail?.[0]}
              required={!leaderEmailOptional}
            />
            <Input label="Téléphone (privé)" value={form.leaderPhone ?? ''} onChange={set('leaderPhone')} placeholder="+228 ..." />
          </div>
          <ImageUpload
            label="Photo du responsable"
            value={form.leaderPhotoUrl}
            onChange={(url) => setValue('leaderPhotoUrl', url ?? '')}
            hint="Photo affichée publiquement sur la fiche solution"
          />
          <div>
            <Label>Biographie publique</Label>
            <textarea
              value={form.leaderBio ?? ''}
              onChange={set('leaderBio')}
              rows={2}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder="Quelques mots sur le/la responsable..."
            />
          </div>
        </Section>
      )}

      {!isCoLead && (
        <Section title="Équipe & co-fondateurs">
          {(form.coLeads ?? []).map((cl, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Membre {i + 1}</span>
                <button type="button" onClick={() => removeCoLead(i)} className="text-togo-red hover:opacity-80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Nom" value={cl.name} onChange={(e) => updateCoLead(i, 'name', e.target.value)} required />
                <Input label="Rôle" value={cl.role ?? ''} onChange={(e) => updateCoLead(i, 'role', e.target.value)} placeholder="Co-lead, Trésorier..." />
                <Input label="Email du compte Togosaas" type="email" value={cl.email ?? ''} onChange={(e) => updateCoLead(i, 'email', e.target.value)} placeholder="co-lead@exemple.tg" />
                <Input label="LinkedIn" value={cl.linkedinUrl ?? ''} onChange={(e) => updateCoLead(i, 'linkedinUrl', e.target.value)} />
              </div>
              <div className="mt-3">
                <ImageUpload
                  label="Photo"
                  value={cl.photoUrl}
                  onChange={(url) => updateCoLeadPhoto(i, url)}
                />
              </div>
              <div className="mt-3">
                <Label>Bio</Label>
                <textarea
                  value={cl.bio ?? ''}
                  onChange={(e) => updateCoLead(i, 'bio', e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addCoLead}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-togo-green hover:text-togo-green dark:border-slate-600 dark:text-slate-300"
          >
            <Plus className="h-4 w-4" /> Ajouter un co-lead
          </button>
        </Section>
      )}

      <Section title="Captures d'écran & galerie">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Année de lancement" type="number" value={form.foundedYear ?? ''} onChange={set('foundedYear')} placeholder="2024" />
          <Input label="Nombre d'utilisateurs" type="number" value={form.memberCount ?? ''} onChange={set('memberCount')} placeholder="500" />
          <Input label="Email de support public" type="email" value={form.publicEmail ?? ''} onChange={set('publicEmail')} placeholder="support@..." />
        </div>
        <GalleryUpload
          label="Captures d'écran & images produit"
          value={form.gallery ?? []}
          onChange={(urls) => setValue('gallery', urls)}
        />
      </Section>

      <div className="sticky bottom-0 z-10 -mx-1 border-t border-slate-200 bg-white/95 px-1 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-togo-green px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark disabled:opacity-60 sm:w-auto sm:min-w-[240px]"
        >
          {loading ? <Spinner /> : <Save className="h-4 w-4" />}
          {initial?.id ? 'Enregistrer les modifications' : 'Soumettre la solution'}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/30">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-togo-green dark:text-togo-yellow">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{children}</label>;
}

function Err({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs font-medium text-togo-red">{children}</p>;
}

function Input({
  label,
  error,
  required,
  disabled,
  ...props
}: { label: string; error?: string; required?: boolean; disabled?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <Label>
        {label} {required && <span className="text-togo-red">*</span>}
      </Label>
      <input
        {...props}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-togo-green focus:bg-white disabled:opacity-60 dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {error && <Err>{error}</Err>}
    </div>
  );
}
