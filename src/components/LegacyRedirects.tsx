import { Navigate, useParams } from 'react-router-dom';

/** Redirige les anciennes URLs /communautes/* vers /solutions/* */
export function LegacyCommunityRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/solutions/${id ?? ''}`} replace />;
}

export function LegacyCommunityEventRedirect() {
  const { id, eventId } = useParams<{ id: string; eventId: string }>();
  return <Navigate to={`/solutions/${id ?? ''}/evenements/${eventId ?? ''}`} replace />;
}

export function LegacyCommunityReportRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/solutions/${id ?? ''}/signaler`} replace />;
}
