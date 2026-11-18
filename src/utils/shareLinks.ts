import { AppRoute } from '../types/durian';

export const PUBLIC_SHARED_APP_URL =
  'https://ais-pre-3i2rvo3lrim4c3ckgshdiy-903328716085.asia-east1.run.app';

export function getPublicBaseUrl(useCurrentOrigin = false): string {
  if (typeof window === 'undefined') {
    return PUBLIC_SHARED_APP_URL;
  }
  const origin = window.location.origin;
  if (useCurrentOrigin) {
    return origin;
  }
  // In AI Studio dev preview (ais-dev-*), share the public ais-pre-* URL so anyone can access it.
  if (origin.includes('ais-dev-') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return PUBLIC_SHARED_APP_URL;
  }
  return origin;
}

export function buildShareUrl(
  route: AppRoute,
  orchardId?: string,
  useCurrentOrigin = false
): string {
  const base = getPublicBaseUrl(useCurrentOrigin).replace(/\/+$/, '');
  const params = new URLSearchParams();

  if (route === 'orchard-detail' && orchardId) {
    params.set('view', 'orchard-detail');
    params.set('id', orchardId);
  } else if (route !== 'orchard-detail') {
    params.set('view', route);
  }

  const query = params.toString();
  return query ? `${base}/?${query}` : `${base}/`;
}
