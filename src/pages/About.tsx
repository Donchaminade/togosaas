import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  Github,
  Linkedin,
  Package,
  Rocket,
  Search,
  Shield,
  Sparkles,
  Store,
  Target,
  Trophy,
  Twitter,
  Zap,
} from 'lucide-react';
import ScrollReveal, { StaggerReveal } from '../components/motion/ScrollReveal';
import { PageLoader } from '../components/ui/Spinner';
import { api } from '../lib/api';
import { mediaUrl } from '../lib/media';
import { useSeo } from '../lib/seo';
import type { SiteAuthor } from '../types';

import { DIAPO } from '../data/heroSlides';

const PILLARS = [
  {
    icon: Trophy,
    label: 'Notre mission',
    text: 'Recenser, valoriser et connecter les solutions SaaS togolaises — gratuites ou payantes — pour qu\'aucune innovation locale ne reste invisible.',
    color: 'text-togo-red',
    bg: 'bg-togo-red/10',
  },
  {
    icon: Target,
    label: 'Notre vision',
    text: 'Faire de Togosaas la référence nationale pour découvrir, comparer et adopter l\'écosystème SaaS du Togo, de Lomé aux régions.',
    color: 'text-togo-green',
    bg: 'bg-togo-green/10',
  },
  {
    icon: Store,
    label: 'Pour qui ?',
    text: 'Utilisateurs, entreprises, éditeurs et partenaires : un catalogue public pour découvrir les solutions, un tableau de bord autonome pour les publier.',
    color: 'text-togo-yellow',
    bg: 'bg-togo-yellow/15',
  },
  {
    icon: Shield,
    label: 'Notre engagement',
    text: 'Des fiches vérifiées, une modération attentive et une charte qualité où chaque éditeur présente son offre, sa tarification et son accès en toute transparence.',
    color: 'text-togo-red',
    bg: 'bg-togo-red/10',
  },
];

const OFFERINGS = [
  {
    icon: Search,
    title: 'Catalogue intelligent',
    text: 'Filtrez par catégorie, tarif (gratuit ou payant) ou mot-clé — fintech, RH, e-commerce, éducation — et trouvez la solution qui correspond à vos besoins.',
  },
  {
    icon: Package,
    title: 'Solutions made in Togo',
    text: 'Chaque fiche met en avant une application togolaise : éditeur, ville d\'origine, captures d\'écran et lien d\'accès direct. Proximité locale, impact national.',
  },
  {
    icon: Zap,
    title: 'Accès immédiat',
    text: 'Essai gratuit, abonnement ou achat : accédez à l\'application depuis la fiche publique, sans intermédiaire ni recherche fastidieuse.',
  },
  {
    icon: Sparkles,
    title: 'Visibilité pour les éditeurs',
    text: 'Les éditeurs gèrent leur fiche, leurs visuels et leur tarification depuis un espace dédié. Publier sur Togosaas, c\'est offrir à sa solution la visibilité qu\'elle mérite.',
  },
];

const KEYWORDS = [
  'Hub SaaS du Togo',
  'Solutions togolaises',
  'Made in Togo',
  'Catalogue SaaS',
  'Applications locales',
  'Gratuit & payant',
  'Éditeurs vérifiés',
  'Innovation digitale',
  'Lomé & régions',
  'Marketplace SaaS',
];

export default function About() {
  const [author, setAuthor] = useState<SiteAuthor | null>(null);
  const [loadingAuthor, setLoadingAuthor] = useState(true);

  useSeo({
    title: 'À propos — TogoSaaS, le hub des solutions SaaS du Togo',
    description:
      'Découvrez TogoSaaS : la première marketplace nationale qui recense, vérifie et valorise les solutions SaaS togolaises. Notre mission, notre vision et notre charte qualité.',
    path: '/a-propos',
  });

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
        <div className="absolute inset-0 bg-gradient-to-b from-black/72 via-black/60 to-black/84" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,106,78,0.22)_0%,transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_20%,rgba(255,206,0,0.12)_0%,transparent_35%)]" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 pt-below-nav text-center sm:px-6">
          <span className="inline-block rounded-full bg-togo-red px-5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-togo-red/30">
            À propos de nous
          </span>
          <h1 className="mt-8 text-4xl font-black uppercase leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Le hub SaaS du Togo
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            <strong className="font-semibold text-white">TogoSaaS</strong> (Hub SaaS du Togo) est
            la première marketplace nationale dédiée au recensement, à la valorisation et à la
            mise en relation des solutions SaaS togolaises — un pont entre les éditeurs locaux
            et ceux qui cherchent les bonnes applications.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-togo-green via-togo-yellow to-togo-red" />
      </section>

      {/* Qu'est-ce que Togosaas ? */}
      <section className="bg-togo-surface py-20 dark:bg-slate-950 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal variant="fade-up">
              <div>
                <h2 className="text-3xl font-black uppercase leading-tight tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                  Qu&apos;est-ce que{' '}
                  <span className="text-togo-green dark:text-togo-yellow">TogoSaaS</span>{' '}
                  ?
                </h2>
                <p className="mt-6 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                  Au Togo, des dizaines de solutions SaaS émergent dans la fintech, la gestion
                  d&apos;entreprise, l&apos;éducation, la santé ou le e-commerce. Pourtant, les
                  découvrir reste souvent un parcours du combattant — informations éparpillées,
                  comparatifs absents, visibilité limitée pour les éditeurs locaux.
                </p>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                  <strong className="font-semibold text-slate-800 dark:text-white">Togosaas</strong>{' '}
                  répond à ce besoin avec une plateforme claire et moderne : un{' '}
                  <strong className="font-semibold text-slate-800 dark:text-white">
                    catalogue des solutions SaaS togolaises
                  </strong>{' '}
                  où chaque éditeur dispose d&apos;une fiche publique soignée, vérifiée et
                  régulièrement mise à jour.
                </p>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                  Que vous cherchiez un <em>outil de facturation à Lomé</em>, une plateforme
                  e-learning, une solution RH ou une application mobile togolaise, Togosaas
                  centralise l&apos;information pour accélérer la découverte, l&apos;adoption et
                  la croissance de l&apos;écosystème digital local.
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
                  alt="Écosystème SaaS togolais"
                  className="relative z-10 aspect-[4/5] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 lg:aspect-[3/4]"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Ce que Togosaas vous apporte */}
      <section className="border-t border-slate-100 bg-togo-surface-strong py-20 dark:border-slate-800 dark:bg-slate-900 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-togo-green dark:text-togo-yellow">
                Fonctionnalités clés
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Ce que <span className="text-togo-green dark:text-togo-yellow">Togosaas</span> vous apporte
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
                Une marketplace pensée pour l&apos;écosystème SaaS togolais : découverte,
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

      {/* Charte qualité */}
      <section className="bg-white py-20 dark:bg-slate-950 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up">
            <div className="overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-amber-50/60 p-8 text-center shadow-sm dark:border-emerald-500/20 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-950 sm:p-10">
              <BadgeCheck className="mx-auto h-8 w-8 text-togo-green dark:text-togo-yellow" />
              <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-togo-green dark:text-togo-yellow">
                Charte qualité
              </p>
              <p className="mt-5 text-base leading-relaxed text-slate-700 dark:text-slate-200 sm:text-lg">
                Chaque solution publiée sur <strong>TogoSaaS</strong> passe par une{' '}
                <strong>vérification éditoriale</strong> : identité de l&apos;éditeur, description
                claire, tarification transparente et lien d&apos;accès fonctionnel.
              </p>
              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                Une question sur une fiche, une suggestion de solution ou un besoin d&apos;assistance ?
                Notre équipe est disponible via le{' '}
                <Link to="/contact" className="font-semibold text-togo-green hover:underline dark:text-togo-yellow">
                  formulaire de contact
                </Link>.
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
            Rejoignez l&apos;aventure Togosaas
          </h2>
          <p className="mt-4 text-emerald-100 sm:text-lg">
            Vous éditez une solution SaaS togolaise ? Publiez-la et gagnez en visibilité. Vous
            cherchez la bonne application pour votre activité ? Explorez le catalogue dès
            maintenant.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/solutions"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-7 py-3.5 text-base font-bold text-white transition-all hover:border-white hover:bg-white/10"
            >
              <Search className="h-5 w-5" />
              Explorer le catalogue
            </Link>
            <Link
              to="/inscription"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-togo-yellow px-7 py-3.5 text-base font-bold text-slate-900 shadow-lg transition-all hover:bg-white"
            >
              <Rocket className="h-5 w-5" />
              Publier ma solution
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
