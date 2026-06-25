import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Eye,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Users2,
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import StatusBadge from '../../components/dashboard/StatusBadge';
import LeadEditForm from '../../components/dashboard/LeadEditForm';
import { PageLoader } from '../../components/ui/Spinner';
import SearchBar from '../../components/ui/SearchBar';
import SearchEmptyState from '../../components/ui/SearchEmptyState';
import { useToast } from '../../components/ui/Toast';
import { buildAdminNav } from '../../lib/adminNav';
import { api, ApiError } from '../../lib/api';
import { formatLocation } from '../../lib/location';
import { mediaUrl } from '../../lib/media';
import { filterBySearch } from '../../lib/search';
import type { Community, LeadDetail, LeadSummary } from '../../types';

export default function AdminLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const res = await api.adminGetLead(Number(id));
      setLead(res.data.lead);
      setCommunities(res.data.communities);
    } catch {
      notify('Lead introuvable.', 'error');
      navigate('/admin', { state: { tab: 'leads' } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const filteredCommunities = useMemo(
    () =>
      filterBySearch(communities, search, (c) => [c.name, c.city, c.country, c.status, c.description]),
    [communities, search],
  );

  const nav = buildAdminNav();

  if (loading) {
    return (
      <DashboardLayout
        title="Chargement..."
        nav={nav}
        active="leads"
        onNavigate={(tab) => navigate(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`)}
      >
        <PageLoader />
      </DashboardLayout>
    );
  }

  if (!lead) return null;

  const leadSummary: LeadSummary = {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    createdAt: lead.createdAt,
    communitiesCount: lead.communitiesCount,
  };

  return (
    <DashboardLayout
      title={lead.name}
      subtitle="Profil lead & solutions SaaS associées"
      nav={nav}
      active="leads"
      onNavigate={(tab) => navigate(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`)}
    >
      <div className="sticky top-[4.5rem] z-20 -mx-4 mb-8 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:-mx-8 sm:px-8">
        <button
          onClick={() => navigate('/admin?tab=leads')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Retour
        </button>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() => navigate(`/admin/communautes/nouvelle?lead=${lead.id}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-togo-green/40 px-4 py-2.5 text-sm font-semibold text-togo-green transition-colors hover:bg-togo-green/10 dark:text-togo-yellow dark:hover:bg-togo-yellow/10"
          >
            <Plus className="h-4 w-4" /> Ajouter une solution SaaS
          </button>
          <a
            href={`mailto:${lead.email}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-sky-500 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:bg-sky-950/40 dark:hover:text-sky-300"
          >
            <Mail className="h-4 w-4" /> Contacter
          </a>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark"
          >
            <Pencil className="h-4 w-4" /> Modifier
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 lg:col-span-1">
          <div className="flex items-center gap-5">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-togo-green text-2xl font-black text-white">
              {lead.name.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white">{lead.name}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{lead.communitiesCount} communauté(s)</p>
            </div>
          </div>

          <dl className="mt-8 space-y-5 text-sm">
            <InfoRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />
            {lead.phone && <InfoRow icon={Phone} label="Téléphone" value={lead.phone} />}
            <InfoRow
              icon={Calendar}
              label="Inscrit le"
              value={new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            />
          </dl>
        </div>

        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Communautés gérées</h2>
              {communities.length > 1 && (
                <div className="mt-3">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Rechercher une communauté…"
                    size="sm"
                    resultCount={filteredCommunities.length}
                    totalCount={communities.length}
                  />
                </div>
              )}
            </div>

            {communities.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">Aucune communauté pour ce lead.</p>
            ) : filteredCommunities.length === 0 ? (
              <div className="px-4 py-8">
                <SearchEmptyState query={search.trim()} />
              </div>
            ) : (
              <>
                <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 sm:grid">
                  <span className="col-span-5">Communauté</span>
                  <span className="col-span-3">Localisation</span>
                  <span className="col-span-2">Statut</span>
                  <span className="col-span-2 text-right">Action</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCommunities.map((c) => (
                    <div key={c.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
                      <div className="col-span-9 flex min-w-0 items-center gap-3 sm:col-span-5">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-togo-green/10 to-togo-yellow/10 ring-1 ring-slate-200 dark:ring-slate-700">
                          {c.logoUrl ? (
                            <img src={mediaUrl(c.logoUrl)} alt={c.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-sm font-black text-togo-green">{c.name.charAt(0)}</span>
                          )}
                        </div>
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                      </div>
                      <div className="col-span-3 hidden truncate text-sm text-slate-500 sm:block">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-togo-red" />{formatLocation(c)}</span>
                      </div>
                      <div className="col-span-2 hidden sm:block"><StatusBadge status={c.status} /></div>
                      <div className="col-span-3 flex justify-end sm:col-span-2">
                        {c.id && (
                          <button
                            onClick={() => navigate(`/admin/communautes/${c.id}`)}
                            title="Voir la fiche"
                            className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <LeadEditForm
          initial={leadSummary}
          onClose={() => setEditing(false)}
          onSubmit={async (data) => {
            if (!lead.id) return;
            try {
              await api.adminUpdateLead(lead.id, data);
              notify('Lead mis à jour.', 'success');
              setEditing(false);
              await load();
            } catch (err) {
              if (err instanceof ApiError) notify(err.message, 'error');
              throw err;
            }
          }}
        />
      )}
    </DashboardLayout>
  );
}

function InfoRow({ icon: Icon, label, value, href }: { icon: any; label: string; value: string; href?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
        <Icon className="h-4 w-4 text-slate-400" />
        {href ? (
          <a href={href} className="text-togo-green transition-colors hover:text-togo-green-dark hover:underline dark:text-togo-yellow dark:hover:text-yellow-300">
            {value}
          </a>
        ) : value}
      </dd>
    </div>
  );
}
