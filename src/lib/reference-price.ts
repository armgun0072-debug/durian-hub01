export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function referencePrice(samples: { userId: number; price: number }[]) {
  const byUser = new Map<number, number[]>();
  for (const { userId, price } of samples) {
    if (!Number.isFinite(price) || price <= 0) continue;
    const previous = byUser.get(userId) ?? [];
    previous.push(price);
    byUser.set(userId, previous);
  }
  const prices = [...byUser.values()].map(values => median(values)!);
  const center = median(prices);
  const eligible = center === null || prices.length < 3 ? [] : prices.filter(price => price >= center / 3 && price <= center * 3);
  const estimate = eligible.length >= 3 ? median(eligible) : null;
  return { estimate: estimate === null ? null : Math.round(estimate * 100) / 100, eligible, sources: byUser.size };
}
