"use client";
import { useState } from "react";
import { ArrowUpRight, MapPin, ShieldCheck, UserRound } from "lucide-react";
import { ReviewSummary } from "./review-summary";
import type { MarketplacePostItem } from "@/data/mockData";
import { Button } from "./ui";

export function ListingCard({ post, own, language, time, onOpen }: { post: MarketplacePostItem; own: boolean; language: "TH" | "EN"; time: { text: string; full: string }; onOpen: () => void }) {
  const th = language === "TH";
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const category = post.postType === "SELL" ? { label: th ? "ประกาศขาย" : "For sale", color: "bg-brand-soft text-brand-ink" } : post.postType === "BUY" ? { label: th ? "ประกาศรับซื้อ" : "Buying", color: "bg-info-soft text-info-ink" } : { label: th ? "บริการตัด" : "Cutting service", color: "bg-warning-soft text-warning-ink" };
  const quantity = post.quantityKg >= 1000 ? `${(post.quantityKg / 1000).toLocaleString(th ? "th-TH" : "en-US")} ${th ? "ตัน" : "t"}` : `${post.quantityKg.toLocaleString(th ? "th-TH" : "en-US")} ${th ? "กก." : "kg"}`;
  return (
    <article className="flex h-full flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-line-strong">
      {post.imageUrl && failedImage !== post.imageUrl && <img src={post.imageUrl} alt={post.title} loading="lazy" decoding="async" width={640} height={360} className="mb-4 aspect-video w-full rounded-lg object-cover" onError={() => setFailedImage(post.imageUrl!)} />}
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${category.color}`}>{category.label}</span>
        <time dateTime={post.createdAt} title={time.full} className="text-xs text-muted-foreground">{time.text}</time>
      </div>
      <h2 className="mb-2 mt-4 line-clamp-2 text-lg font-semibold leading-relaxed text-foreground">{post.title}</h2>
      <p className="flex items-start gap-1.5 text-sm leading-relaxed text-secondary"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><span>{post.province} · {post.variety} · {post.grade}</span></p>
      <div className="my-5 flex flex-wrap items-end justify-between gap-2">
        <p className="text-2xl font-semibold tracking-tight text-brand-ink">฿{post.pricePerKg.toLocaleString(th ? "th-TH" : "en-US")}<span className="ml-1 text-xs font-normal text-muted-foreground">/{th ? "กก." : "kg"}</span></p>
        <span className="pb-1 text-sm text-secondary">{quantity}</span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-line pt-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-secondary"><UserRound className="h-4 w-4" aria-hidden="true" /></div>
        <div className="min-w-0 flex-1"><p className="flex items-center gap-1.5 text-sm font-medium text-foreground"><span className="truncate">{post.authorName}</span>{post.isKycVerified && <ShieldCheck className="h-4 w-4 shrink-0 text-brand-ink" aria-label={th ? "ยืนยันตัวตนแล้ว" : "Verified"} />}</p>{own && <p className="text-xs text-muted-foreground">{th ? "ประกาศของคุณ" : "Your listing"}</p>}</div>
        <ReviewSummary average={post.rating} count={post.reviewCount} language={language} />
      </div>
      <Button variant="secondary" className="mt-4 w-full" onClick={onOpen}>{th ? "ดูรายละเอียด" : "View listing"}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Button>
    </article>
  );
}
