import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  Play,
  Plus,
  ScrollText,
  Send,
  Trash2,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useToast } from '../ui/Toast';
import RichTextEditor from '../ui/RichTextEditor';
import type {
  Automation,
  AutomationAudience,
  AutomationLog,
  AutomationSchedule,
  AutomationTrigger,
  AutomationTriggerMeta,
  EmailRecipientOption,
  MessageTemplate,
  ScheduleMode,
} from '../../types';

type View = 'automations' | 'templates' | 'logs';

const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const LOG_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'En attente', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  sending: { label: 'Envoi…', className: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300' },
  sent: { label: 'Envoyé', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
  failed: { label: 'Échec', className: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300' },
  skipped: { label: 'Ignoré', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
};

export default function AdminAutomationPanel() {
  const { notify } = useToast();
  const [view, setView] = useState<View>('automations');
  const [loading, setLoading] = useState(true);

  const [triggers, setTriggers] = useState<AutomationTriggerMeta[]>([]);
  const [smtpConfigured, setSmtpConfigured] = useState(true);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [recipients, setRecipients] = useState<EmailRecipientOption[]>([]);

  const [templateModal, setTemplateModal] = useState<MessageTemplate | 'new' | null>(null);
  const [automationModal, setAutomationModal] = useState<Automation | 'new' | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [meta, tpl, autos, lg, rec] = await Promise.all([
        api.adminAutomationMeta(),
        api.adminMessageTemplates(),
        api.adminAutomations(),
        api.adminAutomationLogs(),
        api.adminEmailRecipients(),
      ]);
      setTriggers(meta.data.triggers);
      setSmtpConfigured(meta.data.smtpConfigured);
      setTemplates(tpl.data.templates);
      setAutomations(autos.data.automations);
      setLogs(lg.data.logs);
      setRecipients(rec.data.recipients);
    } catch {
      notify('Erreur de chargement des automatisations.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const tabs: { id: View; label: string; icon: typeof Workflow; count?: number }[] = [
    { id: 'automations', label: 'Automatisations', icon: Workflow, count: automations.length },
    { id: 'templates', label: 'Modèles', icon: FileText, count: templates.length },
    { id: 'logs', label: 'Journal', icon: ScrollText, count: logs.length },
  ];

  return (
    <div className="space-y-6">
      {!smtpConfigured && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Service d'envoi non configuré</p>
            <p className="mt-1">
              Les automatisations enverront des emails uniquement lorsque le SMTP (<code className="font-mono">MAIL_*</code>)
              sera configuré. Pour les déclencheurs planifiés, configurez aussi un cron sur{' '}
              <code className="font-mono">backend/database/automations-worker.php</code>.
            </p>
          </div>
        </div>
      )}

      <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
              view === t.id ? 'bg-white text-togo-green shadow-sm dark:bg-slate-900 dark:text-togo-yellow' : 'text-slate-500'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {view === 'automations' && (
        <AutomationsView
          automations={automations}
          templates={templates}
          onNew={() => setAutomationModal('new')}
          onEdit={(a) => setAutomationModal(a)}
          onChanged={refresh}
        />
      )}

      {view === 'templates' && (
        <TemplatesView
          templates={templates}
          smtpConfigured={smtpConfigured}
          onNew={() => setTemplateModal('new')}
          onEdit={(t) => setTemplateModal(t)}
          onChanged={refresh}
        />
      )}

      {view === 'logs' && <LogsView logs={logs} onRefresh={refresh} />}

      {templateModal && (
        <TemplateForm
          template={templateModal === 'new' ? null : templateModal}
          onClose={() => setTemplateModal(null)}
          onSaved={async () => {
            setTemplateModal(null);
            await refresh();
          }}
        />
      )}

      {automationModal && (
        <AutomationForm
          automation={automationModal === 'new' ? null : automationModal}
          triggers={triggers}
          templates={templates}
          recipients={recipients}
          onClose={() => setAutomationModal(null)}
          onSaved={async () => {
            setAutomationModal(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Automatisations                                                     */
/* ------------------------------------------------------------------ */

function AutomationsView({
  automations,
  templates,
  onNew,
  onEdit,
  onChanged,
}: {
  automations: Automation[];
  templates: MessageTemplate[];
  onNew: () => void;
  onEdit: (a: Automation) => void;
  onChanged: () => Promise<void> | void;
}) {
  const { notify } = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);

  const toggle = async (a: Automation) => {
    try {
      await api.adminToggleAutomation(a.id, !a.isActive);
      await onChanged();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erreur.', 'error');
    }
  };

  const run = async (a: Automation) => {
    if (!window.confirm(`Exécuter maintenant « ${a.name} » ?`)) return;
    setBusyId(a.id);
    try {
      const res = await api.adminRunAutomation(a.id);
      notify(res.message || 'Exécution terminée.', 'success');
      await onChanged();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'exécution.", 'error');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (a: Automation) => {
    if (!window.confirm(`Supprimer l'automatisation « ${a.name} » ?`)) return;
    try {
      await api.adminDeleteAutomation(a.id);
      notify('Automatisation supprimée.', 'success');
      await onChanged();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erreur.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Déclenchez automatiquement l'envoi d'un email à partir d'un évènement, d'une planification ou manuellement.
        </p>
        <button
          onClick={onNew}
          disabled={templates.length === 0}
          title={templates.length === 0 ? "Créez d'abord un modèle de message" : undefined}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Nouvelle automatisation
        </button>
      </div>

      {templates.length === 0 && (
        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
          Astuce : créez d'abord un <strong>modèle de message</strong> dans l'onglet « Modèles ».
        </p>
      )}

      {automations.length === 0 ? (
        <EmptyState icon={Workflow} label="Aucune automatisation pour le moment." />
      ) : (
        <div className="space-y-3">
          {automations.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${a.isActive ? 'text-togo-green' : 'text-slate-300'}`} />
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{a.name}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Déclencheur : <span className="font-semibold">{a.triggerLabel}</span>
                    {a.templateName && <> · Modèle : <span className="font-semibold">{a.templateName}</span></>}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {a.audience === 'event' && 'Destinataire : la personne concernée par l’évènement'}
                    {a.audience === 'all_leads' && 'Destinataires : tous les leads'}
                    {a.audience === 'selection' && `Destinataires : ${a.audienceUserIds.length} sélectionné(s)`}
                    {a.nextRunAt && <> · Prochaine exéc. : {new Date(a.nextRunAt).toLocaleString('fr-FR')}</>}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <ToggleSwitch checked={a.isActive} onChange={() => toggle(a)} />
                  {a.audience !== 'event' && (
                    <IconBtn onClick={() => run(a)} title="Exécuter maintenant" disabled={busyId === a.id} color="emerald">
                      {busyId === a.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    </IconBtn>
                  )}
                  <IconBtn onClick={() => onEdit(a)} title="Modifier" color="amber"><Pencil className="h-4 w-4" /></IconBtn>
                  <IconBtn onClick={() => remove(a)} title="Supprimer" color="rose"><Trash2 className="h-4 w-4" /></IconBtn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modèles                                                             */
/* ------------------------------------------------------------------ */

function TemplatesView({
  templates,
  smtpConfigured,
  onNew,
  onEdit,
  onChanged,
}: {
  templates: MessageTemplate[];
  smtpConfigured: boolean;
  onNew: () => void;
  onEdit: (t: MessageTemplate) => void;
  onChanged: () => Promise<void> | void;
}) {
  const { notify } = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);

  const remove = async (t: MessageTemplate) => {
    if (!window.confirm(`Supprimer le modèle « ${t.name} » ?`)) return;
    try {
      await api.adminDeleteMessageTemplate(t.id);
      notify('Modèle supprimé.', 'success');
      await onChanged();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erreur.', 'error');
    }
  };

  const test = async (t: MessageTemplate) => {
    setBusyId(t.id);
    try {
      const res = await api.adminTestTemplate(t.id);
      notify(res.message || 'Email de test envoyé.', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Échec de l'envoi de test.", 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Modèles réutilisables (sujet + contenu) avec variables dynamiques comme <code className="font-mono">{'{{nom}}'}</code>.
        </p>
        <button
          onClick={onNew}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark"
        >
          <Plus className="h-4 w-4" /> Nouveau modèle
        </button>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={FileText} label="Aucun modèle de message." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">Sujet : {t.subject}</p>
              {t.description && <p className="mt-1 line-clamp-2 text-xs text-slate-400">{t.description}</p>}
              <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
                <IconBtn onClick={() => test(t)} title="Envoyer un test à moi-même" disabled={!smtpConfigured || busyId === t.id} color="sky">
                  {busyId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </IconBtn>
                <IconBtn onClick={() => onEdit(t)} title="Modifier" color="amber"><Pencil className="h-4 w-4" /></IconBtn>
                <IconBtn onClick={() => remove(t)} title="Supprimer" color="rose"><Trash2 className="h-4 w-4" /></IconBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Journal                                                             */
/* ------------------------------------------------------------------ */

function LogsView({ logs, onRefresh }: { logs: AutomationLog[]; onRefresh: () => Promise<void> | void }) {
  if (logs.length === 0) {
    return <EmptyState icon={ScrollText} label="Aucun envoi automatisé pour le moment." />;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <p className="text-sm font-bold text-slate-900 dark:text-white">200 derniers envois</p>
        <button onClick={() => onRefresh()} className="text-xs font-bold text-togo-green hover:underline dark:text-togo-yellow">
          Actualiser
        </button>
      </div>
      <div className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
        {logs.map((l) => {
          const meta = LOG_STATUS[l.status] ?? LOG_STATUS.pending;
          return (
            <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                  {l.recipientName || l.recipientEmail}
                  {l.recipientName && <span className="text-slate-400"> · {l.recipientEmail}</span>}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {l.automationName || l.triggerEvent} · {new Date(l.createdAt).toLocaleString('fr-FR')}
                  {l.status === 'failed' && l.error && <span className="text-rose-500"> · {l.error}</span>}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaire Modèle                                                   */
/* ------------------------------------------------------------------ */

const ALL_VARIABLES = ['nom', 'email', 'solution', 'statut', 'code', 'date', 'site'];

function TemplateForm({
  template,
  onClose,
  onSaved,
}: {
  template: MessageTemplate | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [description, setDescription] = useState(template?.description ?? '');
  const [bodyHtml, setBodyHtml] = useState(template?.bodyHtml ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (name.trim().length < 2) return notify('Le nom est requis.', 'error');
    if (subject.trim().length < 2) return notify('Le sujet est requis.', 'error');
    if (!bodyHtml.trim()) return notify('Le contenu est requis.', 'error');

    setSaving(true);
    try {
      const payload = { name: name.trim(), subject: subject.trim(), bodyHtml, description: description.trim() || null };
      if (template) await api.adminUpdateMessageTemplate(template.id, payload);
      else await api.adminCreateMessageTemplate(payload);
      notify('Modèle enregistré.', 'success');
      await onSaved();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erreur.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={template ? 'Modifier le modèle' : 'Nouveau modèle'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nom du modèle">
          <TextInput value={name} onChange={setName} placeholder="Ex : Email de bienvenue" />
        </Field>
        <Field label="Description (interne, optionnel)">
          <TextInput value={description} onChange={setDescription} placeholder="À quoi sert ce modèle ?" />
        </Field>
        <Field label="Sujet de l'email">
          <TextInput value={subject} onChange={setSubject} placeholder="Ex : Bienvenue {{nom}} 👋" />
        </Field>
        <Field label="Contenu">
          <RichTextEditor initialHtml={template?.bodyHtml ?? ''} onChange={setBodyHtml} minHeight={220} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="text-xs text-slate-400">Variables :</span>
            {ALL_VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => navigator.clipboard?.writeText(`{{${v}}}`)}
                title="Copier"
                className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-300"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaire Automatisation                                           */
/* ------------------------------------------------------------------ */

function AutomationForm({
  automation,
  triggers,
  templates,
  recipients,
  onClose,
  onSaved,
}: {
  automation: Automation | null;
  triggers: AutomationTriggerMeta[];
  templates: MessageTemplate[];
  recipients: EmailRecipientOption[];
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const { notify } = useToast();
  const [name, setName] = useState(automation?.name ?? '');
  const [triggerEvent, setTriggerEvent] = useState<AutomationTrigger>(automation?.triggerEvent ?? 'lead_register');
  const [templateId, setTemplateId] = useState<number>(automation?.templateId ?? templates[0]?.id ?? 0);
  const [isActive, setIsActive] = useState<boolean>(automation?.isActive ?? true);
  const [audience, setAudience] = useState<AutomationAudience>(
    automation?.audience === 'selection' ? 'selection' : 'all_leads',
  );
  const [userIds, setUserIds] = useState<number[]>(automation?.audienceUserIds ?? []);
  const [schedule, setSchedule] = useState<AutomationSchedule>(
    automation?.schedule ?? { mode: 'once', time: '09:00' },
  );
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const selectCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-950 dark:text-white [&>option]:bg-white [&>option]:text-slate-900 dark:[&>option]:bg-slate-800 dark:[&>option]:text-white';

  const triggerMeta = useMemo(() => triggers.find((t) => t.key === triggerEvent), [triggers, triggerEvent]);
  const isEvent = triggerMeta?.kind === 'event';
  const isScheduled = triggerEvent === 'scheduled';

  const filteredRecipients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return recipients;
    return recipients.filter((r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
  }, [recipients, search]);

  const save = async () => {
    if (name.trim().length < 2) return notify('Le nom est requis.', 'error');
    if (!templateId) return notify('Sélectionnez un modèle.', 'error');
    if (!isEvent && audience === 'selection' && userIds.length === 0) {
      return notify('Sélectionnez au moins un destinataire.', 'error');
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        triggerEvent,
        templateId,
        isActive,
        audience: isEvent ? ('event' as AutomationAudience) : audience,
        userIds: !isEvent && audience === 'selection' ? userIds : undefined,
        schedule: isScheduled ? schedule : undefined,
      };
      if (automation) await api.adminUpdateAutomation(automation.id, payload);
      else await api.adminCreateAutomation(payload);
      notify('Automatisation enregistrée.', 'success');
      await onSaved();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Erreur.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={automation ? "Modifier l'automatisation" : 'Nouvelle automatisation'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Nom">
          <TextInput value={name} onChange={setName} placeholder="Ex : Bienvenue aux nouveaux leads" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Déclencheur">
            <select title="Déclencheur" value={triggerEvent} onChange={(e) => setTriggerEvent(e.target.value as AutomationTrigger)} className={selectCls}>
              {triggers.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Modèle de message">
            <select title="Modèle de message" value={templateId} onChange={(e) => setTemplateId(Number(e.target.value))} className={selectCls}>
              {templates.length === 0 && <option value={0}>Aucun modèle</option>}
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {triggerMeta && triggerMeta.variables.length > 0 && (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            Variables disponibles :{' '}
            {triggerMeta.variables.map((v) => (
              <code key={v.key} className="mx-0.5 font-mono text-slate-600 dark:text-slate-300">{`{{${v.key}}}`}</code>
            ))}
          </div>
        )}

        {isEvent ? (
          <p className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            L'email sera envoyé automatiquement à <strong>la personne concernée</strong> par l'évènement.
          </p>
        ) : (
          <>
            <Field label="Destinataires">
              <div className="flex gap-2">
                {(['all_leads', 'selection'] as AutomationAudience[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAudience(a)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                      audience === a
                        ? 'border-togo-green bg-togo-green/10 text-togo-green'
                        : 'border-slate-200 text-slate-500 dark:border-slate-700'
                    }`}
                  >
                    {a === 'all_leads' ? `Tous les leads (${recipients.length})` : 'Sélection'}
                  </button>
                ))}
              </div>
            </Field>

            {audience === 'selection' && (
              <div className="space-y-2">
                <TextInput value={search} onChange={setSearch} placeholder="Rechercher un lead…" />
                <div className="max-h-[200px] space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                  {filteredRecipients.map((r) => (
                    <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <input
                        type="checkbox"
                        checked={userIds.includes(r.id)}
                        onChange={() =>
                          setUserIds((prev) => (prev.includes(r.id) ? prev.filter((x) => x !== r.id) : [...prev, r.id]))
                        }
                        className="h-4 w-4 accent-togo-green"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-700 dark:text-slate-200">{r.name}</span>
                        <span className="block truncate text-xs text-slate-400">{r.email}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isScheduled && <ScheduleEditor value={schedule} onChange={setSchedule} selectCls={selectCls} />}
          </>
        )}

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-togo-green" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Automatisation active</span>
        </label>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

function ScheduleEditor({
  value,
  onChange,
  selectCls,
}: {
  value: AutomationSchedule;
  onChange: (s: AutomationSchedule) => void;
  selectCls: string;
}) {
  const set = (patch: Partial<AutomationSchedule>) => onChange({ ...value, ...patch });
  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-togo-green dark:border-slate-700 dark:bg-slate-950 dark:text-white';

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <Field label="Fréquence">
        <select title="Fréquence" value={value.mode} onChange={(e) => set({ mode: e.target.value as ScheduleMode })} className={selectCls}>
          <option value="once">Une seule fois</option>
          <option value="daily">Tous les jours</option>
          <option value="weekly">Toutes les semaines</option>
          <option value="monthly">Tous les mois</option>
        </select>
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        {value.mode === 'once' && (
          <Field label="Date">
            <input type="date" title="Date" value={value.date ?? ''} onChange={(e) => set({ date: e.target.value })} className={inputCls} />
          </Field>
        )}
        {value.mode === 'weekly' && (
          <Field label="Jour de la semaine">
            <select title="Jour de la semaine" value={value.dayOfWeek ?? 1} onChange={(e) => set({ dayOfWeek: Number(e.target.value) })} className={selectCls}>
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i + 1}>{d}</option>
              ))}
            </select>
          </Field>
        )}
        {value.mode === 'monthly' && (
          <Field label="Jour du mois (1-28)">
            <input
              type="number"
              title="Jour du mois"
              min={1}
              max={28}
              value={value.dayOfMonth ?? 1}
              onChange={(e) => set({ dayOfMonth: Number(e.target.value) })}
              className={inputCls}
            />
          </Field>
        )}
        <Field label="Heure">
          <input type="time" title="Heure" value={value.time ?? '09:00'} onChange={(e) => set({ time: e.target.value })} className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Petits composants partagés                                          */
/* ------------------------------------------------------------------ */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} title="Fermer" aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <XCircle className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSave, saving }: { onClose: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
        Annuler
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-togo-green px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Enregistrer
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-togo-green dark:border-slate-700 dark:bg-slate-950 dark:text-white"
    />
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      title={checked ? 'Désactiver' : 'Activer'}
      aria-label={checked ? 'Désactiver' : 'Activer'}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-togo-green' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function IconBtn({
  onClick,
  title,
  children,
  color,
  disabled,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  color: 'emerald' | 'amber' | 'rose' | 'sky';
  disabled?: boolean;
}) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-500/15 dark:text-emerald-400',
    amber: 'bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white dark:bg-amber-500/15 dark:text-amber-400',
    rose: 'bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white dark:bg-rose-500/15 dark:text-rose-400',
    sky: 'bg-sky-100 text-sky-700 hover:bg-sky-600 hover:text-white dark:bg-sky-500/15 dark:text-sky-400',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon: Icon, label }: { icon: typeof Workflow; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 py-20 text-center dark:border-slate-700">
      <Icon className="h-12 w-12 text-slate-300" />
      <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
