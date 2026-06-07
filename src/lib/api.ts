import type {
  AdminStats,
  AdminUserSummary,
  AdminUserDetail,
  Community,
  CommunityEvent,
  CommunityReport,
  ContactMessage,
  LeadSummary,
  LeadDetail,
  CountryData,
  User,
  UserRole,
  SupportMessage,
  SupportConversation,
  SupportAttachment,
  SiteAuthor,
  ReportEvidenceFile,
  ReportTargetType,
  ReportTrackInfo,
} from '../types';

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const TOKEN_KEY = 'tch_token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<ApiEnvelope<T>> {
  const { method = 'GET', body, auth = false } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    throw new ApiError(
      "Impossible de joindre le serveur. Verifiez que l'API est demarree.",
      0,
    );
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    /* reponse non-JSON */
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message || `Erreur ${response.status}`,
      response.status,
      payload?.errors,
    );
  }

  return payload;
}

async function uploadRequest<T>(path: string, file: File): Promise<ApiEnvelope<T>> {
  const token = tokenStore.get();
  const formData = new FormData();
  formData.append('file', file);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch {
    throw new ApiError("Impossible de joindre le serveur. Verifiez que l'API est demarree.", 0);
  }

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    /* reponse non-JSON */
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || `Erreur ${response.status}`, response.status, payload?.errors);
  }

  return payload;
}

export { API_BASE_URL };

/* ------------------------------------------------------------------ */
/* Endpoints                                                           */
/* ------------------------------------------------------------------ */

export const api = {
  // Auth
  register: (data: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    phone?: string;
  }) =>
    request<{ token: string; user: User }>('/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: data }),

  me: () => request<{ user: User }>('/auth/me', { auth: true }),

  updateProfile: (data: { name: string; phone?: string | null; avatarUrl?: string | null }) =>
    request<{ user: User }>('/auth/profile', { method: 'PUT', body: data, auth: true }),

  // Meta
  meta: () => request<{ countries: CountryData[]; tags: string[] }>('/meta'),

  getAuthor: () => request<{ author: SiteAuthor }>('/meta/author'),

  // Communautes publiques
  listCommunities: (params: { q?: string; country?: string; tag?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.country) qs.set('country', params.country);
    if (params.tag) qs.set('tag', params.tag);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ communities: Community[] }>(`/communities${suffix}`);
  },

  getCommunity: (idOrSlug: string | number, auth = false) =>
    request<{ community: Community }>(`/communities/${encodeURIComponent(String(idOrSlug))}`, { auth }),

  // Contact
  sendContact: (data: { name: string; email: string; subject?: string; message: string }) =>
    request<null>('/contact', { method: 'POST', body: data }),

  uploadReportEvidence: (file: File) =>
    uploadRequest<{ evidence: ReportEvidenceFile }>('/reports/evidence', file),

  submitReport: (data: {
    communityId: number;
    targetType: ReportTargetType;
    category: string;
    description: string;
    evidence?: ReportEvidenceFile[];
  }) =>
    request<{ trackingCode: string; message: string }>('/reports', { method: 'POST', body: data }),

  trackReport: (code: string) =>
    request<{ report: ReportTrackInfo }>(`/reports/track/${encodeURIComponent(code)}`),

  // Espace lead
  myCommunities: () =>
    request<{ communities: Community[] }>('/lead/communities', { auth: true }),

  getLeadCommunity: (id: number) =>
    request<{ community: Community }>(`/lead/communities/${id}`, { auth: true }),

  uploadFile: (file: File) =>
    uploadRequest<{ url: string }>('/upload', file),

  createCommunity: (data: Partial<Community>) =>
    request<{ community: Community }>('/lead/communities', {
      method: 'POST',
      body: data,
      auth: true,
    }),

  updateCommunity: (id: number, data: Partial<Community>) =>
    request<{ community: Community }>(`/lead/communities/${id}`, {
      method: 'PUT',
      body: data,
      auth: true,
    }),

  deleteCommunity: (id: number) =>
    request<null>(`/lead/communities/${id}`, { method: 'DELETE', auth: true }),

  listCommunityEvents: (communityId: number) =>
    request<{ events: CommunityEvent[] }>(`/lead/communities/${communityId}/events`, { auth: true }),

  createCommunityEvent: (communityId: number, data: Partial<CommunityEvent>) =>
    request<{ event: CommunityEvent }>(`/lead/communities/${communityId}/events`, {
      method: 'POST',
      body: data,
      auth: true,
    }),

  updateCommunityEvent: (communityId: number, eventId: number, data: Partial<CommunityEvent>) =>
    request<{ event: CommunityEvent }>(`/lead/communities/${communityId}/events/${eventId}`, {
      method: 'PUT',
      body: data,
      auth: true,
    }),

  deleteCommunityEvent: (communityId: number, eventId: number) =>
    request<null>(`/lead/communities/${communityId}/events/${eventId}`, {
      method: 'DELETE',
      auth: true,
    }),

  getCommunityEvents: (communityId: number, upcomingOnly = true) =>
    request<{ events: CommunityEvent[] }>(
      `/communities/${communityId}/events${upcomingOnly ? '' : '?upcoming=0'}`
    ),

  leadSupportMessages: () =>
    request<{ messages: SupportMessage[] }>('/lead/support/messages', { auth: true }),

  leadSendSupportMessage: (data: { body: string; attachments?: SupportAttachment[] }) =>
    request<{ message: SupportMessage }>('/lead/support/messages', {
      method: 'POST',
      body: data,
      auth: true,
    }),

  leadUploadSupportAttachment: (file: File) =>
    uploadRequest<{ attachment: SupportAttachment }>('/lead/support/attachments', file),

  leadSupportAttachmentUrl: (messageId: number, index: number) =>
    `${API_BASE_URL}/lead/support/messages/${messageId}/attachments/${index}`,

  leadUpdateSupportMessage: (messageId: number, data: { body: string }) =>
    request<{ message: SupportMessage }>(`/lead/support/messages/${messageId}`, {
      method: 'PATCH',
      body: data,
      auth: true,
    }),

  leadDeleteSupportMessage: (messageId: number) =>
    request<{ message: SupportMessage }>(`/lead/support/messages/${messageId}`, {
      method: 'DELETE',
      auth: true,
    }),

  leadSupportUnread: () =>
    request<{ unread: number }>('/lead/support/unread', { auth: true }),

  // Espace admin
  adminStats: () => request<AdminStats>('/admin/stats', { auth: true }),

  adminCommunities: (status?: string) => {
    const suffix = status ? `?status=${status}` : '';
    return request<{ communities: Community[] }>(`/admin/communities${suffix}`, { auth: true });
  },

  adminCreateCommunity: (data: Partial<Community> & { userId: number; status?: string }) =>
    request<{ community: Community }>('/admin/communities', {
      method: 'POST',
      body: data,
      auth: true,
    }),

  adminSetStatus: (id: number, status: string) =>
    request<{ id: number; status: string }>(`/admin/communities/${id}/status`, {
      method: 'PATCH',
      body: { status },
      auth: true,
    }),

  adminUpdateCommunity: (id: number, data: Partial<Community>) =>
    request<{ id: number }>(`/admin/communities/${id}`, {
      method: 'PUT',
      body: data,
      auth: true,
    }),

  adminDeleteCommunity: (id: number) =>
    request<null>(`/admin/communities/${id}`, { method: 'DELETE', auth: true }),

  adminLeads: () => request<{ leads: LeadSummary[] }>('/admin/leads', { auth: true }),

  adminCreateLead: (data: { name: string; email: string; password: string; phone?: string | null }) =>
    request<{ lead: LeadSummary }>('/admin/leads', { method: 'POST', body: data, auth: true }),

  adminGetLead: (id: number) =>
    request<{ lead: LeadDetail; communities: Community[] }>(`/admin/leads/${id}`, { auth: true }),

  adminUpdateLead: (id: number, data: { name: string; email: string; phone?: string | null }) =>
    request<{ id: number }>(`/admin/leads/${id}`, { method: 'PUT', body: data, auth: true }),

  adminUsers: (role?: UserRole) => {
    const suffix = role ? `?role=${role}` : '';
    return request<{ users: AdminUserSummary[] }>(`/admin/users${suffix}`, { auth: true });
  },

  adminCreateAdmin: (data: { name: string; email: string; password: string; phone?: string | null }) =>
    request<{ user: AdminUserSummary }>('/admin/admins', { method: 'POST', body: data, auth: true }),

  adminUpdateUser: (
    id: number,
    data: { name: string; email: string; phone?: string | null; role: UserRole },
  ) => request<{ user: AdminUserSummary }>(`/admin/users/${id}`, { method: 'PUT', body: data, auth: true }),

  adminGetUser: (id: number) =>
    request<{ user: AdminUserDetail; communities: Community[] }>(`/admin/users/${id}`, { auth: true }),

  adminDeleteUser: (id: number) =>
    request<null>(`/admin/users/${id}`, { method: 'DELETE', auth: true }),

  adminMessages: () => request<{ messages: ContactMessage[] }>('/admin/messages', { auth: true }),

  adminMarkMessageRead: (id: number) =>
    request<null>(`/admin/messages/${id}/read`, { method: 'PATCH', auth: true }),

  adminSupportConversations: () =>
    request<{ conversations: SupportConversation[] }>('/admin/support/conversations', { auth: true }),

  adminSupportThread: (userId: number) =>
    request<{ lead: { id: number; name: string; email: string } | null; messages: SupportMessage[] }>(
      `/admin/support/leads/${userId}/messages`,
      { auth: true },
    ),

  adminSendSupportMessage: (userId: number, data: { body: string; attachments?: SupportAttachment[] }) =>
    request<{ message: SupportMessage }>(`/admin/support/leads/${userId}/messages`, {
      method: 'POST',
      body: data,
      auth: true,
    }),

  adminUploadSupportAttachment: (file: File) =>
    uploadRequest<{ attachment: SupportAttachment }>('/admin/support/attachments', file),

  adminSupportAttachmentUrl: (messageId: number, index: number) =>
    `${API_BASE_URL}/admin/support/messages/${messageId}/attachments/${index}`,

  adminUpdateSupportMessage: (messageId: number, data: { body: string }) =>
    request<{ message: SupportMessage }>(`/admin/support/messages/${messageId}`, {
      method: 'PATCH',
      body: data,
      auth: true,
    }),

  adminDeleteSupportMessage: (messageId: number) =>
    request<{ message: SupportMessage }>(`/admin/support/messages/${messageId}`, {
      method: 'DELETE',
      auth: true,
    }),

  adminBroadcastSupportMessage: (data: { body: string; all?: boolean; userIds?: number[] }) =>
    request<{ sent: number; userIds: number[] }>('/admin/support/broadcast', {
      method: 'POST',
      body: data,
      auth: true,
    }),

  adminGetAuthor: () => request<{ author: SiteAuthor }>('/admin/author', { auth: true }),

  adminUpdateAuthor: (data: Partial<SiteAuthor>) =>
    request<{ author: SiteAuthor }>('/admin/author', {
      method: 'PUT',
      body: data,
      auth: true,
    }),

  adminReports: (status?: string) => {
    const suffix = status ? `?status=${status}` : '';
    return request<{ reports: CommunityReport[] }>(`/admin/reports${suffix}`, { auth: true });
  },

  adminGetReport: (id: number) =>
    request<{ report: CommunityReport }>(`/admin/reports/${id}`, { auth: true }),

  adminUpdateReport: (
    id: number,
    data: { status?: string; adminNotes?: string | null; adminAction?: string | null },
  ) =>
    request<{ report: CommunityReport }>(`/admin/reports/${id}`, {
      method: 'PUT',
      body: data,
      auth: true,
    }),

  adminDeleteReport: (id: number) =>
    request<null>(`/admin/reports/${id}`, { method: 'DELETE', auth: true }),

  adminReportEvidenceUrl: (reportId: number, index: number) =>
    `${API_BASE_URL}/admin/reports/${reportId}/evidence/${index}`,
};
