import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  EyeOff,
  HelpCircle,
  Search,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import PageBanner from '../components/ui/PageBanner';
import Spinner from '../components/ui/Spinner';
import { DIAPO } from '../data/heroSlides';
import { api, ApiError } from '../lib/api';
import { REPORT_STATUS_LABELS } from '../lib/reportCategories';
import type { ReportTrackInfo, ReportStatus } from '../types';

const STATUS_STYLES: Record<
  ReportStatus,
  { ring: string; bg: string; text: string; icon: typeof Clock }
> = {
  pending: {
    ring: 'border-amber-200 dark:border-amber-800/50',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-800 dark:text-amber-300',
    icon: Clock,
  },
  investigating: {
    ring: 'border-violet-200 dark:border-violet-800/50',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    text: 'text-violet-800 dark:text-violet-300',
    icon: Search,
  },
  resolved: {
    ring: 'border-emerald-200 dark:border-emerald-800/50',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-800 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  dismissed: {
    ring: 'border-slate-200 dark:border-slate-700',
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    text: 'text-slate-700 dark:text-slate-300',
    icon: AlertCircle,
  },
};

const STATUS_HELP: { status: ReportStatus; text: string }[] = [
  {
    status: 'pending',
    text: 'Votre signalement a bien été reçu. L\'équipe Togosaas va l\'examiner prochainement.',
  },
  {
    status: 'investigating',
    text: 'Un modérateur analyse les éléments transmis. Aucune action de votre part n\'est requise.',
  },
  {
    status: 'resolved',
    text: 'L\'équipe a traité le signalement (mesures prises ou clôture après vérification).',
  },
  {
    status: 'dismissed',
    text: 'Le signalement a été examiné mais classé sans suite (éléments insuffisants ou hors périmètre).',
  },
];

const TIPS = [
  {
    icon: EyeOff,
    title: '100 % anonyme',
    text: 'Aucun compte, aucune adresse e-mail ni numéro de téléphone n\'est demandé pour consulter le statut.',
  },
  {
    icon: ShieldCheck,
    title: 'Code confidentiel',
    text: 'Conservez votre code TCH-XXXX-XXXX-XXXX : c\'est le seul moyen de suivre votre dossier.',
  },
  {
    icon: Clock,
    title: 'Délai de traitement',
    text: 'Les signalements sont examinés sous 5 à 10 jours ouvrés selon la complexité du dossier.',
  },
];

export default function ReportTrack() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') ?? '';
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<ReportTrackInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const searchByCode = async (raw: string) => {
    const trimmed = raw.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.trackReport(trimmed);
      setResult(res.data.report);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Recherche impossible.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode.trim()) {
      searchByCode(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchByCode(code);
  };

  const copyCode = async () => {
    if (!result?.trackingCode) return;
    try {
      await navigator.clipboard.writeText(result.trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const statusStyle = result ? STATUS_STYLES[result.status] : null;
  const StatusIcon = statusStyle?.icon ?? Clock;

  return (
    <>
      <PageBanner
        image={DIAPO.reportTrackBanner}
        title={
          <>
            Suivi{' '}
            <span className="bg-gradient-to-r from-togo-green via-togo-yellow to-togo-red bg-clip-text text-transparent">
              anonyme
            </span>
          </>
        }
        subtitle="Consultez l'avancement de votre signalement grâce à votre code de suivi — sans créer de compte et sans révéler votre identité."
      />

      <div className="bg-slate-50 pb-24 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
            {/* Formulaire + résultat */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <div className="mb-6 flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-togo-green/10 text-togo-green dark:bg-togo-green/20 dark:text-togo-yellow">
                    <Shield className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      Entrez votre code de suivi
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                      Ce code vous a été affiché à la fin de votre signalement (format{' '}
                      <span className="font-mono font-semibold">TCH-XXXX-XXXX-XXXX</span>).
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="TCH-XXXX-XXXX-XXXX"
                    aria-label="Code de suivi"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-mono text-sm uppercase tracking-wide text-slate-900 outline-none transition-colors focus:border-togo-green focus:ring-2 focus:ring-togo-green/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-togo-yellow dark:focus:ring-togo-yellow/20"
                  />
                  <button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-togo-green px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark disabled:opacity-60 dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/20 dark:hover:bg-togo-yellow/90"
                  >
                    {loading ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Rechercher
                  </button>
                </form>

                {error && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 dark:border-rose-900/40 dark:bg-rose-950/30">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <div>
                      <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">{error}</p>
                      <p className="mt-1 text-xs text-rose-600/80 dark:text-rose-400/80">
                        Vérifiez le code saisi ou{' '}
                        <Link to="/signaler" className="font-bold underline hover:no-underline">
                          déposez un nouveau signalement
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                )}

                {result && statusStyle && (
                  <div
                    className={`mt-6 rounded-2xl border p-5 sm:p-6 ${statusStyle.ring} ${statusStyle.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <StatusIcon className={`mt-0.5 h-5 w-5 shrink-0 ${statusStyle.text}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Statut actuel
                        </p>
                        <p className={`mt-1 text-xl font-black ${statusStyle.text}`}>
                          {REPORT_STATUS_LABELS[result.status] ?? result.statusLabel}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {STATUS_HELP.find((h) => h.status === result.status)?.text}
                        </p>
                      </div>
                    </div>

                    <dl className="mt-5 space-y-3 border-t border-black/5 pt-5 text-sm dark:border-white/5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <dt className="text-slate-400">Code de suivi</dt>
                        <dd className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {result.trackingCode}
                          </span>
                          <button
                            type="button"
                            onClick={copyCode}
                            title="Copier le code"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-togo-green hover:text-togo-green dark:border-slate-700 dark:hover:border-togo-yellow dark:hover:text-togo-yellow"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          {copied && (
                            <span className="text-xs font-semibold text-togo-green dark:text-togo-yellow">
                              Copié !
                            </span>
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-400">Reçu le</dt>
                        <dd className="font-medium text-slate-700 dark:text-slate-200">
                          {new Date(result.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </dd>
                      </div>
                      {result.reviewedAt && (
                        <div className="flex justify-between gap-4">
                          <dt className="text-slate-400">Dernière mise à jour</dt>
                          <dd className="font-medium text-slate-700 dark:text-slate-200">
                            {new Date(result.reviewedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Pour des raisons de confidentialité, le contenu du signalement et les mesures
                      prises ne sont pas affichés publiquement.
                    </p>
                  </div>
                )}
              </div>

              {/* Légende des statuts */}
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  Comprendre les statuts
                </h3>
                <ul className="mt-4 space-y-3">
                  {STATUS_HELP.map(({ status, text }) => {
                    const style = STATUS_STYLES[status];
                    const Icon = style.icon;
                    return (
                      <li key={status} className="flex items-start gap-3 text-sm">
                        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.text}`} />
                        <div>
                          <span className={`font-bold ${style.text}`}>
                            {REPORT_STATUS_LABELS[status]}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400"> — {text}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Colonne infos */}
            <aside className="space-y-6 lg:col-span-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  Bon à savoir
                </h3>
                <ul className="mt-5 space-y-5">
                  {TIPS.map(({ icon: Icon, title, text }) => (
                    <li key={title} className="flex gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-togo-green dark:bg-slate-800 dark:text-togo-yellow">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-emerald-50/40 p-6 dark:border-rose-900/30 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-950">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  Pas encore signalé ?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Si vous avez constaté un dysfonctionnement ou un problème sur une solution SaaS
                  référencée sur Togosaas, déposez un signalement anonyme. Vous recevrez un code de
                  suivi à conserver précieusement.
                </p>
                <Link
                  to="/signaler"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition-all hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                >
                  <Shield className="h-4 w-4" />
                  Signaler un dysfonctionnement
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  Code perdu ?
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  Sans votre code, il est impossible de retrouver un signalement — c&apos;est ce
                  qui garantit votre anonymat. En cas de perte, vous pouvez soumettre un nouveau
                  signalement si la situation persiste.
                </p>
                <Link
                  to="/contact"
                  className="mt-4 inline-flex text-sm font-bold text-togo-green hover:underline dark:text-togo-yellow"
                >
                  Contacter l&apos;équipe Togosaas →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
