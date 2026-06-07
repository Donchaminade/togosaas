import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import CommunityForm from '../../components/dashboard/CommunityForm';
import CommunityEventsManager from '../../components/dashboard/CommunityEventsManager';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { buildLeadNav } from '../../lib/leadNav';
import type { Community } from '../../types';

export default function LeadCommunityEdit() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isNew = !id || id === 'nouvelle';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [tab, setTab] = useState<'fiche' | 'evenements'>(() =>
    searchParams.get('tab') === 'evenements' ? 'evenements' : 'fiche',
  );

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        const res = await api.getLeadCommunity(Number(id));
        setCommunity(res.data.community);
      } catch {
        notify('Communauté introuvable.', 'error');
        navigate('/espace-lead');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, navigate, notify]);

  const handleSubmit = async (data: Partial<Community>) => {
    try {
      if (isNew) {
        await api.createCommunity({
          ...data,
          leaderName: data.leaderName || user?.name || '',
          leaderEmail: data.leaderEmail || user?.email || '',
        });
        notify('Communauté soumise ! En attente de validation.', 'success');
      } else if (community?.id) {
        await api.updateCommunity(community.id, data);
        const msg = community.membershipRole === 'co_lead'
          ? 'Modifications enregistrées.'
          : 'Communauté mise à jour. Elle repasse en validation.';
        notify(msg, 'success');
      }
      navigate('/espace-lead');
    } catch (err) {
      if (err instanceof ApiError) {
        notify(err.message, 'error');
        throw err;
      }
    }
  };

  const nav = buildLeadNav();
  const goLead = (tab: string) => {
    if (tab === 'overview') navigate('/espace-lead');
    else navigate(`/espace-lead/${tab}`);
  };
  const activeSection = isNew ? 'nouvelle' : 'communautes';

  if (loading) {
    return (
      <DashboardLayout title="Chargement…" subtitle="" nav={nav} active={activeSection} onNavigate={goLead}>
        <PageLoader label="Chargement de la communauté..." />
      </DashboardLayout>
    );
  }

  const membershipRole = community?.membershipRole ?? 'owner';
  const title = isNew ? 'Nouvelle communauté' : community?.name ?? 'Modifier';

  return (
    <DashboardLayout
      title={title}
      subtitle={isNew ? 'Remplissez la fiche de votre communauté' : 'Gérez les informations et événements'}
      nav={nav}
      active={activeSection}
      onNavigate={goLead}
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          to="/espace-lead"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-togo-green dark:text-slate-400 dark:hover:text-togo-yellow"
        >
          <ArrowLeft className="h-4 w-4" /> Retour au dashboard
        </Link>
        {!isNew && community && (
          <StatusBadge status={community.status} />
        )}
        {membershipRole === 'co_lead' && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
            Co-lead
          </span>
        )}
      </div>

      {!isNew && community && (
        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-800">
          <TabBtn active={tab === 'fiche'} onClick={() => setTab('fiche')}>Fiche</TabBtn>
          <TabBtn active={tab === 'evenements'} onClick={() => setTab('evenements')}>Événements</TabBtn>
        </div>
      )}

      {(isNew || tab === 'fiche') && (
        <div className="max-w-3xl">
          <CommunityForm
            initial={isNew ? null : community}
            membershipRole={membershipRole}
            onSubmit={handleSubmit}
          />
        </div>
      )}

      {!isNew && tab === 'evenements' && community && (
        <CommunityEventsManager community={community} inline />
      )}
    </DashboardLayout>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
        active
          ? 'border-togo-green text-togo-green dark:border-togo-yellow dark:text-togo-yellow'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  );
}
