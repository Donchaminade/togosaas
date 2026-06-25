import { useEffect } from 'react';
import type * as React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Maximize2,
  Pencil,
  Phone,
  Trash2,
  User2,
  X,
  XCircle,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getActiveSocialLinks } from '../../lib/socialLinks';
import { formatLocation } from '../../lib/location';
import { mediaUrl } from '../../lib/media';
import type { Community } from '../../types';

interface Props {
  community: Community | null;
  onClose: () => void;
  onEdit: (c: Community) => void;
  onStatus: (c: Community, status: 'approved' | 'rejected' | 'pending') => void;
  onDelete: (c: Community) => void;
}

export default function CommunityAdminDrawer({ community, onClose, onEdit, onStatus, onDelete }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (community) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKey);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [community, onClose]);

  if (!community) return null;

  const links = getActiveSocialLinks(community);

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl animate-rise dark:bg-slate-950"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5 dark:border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Aperçu rapide</h2>
          <div className="flex items-center gap-2">
            {community.id && (
              <Link
                to={`/admin/communautes/${community.id}`}
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-togo-green hover:bg-togo-green/5 hover:text-togo-green dark:border-slate-700 dark:text-slate-300 dark:hover:border-togo-yellow dark:hover:text-togo-yellow"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Plein écran
              </Link>
            )}
            <button
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-8">
          {/* Bannière miniature */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative h-32">
              {community.bannerUrl ? (
                <img src={mediaUrl(community.bannerUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full bg-gradient-to-br from-togo-green to-togo-green-dark" />
              )}
            </div>
            <div className="flex items-start gap-5 bg-slate-50 p-5 dark:bg-slate-900">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white dark:ring-slate-800">
                {community.logoUrl ? (
                  <img src={mediaUrl(community.logoUrl)} alt={community.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green/15 to-togo-yellow/15 text-2xl font-black text-togo-green">
                    {community.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">{community.name}</h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4 text-togo-red" /> {formatLocation(community)}
                </p>
                <div className="mt-3">
                  <StatusBadge status={community.status} />
                </div>
              </div>
            </div>
          </div>

          {community.shortDescription && (
            <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300">{community.shortDescription}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            {community.tags.map((t) => (
              <span key={t} className="rounded-full bg-togo-green/10 px-3 py-1.5 text-xs font-bold text-togo-green dark:bg-togo-yellow/10 dark:text-togo-yellow">
                {t}
              </span>
            ))}
          </div>

          <p className="mt-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{community.description}</p>

          <Section title="Responsable">
            <Info icon={User2} value={community.leaderName} />
            {community.leaderEmail && <Info icon={Mail} value={community.leaderEmail} href={`mailto:${community.leaderEmail}`} />}
            {community.leaderPhone && <Info icon={Phone} value={community.leaderPhone} />}
          </Section>

          {(community.ownerName || community.ownerEmail) && (
            <Section title="Compte lead">
              {community.ownerName && <Info icon={User2} value={community.ownerName} />}
              {community.ownerEmail && <Info icon={Mail} value={community.ownerEmail} href={`mailto:${community.ownerEmail}`} />}
            </Section>
          )}

          {links.length > 0 && (
            <Section title="Liens & réseaux">
              <div className="grid gap-3 sm:grid-cols-2">
                {links.map((l) => (
                  <a
                    key={l.key as string}
                    href={community[l.key] as string}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-semibold transition-all duration-200 ${l.btn}`}
                  >
                    <l.icon className="h-5 w-5" /> {l.label}
                  </a>
                ))}
              </div>
            </Section>
          )}

          {community.id && (
            <a
              href={`/communautes/${community.id}`}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-togo-green transition-colors hover:text-togo-green-dark hover:underline dark:text-togo-yellow dark:hover:text-yellow-300"
            >
              <ExternalLink className="h-4 w-4" /> Voir la page publique
            </a>
          )}

          <p className="mt-8 text-xs text-slate-400">
            Créée le {community.createdAt ? new Date(community.createdAt).toLocaleDateString('fr-FR') : '—'}
            {community.updatedAt ? ` · MàJ le ${new Date(community.updatedAt).toLocaleDateString('fr-FR')}` : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 border-t border-slate-200 px-8 py-6 dark:border-slate-800">
          <button
            onClick={() => onEdit(community)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-togo-green px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-togo-green/20 transition-all hover:bg-togo-green-dark hover:shadow-togo-green/40"
          >
            <Pencil className="h-4 w-4" /> Modifier les informations
          </button>
          <div className="flex flex-wrap gap-3">
            {community.status !== 'approved' && (
              <button
                onClick={() => onStatus(community, 'approved')}
                className="flex flex-1 min-w-[7rem] items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs font-bold text-emerald-800 transition-all duration-200 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white"
              >
                <CheckCircle2 className="h-4 w-4" /> Approuver
              </button>
            )}
            {community.status !== 'pending' && (
              <button
                onClick={() => onStatus(community, 'pending')}
                className="flex flex-1 min-w-[7rem] items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs font-bold text-amber-800 transition-all duration-200 hover:border-amber-500 hover:bg-amber-500 hover:text-white dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-600 dark:hover:text-white"
              >
                <Clock className="h-4 w-4" /> Attente
              </button>
            )}
            {community.status === 'pending' && (
              <button
                onClick={() => onStatus(community, 'rejected')}
                className="flex flex-1 min-w-[7rem] items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs font-bold text-rose-700 transition-all duration-200 hover:border-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white"
              >
                <XCircle className="h-4 w-4" /> Rejeter
              </button>
            )}
          </div>
          <button
            onClick={() => onDelete(community)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-5 py-3.5 text-sm font-bold text-rose-700 transition-all duration-200 hover:border-rose-600 hover:bg-rose-600 hover:text-white dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300 dark:hover:bg-rose-600 dark:hover:text-white"
          >
            <Trash2 className="h-4 w-4" /> Supprimer
          </button>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Info({ icon: Icon, value, href }: { icon: any; value: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
      <Icon className="h-4 w-4 shrink-0 text-slate-400" />
      {href ? (
        <a href={href} className="text-sm font-medium text-togo-green transition-colors hover:text-togo-green-dark hover:underline dark:text-togo-yellow dark:hover:text-yellow-300">
          {value}
        </a>
      ) : (
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>
      )}
    </div>
  );
}
