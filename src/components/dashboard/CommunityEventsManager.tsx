import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
import { ManageEventsTable } from './EventsTable';
import Spinner from '../ui/Spinner';
import SearchBar from '../ui/SearchBar';
import SearchEmptyState from '../ui/SearchEmptyState';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import { api, ApiError } from '../../lib/api';
import { filterBySearch } from '../../lib/search';
import type { Community, CommunityEvent } from '../../types';

interface Props {
  community: Community;
  onClose?: () => void;
  inline?: boolean;
}

const emptyForm = (): Partial<CommunityEvent> => ({
  title: '',
  description: '',
  startsAt: '',
  endsAt: '',
  location: '',
  eventUrl: '',
});

function toInputDatetime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CommunityEventsManager({ community, onClose, inline = false }: Props) {
  const { notify } = useToast();
  const { confirmDelete } = useConfirm();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommunityEvent | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!community.id) return;
    try {
      const res = await api.listCommunityEvents(community.id);
      setEvents(res.data.events);
    } catch {
      notify('Impossible de charger les événements.', 'error');
    } finally {
      setLoading(false);
    }
  }, [community.id, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEvents = useMemo(
    () =>
      filterBySearch(events, search, (e) => [e.title, e.description, e.location, e.startsAt, e.eventUrl]),
    [events, search],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (e: CommunityEvent) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description ?? '',
      startsAt: toInputDatetime(e.startsAt),
      endsAt: toInputDatetime(e.endsAt),
      location: e.location ?? '',
      eventUrl: e.eventUrl ?? '',
    });
    setFormOpen(true);
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!community.id || !form.title?.trim() || !form.startsAt) return;

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      location: form.location?.trim() || null,
      eventUrl: form.eventUrl?.trim() || null,
    };

    try {
      if (editing) {
        await api.updateCommunityEvent(community.id, editing.id, payload);
        notify('Événement mis à jour.', 'success');
      } else {
        await api.createCommunityEvent(community.id, payload);
        notify('Événement ajouté au calendrier.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) notify(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: CommunityEvent) => {
    if (!community.id) return;
    const ok = await confirmDelete(`Supprimer l'événement « ${e.title} » ?\n\nCette action est irréversible.`);
    if (!ok) return;
    try {
      await api.deleteCommunityEvent(community.id, e.id);
      notify('Événement supprimé.', 'success');
      await load();
    } catch {
      notify('Suppression impossible.', 'error');
    }
  };

  const content = (
    <>
      <div className={`flex items-center justify-between ${inline ? 'mb-6' : 'border-b border-slate-200 px-6 py-4 dark:border-slate-800'}`}>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">Calendrier événementiel</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{community.name}</p>
        </div>
        {!inline && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className={inline ? '' : 'flex-1 overflow-y-auto p-6'}>
          {!formOpen ? (
            <>
              <button
                type="button"
                onClick={openCreate}
                className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-togo-green px-4 py-3 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark"
              >
                <Plus className="h-4 w-4" /> Ajouter un événement
              </button>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="h-8 w-8 text-togo-green" />
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
                  <Calendar className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    Aucun événement planifié. Ajoutez meetups, ateliers ou conférences.
                  </p>
                </div>
              ) : (
                <>
                  {events.length > 2 && (
                    <div className="mb-4">
                      <SearchBar
                        value={search}
                        onChange={setSearch}
                        placeholder="Rechercher un événement…"
                        size="sm"
                        resultCount={filteredEvents.length}
                        totalCount={events.length}
                      />
                    </div>
                  )}
                  {filteredEvents.length === 0 ? (
                    <SearchEmptyState query={search.trim()} />
                  ) : (
                    <ManageEventsTable events={filteredEvents} onEdit={openEdit} onDelete={handleDelete} />
                  )}
                </>
              )}
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {editing ? 'Modifier l\'événement' : 'Nouvel événement'}
              </p>
              <Field label="Titre *" value={form.title ?? ''} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">Description</span>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Détails, programme, public cible…"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Date & heure de début *"
                  type="datetime-local"
                  value={form.startsAt ?? ''}
                  onChange={(v) => setForm((f) => ({ ...f, startsAt: v }))}
                  required
                />
                <Field
                  label="Fin (facultatif)"
                  type="datetime-local"
                  value={form.endsAt ?? ''}
                  onChange={(v) => setForm((f) => ({ ...f, endsAt: v }))}
                />
              </div>
              <Field label="Lieu" value={form.location ?? ''} onChange={(v) => setForm((f) => ({ ...f, location: v }))} placeholder="Adresse, salle, en ligne…" />
              <Field label="Lien (inscription, visio…)" value={form.eventUrl ?? ''} onChange={(v) => setForm((f) => ({ ...f, eventUrl: v }))} placeholder="https://…" />
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setFormOpen(false); setEditing(null); }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-togo-green py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {saving ? <Spinner className="h-4 w-4" /> : null}
                  {editing ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          )}
      </div>
    </>
  );

  if (inline) {
    return <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">{content}</div>;
  }

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl animate-rise dark:bg-slate-950 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </label>
  );
}
