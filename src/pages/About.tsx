import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Github,
  Heart,
  Linkedin,
  MapPin,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Twitter,
  Users,
  Zap,
} from 'lucide-react';
import ScrollReveal, { StaggerReveal } from '../components/motion/ScrollReveal';
import { PageLoader } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import type { SiteAuthor } from '../types';

import { DIAPO } from '../data/heroSlides';

const PILLARS = [
  {
    icon: Trophy,
    label: 'Notre mission',
    text: 'Recenser, valoriser et connecter les communautés togolaises — tech, créatives, citoyennes ou associatives — pour qu’aucune initiative locale ne reste invisible.',
    color: 'text-togo-red',
    bg: 'bg-togo-red/10',
  },
  {
    icon: Target,
    label: 'Notre vision',
    text: 'Faire de T.C.H la référence nationale pour découvrir, rejoindre et faire grandir l’écosystème communautaire du Togo, de Lomé aux régions.',
    color: 'text-togo-green',
    bg: 'bg-togo-green/10',
  },
  {
    icon: Users,
    label: 'Pour qui ?',
    text: 'Membres, curieux, partenaires et responsables de communautés (leads) : une vitrine publique pour les uns, un tableau de bord autonome pour les autres.',
    color: 'text-togo-yellow',
    bg: 'bg-togo-yellow/15',
  },
  {
    icon: Shield,
    label: 'Notre engagement',
    text: 'Des fiches validées, une modération attentive et un espace de confiance où chaque communauté présente son identité, ses événements et ses contacts en toute clarté.',
    color: 'text-togo-red',
    bg: 'bg-togo-red/10',
  },
];

const OFFERINGS = [
  {
    icon: Search,
    title: 'Annuaire intelligent',
    text: 'Filtrez par ville, thématique ou mot-clé — GDG, cybersécurité, design, data science, inclusion — et trouvez la communauté qui vous correspond.',
  },
  {
    icon: MapPin,
    title: 'Ancrage territorial',
    text: 'Chaque fiche situe la communauté sur la carte du Togo : Lomé, Kara, Sokodé et au-delà. Proximité géographique, impact local.',
  },
  {
    icon: Zap,
    title: 'Mise en relation directe',
    text: 'WhatsApp, Telegram, LinkedIn, site web : accédez aux bons contacts sans intermédiaire. Rejoignez un meetup, un atelier ou un hackathon en quelques clics.',
  },
  {
    icon: Sparkles,
    title: 'Visibilité pour les leads',
    text: 'Les responsables gèrent leur fiche, leurs événements et leur galerie depuis un espace dédié. Exposer sa communauté, c’est lui donner la place qu’elle mérite.',
  },
];

const KEYWORDS = [
  'Communautés togolaises',
  'Annuaire Togo',
  'Tech & innovation',
  'Meetups & événements',
  'Écosystème digital',
  'Inclusion & diversité',
  'Lomé & régions',
  'Mise en relation',
  'Open source',
  'Citoyenneté numérique',
];

export default function About() {
  const [author, setAuthor] = useState<SiteAuthor | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);

  useEffect(() => {
    api.getAuthor()
      .then((res) => setAuthor(res.data.author))
      .catch(() => setAuthor(null))
      .finally(() => setLoadingAuthor(false));
  }, []);

  const nameParts = author?.name?.trim().split(/\s+/) ?? [];
  const highlightName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : author?.name ?? '';
  const namePrefix = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : 'Qui est';

  const socials = author
    ? [
        { icon: Linkedin, href: author.linkedinUrl, label: 'LinkedIn' },
        { icon: Github, href: author.githubUrl, label: 'GitHub' },
        { icon: Twitter, href: author.twitterUrl, label: 'Twitter' },
      ].filter((s) => s.href)
    : [];

  return (
    <div className="about-page">
      {/* Hero plein écran */}
      <section className="relative flex min-h-[72vh] items-center justify-center overflow-hidden sm:min-h-[78vh]">
        <img
          src={DIAPO.aboutHero}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,106,78,0.25)_0%,transparent_55%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 pt-below-nav text-center sm:px-6">
          <span className="inline-block rounded-full bg-togo-red px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-togo-red/30">
            À propos de nous
          </span>
          <h1 className="mt-8 text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            L&apos;histoire d&apos;une vision
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            <strong className="font-semibold text-white">Togo Communities Hub</strong> (T.C.H) est
            le premier hub national dédié au recensement, à la valorisation et à la mise en
            relation des communautés togolaises — un pont entre les talents, les initiatives
            locales et celles qui cherchent à les rejoindre.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-togo-green via-togo-yellow to-togo-red" />
      </section>

      {/* Qu'est-ce que TCH ? */}
      <section className="bg-white py-20 dark:bg-slate-950 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal variant="fade-up">
              <div>
                <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Qu&apos;est-ce que{' '}
                  <span className="text-togo-green dark:text-togo-yellow">Togo Communities Hub</span>{' '}
                  ?
                </h2>
                <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                  Au Togo, des centaines de communautés dynamisent le paysage numérique, culturel
                  et citoyen : groupes de développeurs, collectifs créatifs, associations
                  d&apos;entraide, clubs étudiants, réseaux professionnels… Pourtant, les
                  retrouver reste souvent un parcours du combattant — informations éparpillées,
                  contacts absents, visibilité limitée.
                </p>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                  <strong className="font-semibold text-slate-800 dark:text-white">T.C.H</strong>{' '}
                  répond à ce besoin avec une plateforme claire et moderne : un{' '}
                  <strong className="font-semibold text-slate-800 dark:text-white">
                    annuaire des communautés togolaises
                  </strong>{' '}
                  où chaque groupe dispose d&apos;une fiche publique soignée, modérée et
                  régulièrement mise à jour par ses responsables.
                </p>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                  Que vous cherchiez un{' '}
                  <em>meetup tech à Lomé</em>, un cercle de mentorat, une communauté UX/UI ou un
                  réseau d&apos;entrepreneurs, T.C.H centralise l&apos;information pour
                  accélérer la découverte, la collaboration et l&apos;impact collectif.
                </p>

                <div className="mt-10 space-y-8">
                  {PILLARS.map((p) => (
                    <div key={p.label} className="flex gap-5">
                      <span
                        className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${p.bg} ${p.color}`}
                      >
                        <p.icon className="h-6 w-6" />
                      </span>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                          {p.label}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                          {p.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="gentle-in" delay={120}>
              <div className="relative">
                <div className="absolute -left-4 -top-4 h-full w-full rounded-3xl bg-togo-green/20 dark:bg-togo-green/30" />
                <div className="absolute -bottom-4 -right-4 h-full w-full rounded-3xl bg-togo-yellow/30 dark:bg-togo-yellow/20" />
                <img
                  src={DIAPO.aboutSection}
                  alt="Communauté en événement"
                  className="relative z-10 aspect-[4/5] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 lg:aspect-[3/4]"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Ce que T.C.H vous apporte */}
      <section className="border-t border-slate-100 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-togo-green dark:text-togo-yellow">
                Fonctionnalités clés
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Ce que <span className="text-togo-green dark:text-togo-yellow">T.C.H</span> vous apporte
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                Une plateforme pensée pour l&apos;écosystème communautaire togolais : découverte,
                transparence, autonomie et confiance.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERINGS.map((item, i) => (
              <StaggerReveal key={item.title} index={i} variant="gentle-up">
                <article className="motion-hover-lift flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-togo-green/10 text-togo-green dark:bg-togo-green/20 dark:text-togo-yellow">
                    <item.icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-sm font-black uppercase tracking-wide text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.text}
                  </p>
                </article>
              </StaggerReveal>
            ))}
          </div>

          <ScrollReveal variant="fade-up" delay={200}>
            <div className="mt-14 flex flex-wrap justify-center gap-2">
              {KEYWORDS.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                >
                  {kw}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Genèse du projet */}
      <section className="bg-white py-20 dark:bg-slate-950 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up">
            <div className="overflow-hidden rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-amber-50/60 p-8 text-center shadow-sm dark:border-rose-500/20 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-950 sm:p-10">
              <Heart className="mx-auto h-8 w-8 fill-togo-red text-togo-red" />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-togo-red dark:text-rose-400">
                La genèse de T.C.H
              </p>
              <p className="mt-5 text-base leading-relaxed text-slate-700 dark:text-slate-200 sm:text-lg">
                L&apos;idée de <strong>Togo Communities Hub</strong> est née d&apos;une
                conviction simple : au Togo, l&apos;énergie collective existe déjà — il manquait
                un lieu unique pour la rendre visible, accessible et durable.
              </p>
              <p className="mt-4 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                C&apos;est avec{' '}
                <span className="text-togo-green dark:text-togo-yellow">Mardiya TCHAKEY</span>{' '}
                que cette vision a pris forme.
              </p>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                Ce hub des communautés togolaises porte la trace de cette genèse — avec gratitude,
                affection et la volonté de servir un écosystème qui mérite d&apos;être célébré.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Le fondateur */}
      <section className="bg-slate-100 py-20 dark:bg-black lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loadingAuthor ? (
            <PageLoader label="Chargement du profil..." />
          ) : author ? (
            <ScrollReveal variant="fade-up">
              <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950 sm:p-12 lg:p-14">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                  {/* Texte */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.25em] text-togo-green dark:text-togo-yellow">
                      Le fondateur
                    </p>
                    <h2 className="mt-4 text-3xl font-black uppercase leading-tight text-slate-900 dark:text-white sm:text-4xl">
                      {namePrefix}{' '}
                      <span className="text-togo-red">{highlightName}</span>
                      ?
                    </h2>
                    {author.roleLabel && (
                      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {author.roleLabel}
                      </p>
                    )}
                    {author.quote && (
                      <p className="mt-6 leading-relaxed text-slate-600 dark:text-slate-300">
                        « {author.quote} »
                      </p>
                    )}
                    {author.bio && (
                      <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">
                        {author.bio}
                      </p>
                    )}

                    {socials.length > 0 && (
                      <div className="mt-8 flex flex-wrap gap-3">
                        {socials.map(({ icon: Icon, href, label }) => (
                          <a
                            key={label}
                            href={href!}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={label}
                            className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-togo-green hover:bg-togo-green hover:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-togo-yellow dark:hover:bg-togo-yellow dark:hover:text-slate-900"
                          >
                            <Icon className="h-5 w-5" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Photo avec calques drapeau */}
                  <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
                    <div
                      className="absolute -left-3 top-6 h-[88%] w-[55%] rounded-3xl bg-togo-green/80 dark:bg-togo-green"
                      style={{ transform: 'rotate(-6deg)' }}
                      aria-hidden
                    />
                    <div
                      className="absolute -right-2 bottom-4 h-[88%] w-[55%] rounded-3xl bg-togo-red/75 dark:bg-togo-red"
                      style={{ transform: 'rotate(5deg)' }}
                      aria-hidden
                    />
                    <div
                      className="absolute left-1/2 top-1/2 h-[70%] w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-togo-yellow/60"
                      style={{ transform: 'translate(-50%, -50%) rotate(-2deg)' }}
                      aria-hidden
                    />
                    <div className="relative z-10 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/20">
                      {author.photoUrl ? (
                        <img
                          src={mediaUrl(author.photoUrl)}
                          alt={author.name}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-togo-green via-slate-800 to-togo-red">
                          <span className="text-6xl font-black text-white/90">
                            {author.name
                              .split(' ')
                              .map((w) => w.charAt(0))
                              .join('')
                              .slice(0, 3)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {author.badgeLabel && (
                      <span className="absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-togo-yellow px-5 py-2 text-xs font-bold uppercase tracking-wide text-slate-900 shadow-lg">
                        {author.badgeLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ) : null}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-togo-green py-20 dark:bg-togo-green-dark">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,206,0,0.15)_0%,transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-black uppercase text-white sm:text-3xl">
            Rejoignez l&apos;aventure T.C.H
          </h2>
          <p className="mt-4 text-emerald-100 sm:text-lg">
            Vous animez une communauté togolaise ? Inscrivez-la et gagnez en visibilité. Vous
            cherchez votre prochain meetup, mentor ou réseau ? Explorez l&apos;annuaire dès
            maintenant.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/communautes"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-7 py-3.5 text-base font-bold text-white transition-all hover:border-white hover:bg-white/10"
            >
              <Search className="h-5 w-5" />
              Explorer les communautés
            </Link>
            <Link
              to="/inscription"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-togo-yellow px-7 py-3.5 text-base font-bold text-slate-900 shadow-lg transition-all hover:bg-white"
            >
              <Rocket className="h-5 w-5" />
              Exposer ma communauté
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-7 py-3.5 text-base font-bold text-white transition-all hover:border-white hover:bg-white/10"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
