import { Star } from 'lucide-react';
import { reviewLabel } from '@/lib/ui-feedback';

export function ReviewSummary({ average, count, language = 'TH', className = '' }: {
  average?: number | string | null; count?: number; language?: 'TH' | 'EN'; className?: string;
}) {
  return <span className={`inline-flex items-center gap-1 text-sm ${count && count > 0 ? 'text-warning-ink' : 'text-muted-foreground'} ${className}`}>
    {Boolean(count && count > 0) && <Star className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
    {reviewLabel(average, count, language)}
  </span>;
}
