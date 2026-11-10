import type { MarketplacePostItem } from '@/data/mockData';

export function reviewLabel(average: number | string | null | undefined, count: number | undefined, language: 'TH' | 'EN' = 'TH') {
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count!)) : 0;
  const th = language === 'TH';
  if (!total) return th ? 'ยังไม่มีรีวิว' : 'No reviews yet';
  const suffix = th ? `${total.toLocaleString('th-TH')} รีวิว` : `${total.toLocaleString('en-US')} reviews`;
  const rating = Number(average);
  if (average == null || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return `${th ? 'ยังไม่มีคะแนน' : 'Rating unavailable'} (${suffix})`;
  }
  return `${rating.toFixed(1)} (${suffix})`;
}

// A failed request is not an empty collection, and an outage is not an expired session.
export async function loadAdminOverview<T>(fetcher: typeof fetch = fetch): Promise<
  { kind: 'ready'; data: T } | { kind: 'unauthenticated' } | { kind: 'error' }
> {
  try {
    const response = await fetcher('/api/admin/overview', { cache: 'no-store' });
    if (response.status === 401 || response.status === 403) return { kind: 'unauthenticated' };
    if (!response.ok) return { kind: 'error' };
    const data = await response.json();
    if (!data?.admin || !data?.summary) return { kind: 'error' };
    return { kind: 'ready', data };
  } catch {
    return { kind: 'error' };
  }
}

export async function loadMarketplacePosts(fetcher: typeof fetch = fetch, days = 7): Promise<
  { kind: 'ready'; posts: MarketplacePostItem[] } | { kind: 'error' }
> {
  try {
    const response = await fetcher(`/api/posts?days=${days}`, { cache: 'no-store' });
    if (!response.ok) return { kind: 'error' };
    const data = await response.json();
    if (!Array.isArray(data.posts)) return { kind: 'error' };
    return { kind: 'ready', posts: data.posts };
  } catch {
    return { kind: 'error' };
  }
}
