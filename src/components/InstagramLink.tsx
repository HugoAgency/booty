import { ArrowUpLeft, Instagram } from 'lucide-react';
import { INSTAGRAM_ACCOUNT } from '@/lib/social';

export default function InstagramLink({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={INSTAGRAM_ACCOUNT.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`تابعينا على إنستقرام @${INSTAGRAM_ACCOUNT.handle} (يفتح في علامة تبويب جديدة)`}
      className={compact
        ? 'group flex min-h-11 items-center gap-3 rounded-xl border border-rose-800/60 bg-rose-900/30 px-3 py-2.5 text-rose-100 transition-colors hover:border-brand-primary hover:bg-rose-900/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary'
        : 'group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-brand-dark px-6 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-brand-800 active:bg-brand-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700'}
    >
      <Instagram className="h-5 w-5 shrink-0" aria-hidden="true" />
      {compact ? <span className="min-w-0 text-xs">
        <span className="block font-semibold">تابعينا على إنستقرام</span>
        <bdi dir="ltr" className="block break-all text-rose-200/80">@{INSTAGRAM_ACCOUNT.handle}</bdi>
      </span> : <span>تابعينا على إنستقرام</span>}
      <ArrowUpLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  );
}
