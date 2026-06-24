import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, Mail, Pencil, Plus, Shield, Trash2, UserCog, Users } from 'lucide-react';
import AdminCreateForm from './AdminCreateForm';
import AdminUserEditForm from './AdminUserEditForm';
import AdminUserDetailModal from './AdminUserDetailModal';
import UserAvatar from '../ui/UserAvatar';
import { PageLoader } from '../ui/Spinner';
import SearchBar from '../ui/SearchBar';
import SearchEmptyState from '../ui/SearchEmptyState';
import { useToast } from '../ui/Toast';
import { useConfirm } from '../ui/ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import { filterBySearch } from '../../lib/search';
import type { AdminUserSummary, UserRole } from '../../types';

type RoleFilter = '' | UserRole;

const LEAD_DELETE_BLOCKED =
  'Ce lead est responsable d\'au moins une solution SaaS. Supprimez ces solutions SaaS ou réassignez le rôle de responsable à un co-lead avant de supprimer le compte.';

function canDeleteUser(user: AdminUserSummary, currentUserId?: number): boolean {
  if (currentUserId === user.id) return false;
  if (user.role === 'lead' && user.communitiesCount > 0) return false;
  return true;
}

export default function AdminUsersPanel() {
  const { user: currentUser } = useAuth();
  const { notify } = useToast();
  const { confirmDelete } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [filter, setFilter] = useState<RoleFilter>('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUserSummary | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.adminUsers();
      setUsers(res.data.users);
    } catch {
      notify('Impossible de charger les utilisateurs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const roleFilteredUsers = filter ? users.filter((u) => u.role === filter) : users;

  const filteredUsers = useMemo(
    () =>
      filterBySearch(roleFilteredUsers, search, (u) => [
        u.name,
        u.email,
        u.phone,
        u.role,
        u.communitiesCount,
      ]),
    [roleFilteredUsers, search],
  );

  const adminCount = users.filter((u) => u.role === 'admin').length;

  const handleCreate = async (data: { name: string; email: string; password: string; phone?: string | null }) => {
    try {
      await api.adminCreateAdmin(data);
      notify('Administrateur créé avec succès.', 'success');
      setCreating(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) notify(err.message, 'error');
      throw err;
    }
  };

  const handleEdit = async (data: { name: string; email: string; phone?: string | null; role: UserRole }) => {
    if (!editing) return;
    try {
      await api.adminUpdateUser(editing.id, data);
      notify('Utilisateur mis à jour.', 'success');
      setEditing(null);
      await load();
    } catch (err) {
      if (err instanceof ApiError) notify(err.message, 'error');
      throw err;
    }
  };

  const quickRoleChange = async (target: AdminUserSummary, role: UserRole) => {
    if (target.role === role) return;
    const label = role === 'admin' ? 'promouvoir en administrateur' : 'rétrograder en lead';
    if (!window.confirm(`${target.name} — confirmer : ${label} ?`)) return;

    try {
      await api.adminUpdateUser(target.id, {
        name: target.name,
        email: target.email,
        phone: target.phone ?? null,
        role,
      });
      notify(role === 'admin' ? 'Utilisateur promu administrateur.' : 'Utilisateur rétrogradé en lead.', 'success');
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Modification impossible.', 'error');
    }
  };

  const handleDelete = async (target: AdminUserSummary) => {
    const isSelf = currentUser?.id === target.id;
    if (isSelf) return;

    if (target.role === 'lead' && target.communitiesCount > 0) {
      notify(LEAD_DELETE_BLOCKED, 'error');
      return;
    }

    const ok = await confirmDelete(`Supprimer définitivement « ${target.name} » ?\n\nCette action est irréversible.`);
    if (!ok) return;

    setDeletingId(target.id);
    try {
      await api.adminDeleteUser(target.id);
      notify('Utilisateur supprimé définitivement.', 'success');
      if (viewingId === target.id) setViewingId(null);
      await load();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Suppression impossible.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <PageLoader label="Chargement des utilisateurs..." />;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Gérez les comptes administrateurs et les rôles. Vous pouvez créer de nouveaux admins ou promouvoir un lead
          existant. {adminCount} administrateur{adminCount > 1 ? 's' : ''} au total.
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-togo-green px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-togo-green/20 transition-all hover:bg-togo-green-dark"
        >
          <Plus className="h-4 w-4" /> Ajouter un administrateur
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { id: '' as RoleFilter, label: 'Tous' },
          { id: 'admin' as RoleFilter, label: 'Administrateurs' },
          { id: 'lead' as RoleFilter, label: 'Leads' },
        ].map((f) => (
          <button
            key={f.id || 'all'}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              filter === f.id
                ? 'bg-togo-green text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {users.length > 0 && (
        <div className="mb-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par nom, email, rôle…"
            size="sm"
            resultCount={filteredUsers.length}
            totalCount={roleFilteredUsers.length}
          />
        </div>
      )}

      {filteredUsers.length === 0 ? (
        search.trim() ? (
          <SearchEmptyState query={search.trim()} />
        ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 py-20 dark:border-slate-800">
          <Users className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Aucun utilisateur dans cette catégorie.</p>
        </div>
        )
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 sm:grid">
            <span className="col-span-3">Utilisateur</span>
            <span className="col-span-3">Email</span>
            <span className="col-span-2">Rôle</span>
            <span className="col-span-2">Inscription</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map((u) => {
              const isSelf = currentUser?.id === u.id;
              const deleteBlocked = !canDeleteUser(u, currentUser?.id);
              const deleteTitle =
                u.role === 'lead' && u.communitiesCount > 0
                  ? LEAD_DELETE_BLOCKED
                  : 'Supprimer définitivement';
              return (
                <div key={u.id} className="grid grid-cols-12 items-center gap-3 px-4 py-3">
                  <div className="col-span-12 flex min-w-0 items-center gap-3 sm:col-span-3">
                    <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {u.name}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-bold uppercase text-togo-green dark:text-togo-yellow">
                            (vous)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-400 sm:hidden">{u.email}</p>
                    </div>
                  </div>

                  <div className="col-span-6 hidden truncate text-sm text-slate-600 dark:text-slate-300 sm:col-span-3 sm:block">
                    {u.email}
                  </div>

                  <div className="col-span-6 sm:col-span-2">
                    <RoleBadge role={u.role} />
                  </div>

                  <div className="col-span-6 hidden text-xs text-slate-500 dark:text-slate-400 sm:col-span-2 sm:block">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                    {u.role === 'lead' && u.communitiesCount > 0 && (
                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        {u.communitiesCount} communauté{u.communitiesCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="col-span-6 flex flex-wrap items-center justify-end gap-1 sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => setViewingId(u.id)}
                      title="Voir les détails"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-togo-green hover:text-white dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <a
                      href={`mailto:${u.email}`}
                      title="Envoyer un email"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-sky-100 text-sky-700 transition-colors hover:bg-sky-600 hover:text-white dark:bg-sky-500/15 dark:text-sky-400"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditing(u)}
                      title="Modifier"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700 transition-colors hover:bg-amber-500 hover:text-white dark:bg-amber-500/15 dark:text-amber-400"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    {u.role === 'lead' && (
                      <button
                        type="button"
                        onClick={() => quickRoleChange(u, 'admin')}
                        title="Promouvoir administrateur"
                        className="grid h-8 w-8 place-items-center rounded-lg bg-violet-100 text-violet-700 transition-colors hover:bg-violet-600 hover:text-white dark:bg-violet-500/15 dark:text-violet-400"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    )}
                    {u.role === 'admin' && !isSelf && (
                      <button
                        type="button"
                        onClick={() => quickRoleChange(u, 'lead')}
                        title="Rétrograder en lead"
                        className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-600 hover:text-white dark:bg-slate-800 dark:text-slate-300"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    )}
                    {!isSelf && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={deletingId === u.id || deleteBlocked}
                        title={deleteTitle}
                        className="grid h-8 w-8 place-items-center rounded-lg bg-rose-100 text-rose-700 transition-colors hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-rose-500/15 dark:text-rose-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewingId !== null && (
        <AdminUserDetailModal userId={viewingId} onClose={() => setViewingId(null)} />
      )}
      {creating && <AdminCreateForm onClose={() => setCreating(false)} onSubmit={handleCreate} />}
      {editing && (
        <AdminUserEditForm
          initial={editing}
          isSelf={currentUser?.id === editing.id}
          onClose={() => setEditing(null)}
          onSubmit={handleEdit}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold uppercase text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
        <Shield className="h-3 w-3" /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold uppercase text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
      <UserCog className="h-3 w-3" /> Lead
    </span>
  );
}
