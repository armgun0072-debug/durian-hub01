"use client";
import { useState } from "react";
import { ArrowUpRight, MapPin, Scale, ShieldCheck } from "lucide-react";
import { ReviewSummary } from "./review-summary";
import type { MarketplacePostItem } from "@/data/mockData";

/**
 * Marketplace listing card.
 * The whole card is one hit target (stretched button on the title) so users
 * can tap anywhere; the price is the primary read, then place/variety/grade,
 * then who is offering it.
 */
export function ListingCard({ post, own, language, time, onOpen }: { post: MarketplacePostItem; own: boolean; language: "TH" | "EN"; time: { text: string; full: string }; onOpen: () => void }) {
  const th = language === "TH";
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const category = post.postType === "SELL"
    ? { label: th ? "ขาย" : "For sale", dot: "bg-emerald-600", text: "text-brand-ink" }
    : post.postType === "BUY"
      ? { label: th ? "รับซื้อ" : "Buying", dot: "bg-sky-600", text: "text-info-ink" }
      : { label: th ? "รับตัด" : "Cutting", dot: "bg-amber-500", text: "text-warning-ink" };
  const locale = th ? "th-TH" : "en-US";
  const quantity = post.quantityKg >= 1000
    ? `${(post.quantityKg / 1000).toLocaleString(locale)} ${th ? "ตัน" : "t"}`
    : `${post.quantityKg.toLocaleString(locale)} ${th ? "กก." : "kg"}`;
  const showImage = post.imageUrl && failedImage !== post.imageUrl;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[14px] border border-line bg-surface transition-colors duration-150 hover:border-line-strong focus-within:border-brand-line">
      {showImage && (
        <img src={post.imageUrl!} alt="" loading="lazy" decoding="async" width={640} height={360} className="aspect-[16/9] w-full object-cover" onError={() => setFailedImage(post.imageUrl!)} />
      )}

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className={`inline-flex items-center gap-1.5 font-semibold ${category.text}`}>
            <span className={`h-2 w-2 rounded-full ${category.dot}`} aria-hidden="true" />
            {category.label}
            {own && <span className="font-normal text-muted-foreground">· {th ? "ของคุณ" : "Yours"}</span>}
          </span>
          <time dateTime={post.createdAt} title={time.full} className="text-muted-foreground">{time.text}</time>
        </div>

        <h2 className="mt-2.5 line-clamp-2 text-base font-semibold leading-snug text-foreground">
          <button type="button" onClick={onOpen} className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {post.title}
          </button>
        </h2>

        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{post.province} · {post.variety} · {post.grade}</span>
        </p>

        <div className="mt-4 flex items-end justify-between gap-3">
          <p className="num text-2xl font-semibold tracking-tight text-foreground">
            ฿{post.pricePerKg.toLocaleString(locale)}
            <span className="ml-1 text-xs font-normal text-muted-foreground">/{th ? "กก." : "kg"}</span>
          </p>
          <span className="num inline-flex items-center gap-1 pb-1 text-xs text-secondary">
            <Scale className="h-3.5 w-3.5" aria-hidden="true" />{quantity}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <div className="mt-0 flex min-w-0 flex-1 items-center gap-1.5 border-t border-line pt-3 text-xs">
            <span className="truncate font-medium text-foreground">{post.authorName}</span>
            {post.isKycVerified && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-ink" aria-label={th ? "ยืนยันตัวตนแล้ว" : "Verified"} />}
            <span className="ml-auto shrink-0"><ReviewSummary average={post.rating} count={post.reviewCount} language={language} /></span>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-brand-ink" aria-hidden="true" />
          </div>
        </div>
      </div>
    </article>
  );
}
