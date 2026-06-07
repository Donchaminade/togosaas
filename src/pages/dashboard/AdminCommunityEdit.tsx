import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import CommunityForm from '../../components/dashboard/CommunityForm';
import StatusBadge from '../../components/dashboard/StatusBadge';
import { PageLoader } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { buildAdminNav } from '../../lib/adminNav';
import { api, ApiError } from '../../lib/api';
import type { Community } from '../../types';

export default function AdminCommunityEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  const nav = buildAdminNav();
  const goAdminTab = (tab: string) => navigate(tab === 'overview' ? '/admin' : `/admin?tab=${tab}`);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api.getCommunity(Number(id), true);
        setCommunity(res.data.community);
      } catch {
        notify('Communauté introuvable.', 'error');
        navigate('/admin?tab=communities');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, notify]);

  const handleSubmit = async (data: Partial<Community>) => {
    if (!community?.id) return;
    try {
      await api.adminUpdateCommunity(community.id, data);
      notify('Communauté mise à jour.', 'success');
      navigate(`/admin/communautes/${community.id}`);
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
        title="Chargement…"
        subtitle=""
        nav={nav}
        active="communities"
        onNavigate={goAdminTab}
      >
        <PageLoader label="Chargement de la communauté…" />
      </DashboardLayout>
    );
  }

  if (!community) return null;

  return (
    <DashboardLayout
      title="Modifier la communauté"
      subtitle={community.name}
      nav={nav}
      active="communities"
      onNavigate={goAdminTab}
    >
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          to={`/admin/communautes/${community.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-togo-green dark:text-slate-400 dark:hover:text-togo-yellow"
        >
          <ArrowLeft className="h-4 w-4" /> Retour à la fiche
        </Link>
        <StatusBadge status={community.status} />
      </div>

      <div className="max-w-3xl">
        <CommunityForm initial={community} onSubmit={handleSubmit} />
      </div>
    </DashboardLayout>
  );
}
