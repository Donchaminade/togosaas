import { useState } from 'react';
import type * as React from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import PageBanner from '../components/ui/PageBanner';
import ScrollReveal, { StaggerReveal } from '../components/motion/ScrollReveal';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { DIAPO } from '../data/heroSlides';
import { api, ApiError } from '../lib/api';

export default function Contact() {
  const { notify } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await api.sendContact(form);
      notify('Votre message a bien été envoyé. Merci !', 'success');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errors) setErrors(err.errors);
        notify(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageBanner
        image={DIAPO.contactBanner}
        title={
          <>
            Nous <span className="bg-gradient-to-r from-togo-green via-togo-yellow to-togo-red bg-clip-text text-transparent">contacter</span>
          </>
        }
        subtitle="Une question, une suggestion, un partenariat ? Écrivez-nous, nous vous répondrons rapidement."
      />

      <section className="bg-white pb-24 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-5">
            {/* Coordonnées */}
            <div className="lg:col-span-2">
              <div className="space-y-4">
                {[
                  {
                    icon: Mail,
                    label: 'Email',
                    value: 'chaminade.dondah.adjolou@gmail.com',
                    href: 'mailto:chaminade.dondah.adjolou@gmail.com',
                  },
                  {
                    icon: Phone,
                    label: 'Téléphone',
                    value: '+22899181626',
                    href: 'tel:+22899181626',
                  },
                  { icon: MapPin, label: 'Localisation', value: 'Lomé, Togo' },
                ].map((c, i) => (
                  <StaggerReveal key={c.label} index={i} variant="gentle-up" stagger={85}>
                  <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-togo-surface-strong/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-togo-green/10 text-togo-green dark:bg-togo-yellow/15 dark:text-togo-yellow">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{c.label}</p>
                      {c.href ? (
                        <a
                          href={c.href}
                          className="break-all text-sm font-semibold text-slate-800 transition-colors hover:text-togo-green dark:text-slate-100 dark:hover:text-togo-yellow"
                        >
                          {c.value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{c.value}</p>
                      )}
                    </div>
                  </div>
                  </StaggerReveal>
                ))}
              </div>

              <ScrollReveal variant="fade-up" delay={200} className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                <iframe
                  title="Carte Lomé"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=1.18%2C6.10%2C1.28%2C6.20&layer=mapnik"
                  className="h-56 w-full"
                  loading="lazy"
                />
              </ScrollReveal>
            </div>

            <ScrollReveal variant="fade-up" delay={120} className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Nom complet"
                  value={form.name}
                  onChange={update('name')}
                  error={errors.name?.[0]}
                  required
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  error={errors.email?.[0]}
                  required
                />
              </div>
              <div className="mt-5">
                <Field
                  label="Objet"
                  value={form.subject}
                  onChange={update('subject')}
                  error={errors.subject?.[0]}
                />
              </div>
              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Message <span className="text-togo-red">*</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={update('message')}
                  rows={6}
                  required
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-togo-green focus:bg-white dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="Votre message..."
                />
                {errors.message?.[0] && (
                  <p className="mt-1.5 text-xs font-medium text-togo-red">{errors.message[0]}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-togo-green px-6 py-4 text-base font-bold text-white shadow-lg shadow-togo-green/25 transition-all hover:bg-togo-green-dark disabled:opacity-60 dark:bg-togo-yellow dark:text-slate-900 dark:shadow-togo-yellow/20 dark:hover:bg-togo-yellow/90"
              >
                {loading ? <Spinner /> : <Send className="h-5 w-5" />}
                {loading ? 'Envoi...' : 'Envoyer le message'}
              </button>
            </form>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}

function Field({
  label,
  error,
  required,
  ...props
}: {
  label: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label} {required && <span className="text-togo-red">*</span>}
      </label>
      <input
        {...props}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-togo-green focus:bg-white dark:focus:bg-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      />
      {error && <p className="mt-1.5 text-xs font-medium text-togo-red">{error}</p>}
    </div>
  );
}
