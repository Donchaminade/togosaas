import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, KeyRound, UserX } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import CommunityForm from '../../components/dashboard/CommunityForm';
import { PageLoader } from '../../components/ui/Spinner';
import SearchableSelect from '../../components/ui/SearchableSelect';
import { useToast } from '../../components/ui/Toast';
import { buildAdminNav } from '../../lib/adminNav';
import { api, ApiError } from '../../lib/api';
import { DEFAULT_COUNTRY } from '../../data/togoData';
import type { Community, CommunityStatus, LeadSummary, TempLeadCredentials } from '../../types';

export default function AdminCommunityCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useToast();

  const presetLeadId = searchParams.get('lead') ? Number(searchParams.get('lead')) : undefined;

  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number>(0);
  const [status, setStatus] = useState<CommunityStatus>('approved');
  const [unknownLead, setUnknownLead] = useState(false);
  const [credentials, setCredentials] = useState<TempLeadCredentials | null>(null);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const nav = buildAdminNav();
  const goAdminTab = (tab: string) => navigate(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`);

  const backTo = presetLeadId ? `/admin/leads/${presetLeadId}` : '/admin?tab=communities';

  useEffect(() => {
    (async () => {
      try {
        const res = await api.adminLeads();
        const list = res.data.leads;
        setLeads(list);
        if (presetLeadId && list.some((l) => l.id === presetLeadId)) {
          setUserId(presetLeadId);
        } else if (list[0]) {
          setUserId(list[0].id);
        }
      } catch {
        notify('Impossible de charger les leads.', 'error');
        navigate('/admin?tab=communities');
      } finally {
        setLoading(false);
      }
    })();
  }, [presetLeadId, navigate, notify]);

  const selectedLead = useMemo(
    () => leads.find((l) => l.id === userId) ?? null,
    [leads, userId],
  );

  const leadOptions = useMemo(
    () =>
      leads.map((l) => ({
        value: l.id,
        label: `${l.name} (${l.email})`,
        keywords: [l.email, l.phone],
      })),
    [leads],
  );

  const initial = useMemo<Partial<Community>>(
    () => ({
      name: '',
      description: '',
      country: DEFAULT_COUNTRY,
      tags: [],
      leaderName: unknownLead ? '' : selectedLead?.name ?? '',
      leaderEmail: unknownLead ? '' : selectedLead?.email ?? '',
      leaderPhone: unknownLead ? '' : selectedLead?.phone ?? '',
      status: 'approved',
    }),
    [selectedLead, unknownLead],
  );

  const handleSubmit = async (data: Partial<Community>) => {
    try {
      if (unknownLead) {
        const res = await api.adminCreateCommunityForUnknownLead({ ...data, status });
        setCredentials(res.data.tempCredentials ?? null);
        setCreatedId(res.data.community?.id ?? null);
        notify('Solution créée. Transmettez les identifiants au lead.', 'success');
        if (!res.data.tempCredentials) {
          const newId = res.data.community?.id;
          navigate(newId ? `/admin/communautes/${newId}` : '/admin?tab=communities');
        }
        return;
      }

      if (!userId) return;
      const res = await api.adminCreateCommunity({ ...data, userId, status });
      notify('Communauté créée.', 'success');
      const newId = res.data.community?.id;
      if (newId) navigate(`/admin/communautes/${newId}`);
      else navigate('/admin?tab=communities');
    } catch (err) {
      if (err instanceof ApiError) {
        notify(err.message, 'error');
        throw err;
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Ajouter une communauté"
        subtitle="Chargement…"
        nav={nav}
        active="communities"
        onNavigate={goAdminTab}
      >
        <PageLoader label="Chargement des leads..." />
      </DashboardLayout>
    );
  }

  // Étape de confirmation : identifiants temporaires à transmettre au lead.
  if (credentials) {
    return (
      <DashboardLayout
        title="Identifiants temporaires"
        subtitle="Solution créée pour un lead sans email"
        nav={nav}
        active="communities"
        onNavigate={goAdminTab}
      >
        <div className="max-w-2xl">
          <CredentialsPanel
            credentials={credentials}
            onDone={() =>
              navigate(createdId ? `/admin/communautes/${createdId}` : '/admin?tab=communities')
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  const canShowForm = unknownLead || leads.length > 0;

  return (
    <DashboardLayout
      title="Ajouter une communauté"
      subtitle="Créer une fiche au nom d'un lead"
      nav={nav}
      active="communities"
      onNavigate={goAdminTab}
    >
      <div className="mb-6">
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-togo-green dark:text-slate-400 dark:hover:text-togo-yellow"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </Link>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={unknownLead}
              onChange={(e) => setUnknownLead(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-togo-green focus:ring-togo-green dark:border-slate-600"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <UserX className="h-4 w-4 text-togo-green dark:text-togo-yellow" />
                Je ne connais pas l&apos;email du lead
              </span>
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                Un compte provisoire sera créé automatiquement. Vous recevrez des identifiants
                temporaires (email + mot de passe) à transmettre au lead, qui complétera son
                profil à la première connexion.
              </span>
            </span>
          </label>
        </div>

        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-2">
          {!unknownLead && (
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Lead responsable</span>
              <SearchableSelect
                options={leadOptions}
                value={userId || ''}
                onChange={(v) => setUserId(Number(v))}
                placeholder="Sélectionnez un lead…"
                searchPlaceholder="Rechercher par nom ou email…"
                emptyMessage="Aucun lead trouvé."
                required
                disabled={leads.length === 0}
              />
            </label>
          )}

          <label className={`block ${unknownLead ? 'sm:col-span-2' : ''}`}>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Statut initial</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CommunityStatus)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-950 dark:text-white [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-white"
            >
              <option value="approved">Approuvée</option>
              <option value="pending">En attente</option>
              <option value="rejected">Rejetée</option>
            </select>
          </label>
        </div>

        {unknownLead && (
          <div className="rounded-3xl border border-togo-green/30 bg-togo-green/5 px-6 py-4 text-sm text-slate-700 dark:border-togo-yellow/30 dark:bg-togo-yellow/10 dark:text-slate-200">
            Renseignez au minimum le <strong>nom du fondateur</strong> dans la section « Fondateur / éditeur ».
            L&apos;email est facultatif : laissez-le vide si vous ne le connaissez pas.
          </div>
        )}

        {!canShowForm ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8 text-center dark:border-amber-500/30 dark:bg-amber-500/10">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              Créez d&apos;abord un lead, ou cochez « Je ne connais pas l&apos;email du lead ».
            </p>
            <Link
              to="/admin?tab=leads"
              className="mt-4 inline-block text-sm font-bold text-togo-green hover:underline dark:text-togo-yellow"
            >
              Aller à la gestion des leads →
            </Link>
          </div>
        ) : (
          <CommunityForm
            key={`${unknownLead ? 'unknown' : userId}-${selectedLead?.email ?? ''}`}
            initial={initial}
            onSubmit={handleSubmit}
            leaderEmailOptional={unknownLead}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function CredentialsPanel({
  credentials,
  onDone,
}: {
  credentials: TempLeadCredentials;
  onDone: () => void;
}) {
  return (
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-togo-green/15 text-togo-green dark:text-togo-yellow">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Identifiants temporaires</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Transmettez-les au lead (hors plateforme). Ils ne seront plus affichés.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        ⚠️ Le mot de passe n&apos;apparaît qu&apos;une seule fois. Copiez-le maintenant.
      </div>

      <div className="space-y-4">
        <CredentialRow label="Email de connexion" value={credentials.email} />
        <CredentialRow label="Mot de passe temporaire" value={credentials.password} mono />
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        À sa première connexion, le lead devra renseigner son véritable email et son téléphone
        avant de pouvoir utiliser son espace.
      </p>

      <button
        type="button"
        onClick={onDone}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-togo-green px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark sm:w-auto"
      >
        <Check className="h-4 w-4" /> J&apos;ai transmis les identifiants
      </button>
    </div>
  );
}

function CredentialRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      notify('Copié dans le presse-papiers.', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      notify('Copie impossible. Sélectionnez le texte manuellement.', 'error');
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <code
          className={`min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white ${
            mono ? 'font-mono tracking-wide' : ''
          }`}
        >
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copier ${label}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-togo-green dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {copied ? <Check className="h-5 w-5 text-togo-green" /> : <Copy className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
