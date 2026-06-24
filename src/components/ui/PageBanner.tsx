import type { ReactNode } from 'react';
import Wave from './Wave';
import ScrollReveal from '../motion/ScrollReveal';

interface PageBannerProps {
  image: string;
  title: ReactNode;
  subtitle?: string;
}

export default function PageBanner({ image, title, subtitle }: PageBannerProps) {
  return (
    <section className="relative overflow-hidden pb-20 pt-below-nav md:pb-24">
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full scale-105 object-cover blur-[2px]"
        loading="eager"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/60 to-slate-950/80 dark:from-black/55 dark:via-slate-950/65 dark:to-slate-950/90" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(0,106,78,0.24)_0%,transparent_52%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_18%,rgba(255,206,0,0.18)_0%,transparent_34%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-togo-green via-togo-yellow to-togo-red" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="gentle-up" duration={1000} className="max-w-2xl py-6 sm:py-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
            Marketplace SaaS
          </div>
          <h1 className="mt-6 text-2xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:mt-4 sm:text-base md:text-lg">
              {subtitle}
            </p>
          )}
        </ScrollReveal>
      </div>

      <Wave colorClassName="text-white dark:text-slate-950" />
    </section>
  );
}
