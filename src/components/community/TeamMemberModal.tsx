import { BadgeCheck } from 'lucide-react';
import Modal from '../ui/Modal';
import { mediaUrl } from '../../lib/media';
import { getMemberLinks, type MemberLinkSource } from '../../lib/socialLinks';

export interface TeamMemberView {
  name: string;
  role?: string | null;
  badge?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  verified?: boolean;
  links: MemberLinkSource;
}

/** Rangée compacte d'icônes de liens sociaux (affichée sur la carte). */
export function MemberLinkIcons({ links, className = '' }: { links: MemberLinkSource; className?: string }) {
  const items = getMemberLinks(links);
  if (items.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map((l) => (
        <a
          key={l.kind}
          href={l.href}
          {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
          onClick={(e) => e.stopPropagation()}
          aria-label={l.label}
          title={l.label}
          className={`grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors dark:bg-slate-800 dark:text-slate-400 ${l.hover}`}
        >
          <l.icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

/** Modale détaillée d'un membre d'équipe (photo, nom, rôle, bio complète, liens). */
export default function TeamMemberModal({ member, onClose }: { member: TeamMemberView; onClose: () => void }) {
  const links = getMemberLinks(member.links);
  return (
    <Modal title={member.name} onClose={onClose} maxWidth="md">
      <div className="px-6 py-6">
        <div className="flex flex-col items-center text-center">
          <div className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-white shadow-md dark:ring-slate-800">
            {member.photoUrl ? (
              <img src={mediaUrl(member.photoUrl)} alt={member.name} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center bg-gradient-to-br from-togo-green to-togo-green-dark text-3xl font-black text-white">
                {member.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            <p className="text-xl font-black text-slate-900 dark:text-white">{member.name}</p>
            {member.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />}
          </div>

          {(member.badge || member.role) && (
            <span className="mt-2 rounded-full bg-togo-green/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-togo-green dark:bg-togo-yellow/10 dark:text-togo-yellow">
              {member.badge || member.role}
            </span>
          )}
        </div>

        {member.bio && (
          <p className="mt-5 whitespace-pre-line border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300">
            {member.bio}
          </p>
        )}

        {links.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
            {links.map((l) => (
              <a
                key={l.kind}
                href={l.href}
                {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors dark:border-slate-700 dark:text-slate-300 ${l.hover}`}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
