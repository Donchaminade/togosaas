import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ExternalLink,
  Linkedin,
  Mail,
  Pencil,
  ShieldCheck,
  UserPlus,
  Users,
  Users2,
  AlertCircle,
} from 'lucide-react';
import { mediaUrl } from '../../lib/media';
import { filterBySearch } from '../../lib/search';
import SearchBar from '../ui/SearchBar';
import SearchEmptyState from '../ui/SearchEmptyState';
import type { CoLead, Community } from '../../types';

interface Props {
  communities: Community[];
}

export default function LeadCoLeadsPanel({ communities }: Props) {
  const [search, setSearch] = useState('');
  const owned = communities.filter((c) => c.membershipRole !== 'co_lead');

  const stats = useMemo(() => {
    let total = 0;
    let withAccess = 0;
    owned.forEach((c) => {
      (c.coLeads ?? []).forEach((cl) => {
        total += 1;
        if (cl.email?.trim()) withAccess += 1;
      });
    });
    return { communities: owned.length, total, withAccess, pending: total - withAccess };
  }, [owned]);

  const filteredOwned = useMemo(() => {
    if (!search.trim()) return owned;
    return owned
      .map((c) => {
        const coLeads = filterBySearch(c.coLeads ?? [], search, (cl) => [
          cl.name,
          cl.email,
          cl.role,
          cl.bio,
        ]);
        const communityMatch = filterBySearch([c], search, (x) => [x.name, x.city, x.country]).length > 0;
        if (communityMatch) return c;
        if (coLeads.length > 0) return { ...c, coLeads };
        return null;
      })
      .filter((c): c is Community => c !== null);
  }, [owned, search]);

  if (owned.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
        <Users className="mx-auto h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-bold text-slate-700 dark:text-slate-200">
          Gestion réservée au responsable principal
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
          En tant que co-lead, vous ne pouvez pas inviter d&apos;autres membres. Contactez le lead de la communauté.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users2} label="Communautés" value={stats.communities} tone="green" />
        <StatTile icon={Users} label="Co-leads au total" value={stats.total} tone="sky" />
        <StatTile icon={ShieldCheck} label="Accès dashboard" value={stats.withAccess} tone="emerald" />
        <StatTile icon={AlertCircle} label="Email à renseigner" value={stats.pending} tone="amber" />
      </div>

      {(owned.length > 0 || stats.total > 0) && (
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une communauté ou un co-lead…"
          size="sm"
          resultCount={filteredOwned.length}
          totalCount={owned.length}
        />
      )}

      {search.trim() && filteredOwned.length === 0 ? (
        <SearchEmptyState query={search.trim()} />
      ) : (
      <>
      {/* Liste par communauté */}
      {filteredOwned.map((c) => (
        <CommunityCoLeadsSection key={c.id} community={c} searchQuery={search} />
      ))}

      {stats.total === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-900/30">
          <UserPlus className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Aucun co-lead enregistré pour l&apos;instant
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            Ouvrez une fiche communauté pour ajouter les membres de votre équipe.
          </p>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function CommunityCoLeadsSection({ community: c, searchQuery = '' }: { community: Community; searchQuery?: string }) {
  const coLeads = useMemo(() => {
    const list = c.coLeads ?? [];
    if (!searchQuery.trim()) return list;
    const communityMatch = filterBySearch([c], searchQuery, (x) => [x.name, x.city, x.country]).length > 0;
    if (communityMatch) return list;
    return filterBySearch(list, searchQuery, (cl) => [cl.name, cl.email, cl.role, cl.bio]);
  }, [c, searchQuery]);
  const withAccess = coLeads.filter((cl) => cl.email?.trim()).length;

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* En-tête communauté */}
      <div className="relative border-b border-slate-100 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-r from-togo-green/8 via-transparent to-togo-yellow/5 dark:from-togo-green/15 dark:to-togo-yellow/10" />
        <div className="relative flex flex-wrap items-center gap-4 px-5 py-5 sm:px-6">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white shadow-md dark:ring-slate-800">
            {c.logoUrl ? (
              <img src={mediaUrl(c.logoUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green to-togo-green-dark text-xl font-black text-white">
                {c.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-black text-slate-900 dark:text-white">{c.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Users className="h-3 w-3" />
                {coLeads.length} co-lead{coLeads.length !== 1 ? 's' : ''}
              </span>
              {coLeads.length > 0 && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    withAccess === coLeads.length
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                  }`}
                >
                  {withAccess}/{coLeads.length} avec accès
                </span>
              )}
            </div>
          </div>
          <Link
            to={`/espace-lead/communautes/${c.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark"
          >
            <Pencil className="h-4 w-4" />
            {coLeads.length === 0 ? 'Ajouter un co-lead' : 'Modifier l\'équipe'}
          </Link>
        </div>
      </div>

      {coLeads.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <UserPlus className="h-8 w-8 text-slate-400" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Équipe vide pour cette communauté
          </p>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Ajoutez vos co-responsables pour qu&apos;ils puissent co-gérer la fiche depuis l&apos;espace lead.
          </p>
          <Link
            to={`/espace-lead/communautes/${c.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-togo-green/30 bg-togo-green/5 px-4 py-2.5 text-sm font-bold text-togo-green transition-colors hover:bg-togo-green hover:text-white dark:text-togo-yellow dark:hover:text-white"
          >
            <UserPlus className="h-4 w-4" /> Inviter un co-lead
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
          {coLeads.map((cl, i) => (
            <CoLeadCard key={`${cl.email ?? cl.name}-${i}`} coLead={cl} communityId={c.id!} />
          ))}
        </div>
      )}
    </section>
  );
}

function CoLeadCard({ coLead: cl, communityId }: { coLead: CoLead; communityId: number }) {
  const hasAccess = Boolean(cl.email?.trim());

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border transition-shadow hover:shadow-md ${
        hasAccess
          ? 'border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/40'
          : 'border-amber-200/80 bg-amber-50/30 dark:border-amber-500/25 dark:bg-amber-500/5'
      }`}
    >
      {/* Bandeau statut */}
      <div
        className={`flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wide ${
          hasAccess
            ? 'bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
            : 'bg-amber-500/10 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'
        }`}
      >
        {hasAccess ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" /> Accès dashboard actif
          </>
        ) : (
          <>
            <AlertCircle className="h-3.5 w-3.5" /> Email Togosaas manquant
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-2 ring-white shadow-sm dark:ring-slate-700">
            {cl.photoUrl ? (
              <img src={mediaUrl(cl.photoUrl)} alt={cl.name} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green/20 to-togo-yellow/20 text-lg font-black text-togo-green dark:text-togo-yellow">
                {cl.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="truncate font-bold text-slate-900 dark:text-white">{cl.name}</p>
            {cl.role && (
              <p className="mt-0.5 text-xs font-semibold text-togo-green dark:text-togo-yellow">{cl.role}</p>
            )}
          </div>
        </div>

        {cl.bio && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{cl.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {hasAccess ? (
            <a
              href={`mailto:${cl.email}`}
              className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:text-togo-green dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-600 dark:hover:text-togo-yellow"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{cl.email}</span>
            </a>
          ) : (
            <Link
              to={`/espace-lead/communautes/${communityId}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-2.5 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-100"
            >
              <Pencil className="h-3.5 w-3.5" /> Renseigner l&apos;email
            </Link>
          )}
          {cl.linkedinUrl && (
            <a
              href={cl.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 transition-colors hover:text-sky-600 dark:bg-slate-900 dark:ring-slate-600 dark:hover:text-sky-400"
            >
              <Linkedin className="h-3.5 w-3.5" /> LinkedIn
              <ExternalLink className="h-3 w-3 opacity-50" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: 'green' | 'sky' | 'emerald' | 'amber';
}) {
  const tones = {
    green: 'text-togo-green bg-togo-green/10',
    sky: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-400',
    emerald: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-400',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
