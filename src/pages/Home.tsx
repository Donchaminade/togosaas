import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  EyeOff,
  Megaphone,
  Rocket,
  Search,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';
import HeroSlideshow from '../components/home/HeroSlideshow';
import CommunityCard from '../components/CommunityCard';
import ScrollReveal, { StaggerReveal } from '../components/motion/ScrollReveal';
import Wave from '../components/ui/Wave';
import { resolveTogoCity } from '../data/togoData';
import { api } from '../lib/api';

import type { Community } from '../types';

const FEATURES = [
  {
    icon: Megaphone,
    title: 'De la visibilité',
    text: "Exposez votre communauté à tout le Togo via une vitrine moderne et un annuaire public référencé.",
  },
  {
    icon: ShieldCheck,
    title: 'Contenu vérifié',
    text: "Chaque communauté est validée par notre équipe avant publication pour garantir la qualité.",
  },
  {
    icon: Users,
    title: 'Espace de gestion',
    text: "Un tableau de bord dédié pour gérer en autonomie les informations de votre communauté.",
  },
  {
    icon: Compass,
    title: 'Cartographie',
    text: "Localisez les communautés par pays et par ville dans l'annuaire public.",
  },
];

const STEPS = [
  { num: '01', title: 'Créez votre compte', text: 'Inscrivez-vous gratuitement en tant que lead de communauté.' },
  { num: '02', title: 'Soumettez votre communauté', text: 'Renseignez les infos, liens et coordonnées depuis votre espace.' },
  { num: '03', title: 'Validation admin', text: 'Notre équipe vérifie et approuve votre soumission.' },
  { num: '04', title: 'Rayonnez', text: 'Votre communauté apparaît dans l’annuaire public du Togo.' },
];

export default function Home() {
  const [preview, setPreview] = useState<Community[]>([]);
  const [stats, setStats] = useState({ communities: 0, cities: 0, tags: 0 });

  useEffect(() => {
    api
      .listCommunities()
      .then((res) => {
        const list = res.data.communities;
        setPreview(list.slice(0, 6));
        const tags = new Set<string>();
        const cities = new Set<string>();
        list.forEach((c) => {
          c.tags.forEach((t) => tags.add(t));
          const city = resolveTogoCity(c.city);
          if (city) cities.add(city);
        });
        setStats({
          communities: list.length,
          cities: cities.size,
          tags: tags.size,
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <>
      {/* ===================== HERO PLEIN ÉCRAN ===================== */}
      <HeroSlideshow stats={stats} />

      {/* ===================== FEATURES ===================== */}
      <section className="bg-white py-20 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <ScrollReveal variant="fade-up">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Pourquoi rejoindre <span className="text-togo-green dark:text-togo-yellow">T.C.H</span> ?
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                Une plateforme pensée pour fédérer et faire briller les communautés
                qui font bouger le Togo.
              </p>
            </ScrollReveal>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <StaggerReveal key={f.title} index={i} variant="gentle-up">
              <div
                className="motion-hover-lift group rounded-3xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-togo-green/10 text-togo-green transition-colors group-hover:bg-togo-green group-hover:text-white">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.text}</p>
              </div>
              </StaggerReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== ÉTAPES ===================== */}
      <section className="relative overflow-hidden bg-slate-50 py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up" className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Comment ça marche ?
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              De l'inscription à la publication, en 4 étapes simples.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <StaggerReveal key={s.num} index={i} variant="gentle-up">
              <div
                className="motion-hover-lift relative rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <span className="text-4xl font-black text-togo-green/15 dark:text-togo-yellow/15">{s.num}</span>
                <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{s.text}</p>
              </div>
              </StaggerReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== APERÇU COMMUNAUTÉS ===================== */}
      {preview.length > 0 && (
        <section className="bg-white py-20 dark:bg-slate-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal variant="fade-up">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                  Communautés à la une
                </h2>
                <p className="mt-3 text-slate-600 dark:text-slate-300">
                  Un aperçu des communautés déjà référencées sur la plateforme.
                </p>
              </div>
              <Link
                to="/communautes"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-togo-green hover:text-togo-green dark:border-slate-700 dark:text-slate-200 dark:hover:border-togo-yellow dark:hover:text-togo-yellow"
              >
                Voir tout <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            </ScrollReveal>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((c, i) => (
                <StaggerReveal key={c.id} index={i} variant="gentle-up">
                  <CommunityCard community={c} />
                </StaggerReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== SIGNALEMENT MEMBRES ===================== */}
      <section className="relative overflow-hidden bg-slate-50 py-20 dark:bg-slate-900">
        <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal variant="fade-up">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-0">
                <div className="p-8 sm:p-10 lg:p-12">
                  <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">
                    <Shield className="h-3.5 w-3.5" />
                    Espace membres
                  </span>
                  <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                    Vous êtes membre d&apos;une communauté ?
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    Si vous constatez un <strong>abus</strong>, un comportement inapproprié ou un problème
                    grave concernant une communauté référencée ou son/ses responsable(s), vous pouvez
                    le signaler <strong>anonymement</strong> depuis l&apos;accueil — sans créer de compte.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                    {[
                      { icon: EyeOff, text: 'Anonymat garanti — votre identité n\'est jamais enregistrée' },
                      { icon: ShieldCheck, text: 'Signalement d\'une communauté ou de son lead / co-leads' },
                      { icon: CheckCircle2, text: 'Code de suivi pour connaître l\'avancement du traitement' },
                    ].map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-togo-green dark:text-togo-yellow" />
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to="/signaler"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/25 transition-all hover:bg-rose-700 dark:bg-rose-500 dark:shadow-rose-500/20 dark:hover:bg-rose-600"
                    >
                      <Shield className="h-4 w-4" />
                      Signaler un abus (anonyme)
                    </Link>
                    <Link
                      to="/signaler/suivi"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-6 py-3.5 text-sm font-bold text-slate-700 transition-colors hover:border-togo-green hover:text-togo-green dark:border-slate-700 dark:text-slate-200 dark:hover:border-togo-yellow dark:hover:text-togo-yellow"
                    >
                      Suivre un signalement
                    </Link>
                  </div>
                </div>
                <div className="relative min-h-[280px] bg-gradient-to-br from-rose-50 via-emerald-50/40 to-amber-50/30 p-8 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-950 lg:min-h-full lg:p-12">
                  <div className="relative flex h-full flex-col justify-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Exemples de situations</p>
                    <div className="mt-4 space-y-3">
                      {[
                        'Harcèlement ou discrimination au sein d\'une communauté',
                        'Arnaque ou fausses informations publiées par un lead',
                        'Comportement abusif d\'un responsable envers des membres',
                        'Contenu illégal ou contraire aux valeurs de T.C.H',
                      ].map((item, i) => (
                        <StaggerReveal key={item} index={i} variant="gentle-in" stagger={80}>
                        <div
                          className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200"
                        >
                          {item}
                        </div>
                        </StaggerReveal>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="relative overflow-hidden bg-togo-green py-20 dark:bg-togo-green-dark">
        <Wave flip colorClassName="text-white dark:text-slate-950" />
        <div className="pointer-events-none absolute inset-0 text-white/5 bg-dots" />
        <ScrollReveal variant="gentle-in" duration={1150}>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Votre communauté mérite d'être connue.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-50">
            Rejoignez le hub des communautés du Togo et offrez à la vôtre la
            visibilité qu'elle mérite.
          </p>
          <Link
            to="/inscription"
            className="group mt-9 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-base font-bold text-togo-green shadow-xl transition-all hover:scale-[1.03] hover:bg-togo-yellow hover:text-slate-900"
          >
            <Rocket className="h-5 w-5 transition-transform group-hover:-translate-y-1" />
            Exposer ma communauté
          </Link>
        </div>
        </ScrollReveal>
      </section>
    </>
  );
}
