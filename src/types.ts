export type CommunityStatus = 'pending' | 'approved' | 'rejected';
export type PricingType = 'free' | 'freemium' | 'paid';
export type BillingPeriod = 'monthly' | 'yearly' | 'one_time';
export type UserRole = 'lead' | 'admin';
export type MembershipRole = 'owner' | 'co_lead';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt?: string | null;
}

export interface CoLead {
  name: string;
  role?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  linkedinUrl?: string | null;
}

export interface CommunityEvent {
  id: number;
  communityId: number;
  title: string;
  description?: string | null;
  posterUrl?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  eventUrl?: string | null;
  status?: 'upcoming' | 'past';
  communityName?: string | null;
  communitySlug?: string | null;
  organizerName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CommunityEngagement {
  likesCount: number;
  ratingAvg: number | null;
  reviewsCount: number;
  liked?: boolean;
  userRating?: number | null;
}

export interface Community {
  id?: number;
  slug?: string | null;
  userId?: number | null;
  name: string;
  description: string;
  shortDescription?: string | null;
  mission?: string | null;
  country: string;
  city?: string | null;
  tags: string[];
  logoUrl?: string | null;
  bannerUrl?: string | null;
  whatsappUrl?: string | null;
  telegramUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  leaderName: string;
  leaderEmail?: string;
  leaderPhone?: string | null;
  leaderPhotoUrl?: string | null;
  leaderBio?: string | null;
  coLeads?: CoLead[];
  gallery?: string[];
  foundedYear?: number | null;
  memberCount?: number | null;
  meetingInfo?: string | null;
  publicEmail?: string | null;
  pricingType?: PricingType;
  priceAmount?: number | null;
  currency?: string;
  billingPeriod?: BillingPeriod | null;
  appUrl?: string | null;
  demoUrl?: string | null;
  status: CommunityStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  membershipRole?: MembershipRole | null;
  events?: CommunityEvent[];
  likesCount?: number;
  ratingAvg?: number | null;
  reviewsCount?: number;
}

export interface CountryData {
  code: string;
  name: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface LeadSummary {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
  communitiesCount: number;
}

export interface LeadDetail extends LeadSummary {
  updatedAt?: string | null;
}

export interface AdminUserSummary {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt: string;
  communitiesCount: number;
}

export interface AdminUserDetail extends AdminUserSummary {
  updatedAt?: string | null;
}

export interface SupportAttachment {
  key: string;
  originalName: string;
  mime: string;
  size?: number;
}

export interface SupportMessage {
  id: number;
  userId: number;
  senderRole: 'lead' | 'admin';
  body: string;
  attachments?: SupportAttachment[];
  isRead: boolean;
  createdAt: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface SupportConversation {
  userId: number;
  name: string;
  email: string;
  lastBody?: string | null;
  lastAt?: string | null;
  unread: number;
}

export interface SiteAuthor {
  name: string;
  roleLabel: string;
  badgeLabel: string;
  quote: string;
  bio: string;
  photoUrl?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  updatedAt?: string | null;
}

export interface AdminStats {
  communities: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  leads: number;
  admins?: number;
  messages: {
    total: number;
    unread: number;
  };
  reports?: {
    total: number;
    pending: number;
    investigating: number;
  };
}

export type ReportTargetType = 'community' | 'lead';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface ReportEvidenceFile {
  key: string;
  originalName: string;
  mime: string;
}

export interface CommunityReport {
  id: number;
  communityId: number;
  communityName?: string | null;
  targetType: ReportTargetType;
  category: string;
  categoryLabel?: string;
  description: string;
  evidence?: ReportEvidenceFile[];
  evidenceCount?: number;
  trackingCode?: string;
  status: ReportStatus;
  statusLabel?: string;
  adminNotes?: string | null;
  adminAction?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  ownerId?: number | null;
  leaderName?: string | null;
}

export interface ReportTrackInfo {
  trackingCode: string;
  status: ReportStatus;
  statusLabel: string;
  createdAt: string;
  reviewedAt?: string | null;
}
