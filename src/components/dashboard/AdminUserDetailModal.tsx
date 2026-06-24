import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ExternalLink, Mail, Phone, Shield, UserCog, Users2, X } from 'lucide-react';
import StatusBadge from './StatusBadge';
import UserAvatar from '../ui/UserAvatar';
import Spinner from '../ui/Spinner';
import { api } from '../../lib/api';
import { formatLocation } from '../../lib/location';
import type { AdminUserDetail, Community } from '../../types';

interface Props {
  userId: number;
  onClose: () => void;
}

export default function AdminUserDetailModal({ userId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .adminGetUser(userId)
      .then((res) => {
        if (!cancelled) {
          setUser(res.data.user);
          setCommunities(res.data.communities);
        }
      })
      .catch(() => {
        if (!cancelled) onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <p className="text-lg font-black text-slate-900 dark:text-white">Détails utilisateur</p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="h-8 w-8 text-togo-green" />
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">{user.name}</h2>
                  <div className="mt-2">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold uppercase text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                        <Shield className="h-3 w-3" /> Administrateur
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold uppercase text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                        <UserCog className="h-3 w-3" /> Lead
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailRow icon={Mail} label="Email">
                  <a href={`mailto:${user.email}`} className="font-semibold text-togo-green hover:underline dark:text-togo-yellow">
                    {user.email}
                  </a>
                </DetailRow>
                <DetailRow icon={Phone} label="Téléphone">
                  {user.phone || '—'}
                </DetailRow>
                <DetailRow icon={Calendar} label="Inscription">
                  {new Date(user.createdAt).toLocaleString('fr-FR')}
                </DetailRow>
                {user.updatedAt && (
                  <DetailRow icon={Calendar} label="Dernière mise à jour">
                    {new Date(user.updatedAt).toLocaleString('fr-FR')}
                  </DetailRow>
                )}
                {user.role === 'lead' && (
                <DetailRow icon={Users2} label="Solutions SaaS">
                    {user.communitiesCount}
                  </DetailRow>
                )}
              </dl>

              {user.role === 'lead' && communities.length > 0 && (
                <div>
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                    Ce lead ne peut pas être supprimé tant qu&apos;il est responsable de {communities.length}{' '}
                    solution SaaS{communities.length > 1 ? 's' : ''}. Supprimez ces solutions SaaS ou réassignez le rôle de
                    responsable à un co-lead.
                  </div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Solutions SaaS</h3>
                  <div className="space-y-2">
                    {communities.map((c) => (
                      <Link
                        key={c.id}
                        to={`/admin/communautes/${c.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                          <p className="truncate text-xs text-slate-500">{formatLocation(c)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <StatusBadge status={c.status} />
                          <ExternalLink className="h-4 w-4 text-slate-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {user.role === 'lead' && (
                <Link
                  to={`/admin/leads/${user.id}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-togo-green hover:underline dark:text-togo-yellow"
                >
                  Ouvrir la fiche lead complète <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900/50">
      <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-700 dark:text-slate-200">{children}</dd>
    </div>
  );
}
