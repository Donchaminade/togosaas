import { Link } from 'react-router-dom';
import { ArrowLeft, Heart, Scale, Shield } from 'lucide-react';
import ScrollReveal, { StaggerReveal } from '../components/motion/ScrollReveal';
import Wave from '../components/ui/Wave';

const SECTIONS = [
  {
    title: 'Éditeur du site',
    content: (
      <>
        <p>
          Le site <strong>T.C.H — Togo Communities Hub</strong> est édité par :
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600 dark:text-slate-300">
          <li>
            <strong>Chaminade Dondah Adjolou</strong> — fondateur et concepteur du projet
          </li>
          <li>Contact : <a href="mailto:contact@tch.tg" className="font-semibold text-togo-green hover:underline dark:text-togo-yellow">contact@tch.tg</a></li>
          <li>Localisation : Lomé, Togo</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Directeur de la publication',
    content: (
      <p>
        <strong>Chaminade Dondah Adjolou</strong>, en qualité de responsable éditorial de la plateforme
        T.C.H.
      </p>
    ),
  },
  {
    title: 'Hébergement',
    content: (
      <p>
        Les informations relatives à l&apos;hébergeur du site (nom, adresse, contact) seront
        communiquées ici dès la mise en production définitive de la plateforme. En phase de
        déploiement, l&apos;hébergement peut varier selon l&apos;infrastructure retenue.
      </p>
    ),
  },
  {
    title: 'Objet du site',
    content: (
      <p>
        T.C.H est une plateforme de recensement, de valorisation et de mise en relation des
        communautés togolaises. Elle propose un annuaire public, des fiches communautés modérées,
        un espace de gestion pour les responsables (leads) et des outils de modération pour
        l&apos;équipe administrative.
      </p>
    ),
  },
  {
    title: 'Propriété intellectuelle',
    content: (
      <>
        <p>
          L&apos;ensemble des éléments composant le site (textes, charte graphique, logo T.C.H,
          structure, code, bases de données) est protégé par le droit d&apos;auteur et le droit
          des marques, sauf mention contraire.
        </p>
        <p className="mt-3">
          Les contenus publiés par les leads (descriptions, logos, images, textes de communautés)
          restent la propriété de leurs auteurs respectifs. En publiant sur T.C.H, le lead accorde
          à la plateforme une licence non exclusive d&apos;affichage et de promotion dans le cadre
          de l&apos;annuaire.
        </p>
        <p className="mt-3">
          Toute reproduction, représentation ou exploitation non autorisée du site ou de son
          contenu est interdite sans accord préalable écrit de l&apos;éditeur.
        </p>
      </>
    ),
  },
  {
    title: 'Données personnelles',
    content: (
      <>
        <p>T.C.H collecte et traite des données personnelles dans les cas suivants :</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-slate-600 dark:text-slate-300">
          <li><strong>Inscription lead</strong> : nom, email, téléphone (optionnel), mot de passe (hashé)</li>
          <li><strong>Formulaire de contact</strong> : nom, email, sujet, message</li>
          <li><strong>Fiches communautés</strong> : informations publiques renseignées par les leads</li>
          <li><strong>Signalements</strong> : déposés de manière <strong>anonyme</strong> — aucune identité requise</li>
        </ul>
        <p className="mt-3">
          Les données sont utilisées uniquement pour le fonctionnement du service (authentification,
          modération, support, statistiques internes). Elles ne sont pas vendues à des tiers.
        </p>
        <p className="mt-3">
          Conformément à la réglementation applicable, vous pouvez demander l&apos;accès, la
          rectification ou la suppression de vos données en écrivant à{' '}
          <a href="mailto:contact@tch.tg" className="font-semibold text-togo-green hover:underline dark:text-togo-yellow">
            contact@tch.tg
          </a>.
        </p>
      </>
    ),
  },
  {
    title: 'Signalements anonymes',
    content: (
      <p>
        Le module de signalement permet de signaler un comportement inapproprié sans créer de compte.
        Seul un code de suivi est remis au signaleur. Les preuves transmises sont conservées de
        manière confidentielle et accessibles uniquement à l&apos;équipe de modération. Aucune
        donnée d&apos;identification n&apos;est collectée dans ce parcours.
      </p>
    ),
  },
  {
    title: 'Responsabilité',
    content: (
      <>
        <p>
          T.C.H s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées, mais ne
          peut garantir l&apos;exhaustivité ou la mise à jour permanente de l&apos;annuaire. Les
          communautés listées sont soumises à une validation préalable ; la responsabilité éditoriale
          des contenus publiés incombe aux leads concernés.
        </p>
        <p className="mt-3">
          L&apos;éditeur décline toute responsabilité en cas de dommages résultant de l&apos;accès
          ou de l&apos;utilisation du site, ou de liens externes présents sur les fiches
          communautés.
        </p>
      </>
    ),
  },
  {
    title: 'Cookies & stockage local',
    content: (
      <p>
        Le site utilise le stockage local du navigateur pour maintenir votre session
        (authentification JWT), vos préférences d&apos;affichage (thème clair/sombre) et certains
        réglages d&apos;interface. Aucun cookie publicitaire tiers n&apos;est déposé par défaut.
      </p>
    ),
  },
  {
    title: 'Droit applicable',
    content: (
      <p>
        Les présentes mentions légales sont régies par le droit en vigueur au Togo. En cas de
        litige, et à défaut de résolution amiable, les tribunaux compétents de Lomé seront saisis.
      </p>
    ),
  },
];

export default function MentionsLegales() {
  const year = new Date().getFullYear();

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 to-white pb-20 pt-below-nav dark:from-slate-900 dark:to-slate-950">
        <div className="pointer-events-none absolute -left-16 top-8 h-64 w-64 rounded-full bg-togo-green/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <ScrollReveal variant="gentle-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-togo-green/25 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-togo-green dark:border-togo-yellow/25 dark:bg-slate-900/60 dark:text-togo-yellow">
            <Scale className="h-3.5 w-3.5" />
            Informations légales
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            Mentions <span className="text-gradient-togo">légales</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-600 dark:text-slate-300">
            Transparence sur l&apos;édition, l&apos;usage des données et le cadre juridique de T.C.H.
          </p>
          </ScrollReveal>
        </div>
        <Wave colorClassName="text-white dark:text-slate-950" />
      </section>

      <section className="bg-white pb-24 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-togo-green dark:text-slate-400 dark:hover:text-togo-yellow"
          >
            <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
          </Link>

          {/* Dédicace */}
          <ScrollReveal variant="gentle-up">
          <div className="mb-12 overflow-hidden rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-amber-50/60 p-8 text-center shadow-sm dark:border-rose-500/20 dark:from-rose-950/30 dark:via-slate-900 dark:to-slate-950">
            <Heart className="mx-auto h-8 w-8 fill-togo-red text-togo-red" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-togo-red dark:text-rose-400">
              Dédicace
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-700 dark:text-slate-200">
              Ce projet est dédié à
            </p>
            <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Mardiya <span className="text-togo-green dark:text-togo-yellow">TCHAKEY</span>
            </p>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              C&apos;est avec elle que l&apos;idée de T.C.H est née — ce hub des communautés
              togolaises porte la trace de cette genèse, avec gratitude et affection.
            </p>
          </div>
          </ScrollReveal>

          <div className="space-y-10">
            {SECTIONS.map((section, i) => (
              <StaggerReveal key={section.title} index={i} variant="gentle-up">
              <article
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 dark:border-slate-800 dark:bg-slate-900/50"
              >
                <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                  <Shield className="h-5 w-5 shrink-0 text-togo-green dark:text-togo-yellow" />
                  {section.title}
                </h2>
                <div className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {section.content}
                </div>
              </article>
              </StaggerReveal>
            ))}
          </div>

          <p className="mt-12 text-center text-xs text-slate-400">
            Dernière mise à jour — {year}. © T.C.H — Togo Communities Hub.
          </p>
        </div>
      </section>
    </>
  );
}
