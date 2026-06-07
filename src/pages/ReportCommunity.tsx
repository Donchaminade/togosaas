import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  EyeOff,
  Lock,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import ReportEvidenceUpload from '../components/reports/ReportEvidenceUpload';
import { PageLoader } from '../components/ui/Spinner';
import SearchableSelect from '../components/ui/SearchableSelect';
import { useToast } from '../components/ui/Toast';
import { communityPublicPath } from '../lib/communityUrl';
import { api, ApiError } from '../lib/api';
import { REPORT_CATEGORIES, REPORT_TARGET_LABELS } from '../lib/reportCategories';
import type { Community, ReportEvidenceFile, ReportTargetType } from '../types';

export default function ReportCommunity() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useToast();

  const slugOrId = id || searchParams.get('communaute') || undefined;

  const [communityLabel, setCommunityLabel] = useState('');
  const [presetCommunity, setPresetCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunity, setLoadingCommunity] = useState(true);
  const [communityId, setCommunityId] = useState<number>(0);
  const [targetType, setTargetType] = useState<ReportTargetType>('community');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<ReportEvidenceFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (slugOrId) return;
    setLoadingCommunity(true);
    api
      .listCommunities()
      .then((res) => setCommunities(res.data.communities))
      .catch(() => notify('Impossible de charger les communautés.', 'error'))
      .finally(() => setLoadingCommunity(false));
  }, [slugOrId, notify]);

  useEffect(() => {
    if (!slugOrId) return;
    api
      .getCommunity(slugOrId)
      .then((res) => {
        const c = res.data.community;
        setPresetCommunity(c);
        setCommunityId(c.id ?? 0);
        setCommunityLabel(c.name);
      })
      .catch(() => notify('Communauté introuvable.', 'error'))
      .finally(() => setLoadingCommunity(false));
  }, [slugOrId, notify]);

  const selectedCommunity = communities.find((c) => c.id === communityId);

  const communityOptions = useMemo(
    () =>
      communities.map((c) => ({
        value: c.id!,
        label: c.name,
        keywords: [c.city, c.country, ...(c.tags ?? [])],
      })),
    [communities],
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!communityId || !category || description.trim().length < 30) {
      notify('Veuillez remplir tous les champs requis (description min. 30 caractères).', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitReport({
        communityId,
        targetType,
        category,
        description: description.trim(),
        evidence,
      });
      setDone(res.data.trackingCode);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Envoi impossible.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(done);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('Copie impossible.', 'error');
    }
  };

  if (loadingCommunity) {
    return <PageLoader label="Chargement…" />;
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-white pb-20 pt-below-nav dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <Link
          to={presetCommunity ? communityPublicPath(presetCommunity) : '/'}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-togo-green dark:text-slate-400 dark:hover:text-togo-yellow"
        >
          <ArrowLeft className="h-4 w-4" /> {presetCommunity ? 'Retour à la fiche' : 'Retour à l\'accueil'}
        </Link>

        {/* En-tête rassurant */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-8 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-950">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-togo-green text-white shadow-lg shadow-togo-green/30 dark:bg-emerald-800">
              <Shield className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Signaler un abus</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Vous êtes <strong>membre</strong> ou témoin d&apos;une situation problématique au sein
                d&apos;une communauté référencée sur T.C.H ? Signalez-la ici, en toute confidentialité.
                Votre identité n&apos;est <strong>jamais</strong> enregistrée — aucun compte requis.
                L&apos;équipe T.C.H examine chaque signalement de manière indépendante.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: EyeOff, text: 'Anonymat total' },
              { icon: Lock, text: 'Preuves confidentielles' },
              { icon: ShieldCheck, text: 'Modération indépendante' },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-xs font-bold text-emerald-800 dark:bg-slate-900/80 dark:text-emerald-300"
              >
                <Icon className="h-4 w-4 shrink-0" /> {text}
              </div>
            ))}
          </div>
        </div>

        {done ? (
          <div className="mt-8 rounded-3xl border border-togo-green/30 bg-white p-8 text-center shadow-xl dark:border-togo-yellow/20 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-14 w-14 text-togo-green dark:text-togo-yellow" />
            <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">Signalement reçu</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Merci pour votre vigilance. Notre équipe va examiner votre signalement en toute confidentialité.
            </p>
            <p className="mt-6 text-xs font-bold uppercase tracking-wider text-slate-400">Votre code de suivi anonyme</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <code className="rounded-xl bg-slate-100 px-4 py-3 text-lg font-black tracking-widest text-togo-green dark:bg-slate-800 dark:text-togo-yellow">
                {done}
              </code>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                <Copy className="h-3.5 w-3.5" /> {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Conservez ce code pour suivre l&apos;avancement — sans révéler qui vous êtes.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={`/signaler/suivi?code=${encodeURIComponent(done)}`}
                className="rounded-xl bg-togo-green px-5 py-2.5 text-sm font-bold text-white hover:bg-togo-green-dark dark:bg-togo-yellow dark:text-slate-900"
              >
                Suivre mon signalement
              </Link>
              <button
                type="button"
                onClick={() => navigate('/communautes')}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
              >
                Retour à l&apos;annuaire
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {!slugOrId && (
              <Field label="Communauté concernée" required>
                <SearchableSelect
                  options={communityOptions}
                  value={communityId || ''}
                  onChange={(v) => setCommunityId(Number(v))}
                  placeholder="Sélectionnez une communauté…"
                  searchPlaceholder="Rechercher par nom, ville, tag…"
                  emptyMessage="Aucune communauté trouvée."
                  required
                />
              </Field>
            )}

            {slugOrId && communityLabel && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-bold uppercase text-slate-400">Communauté signalée</p>
                <p className="mt-1 font-bold text-slate-900 dark:text-white">{communityLabel}</p>
              </div>
            )}

            <Field label="Qui souhaitez-vous signaler ?" required hint="Précisez si l'abus concerne la communauté dans son ensemble ou son responsable.">
              <div className="space-y-2">
                {(Object.keys(REPORT_TARGET_LABELS) as ReportTargetType[]).map((key) => (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      targetType === key
                        ? 'border-togo-green bg-togo-green/5 dark:border-togo-yellow dark:bg-togo-yellow/5'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="targetType"
                      value={key}
                      checked={targetType === key}
                      onChange={() => setTargetType(key)}
                      className="mt-1"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {REPORT_TARGET_LABELS[key]}
                    </span>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Motif du signalement" required>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Choisissez une catégorie…</option>
                {REPORT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Description détaillée" required hint="Minimum 30 caractères. Soyez factuel : dates, contexte, comportements observés.">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={30}
                rows={6}
                className={`${inputClass} resize-y`}
                placeholder="Décrivez les faits de manière objective…"
              />
              <p className="mt-1 text-right text-xs text-slate-400">{description.length} / 5000</p>
            </Field>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Preuves (optionnel)</h3>
              <ReportEvidenceUpload value={evidence} onChange={setEvidence} />
            </div>

            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              En envoyant ce signalement, vous confirmez agir de bonne foi. Les signalements abusifs peuvent entraîner des mesures. Aucune donnée personnelle n&apos;est collectée.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-togo-green py-4 text-sm font-black text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark disabled:opacity-60 dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/20"
            >
              {submitting ? 'Envoi sécurisé en cours…' : 'Envoyer le signalement anonyme'}
            </button>

            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              Déjà signalé ?{' '}
              <Link to="/signaler/suivi" className="font-bold text-togo-green hover:underline dark:text-togo-yellow">
                Suivre avec votre code
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-togo-green focus:ring-2 focus:ring-togo-green/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-togo-yellow dark:focus:ring-togo-yellow/20';

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}{required ? ' *' : ''}
      </span>
      {hint && <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {children}
    </label>
  );
}
