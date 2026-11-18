"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Handshake, MapPin, ShieldCheck, Star, User, X } from "lucide-react";
import { DialogFrame } from "@/components/dialog-frame";
import { ReviewSummary } from "@/components/review-summary";

interface PartnerProfile {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  isKycVerified: boolean;
  trustScore: number;
  ratingAvg: number;
  ratingCount: number;
  province: string;
  region: string;
  dealsCount: number;
  joinedAt: string;
  roles: Array<{ roleType: string; businessName: string | null; isVerified: boolean }>;
}

interface PartnerReviewItem {
  id: number;
  rating: number;
  comment: string;
  reviewerName: string;
  postTitle: string;
  postType: string;
  createdAt: string;
}

export function PartnerReviewsDialog({
  userId,
  fallbackName,
  lang,
  onClose,
}: {
  userId: number;
  fallbackName?: string;
  lang: "TH" | "EN";
  onClose: () => void;
}) {
  const th = lang === "TH";
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [reviews, setReviews] = useState<PartnerReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/reviews?userId=${userId}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        setProfile(data.profile || null);
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [userId]);

  const roleLabel = (roleType: string) =>
    roleType === "SELLER"
      ? th ? "ชาวสวนผู้ขาย" : "Orchard Grower"
      : roleType === "BUYER"
      ? th ? "ล้งรับซื้อ" : "Lhong Buyer"
      : th ? "ทีมตัดทุเรียน" : "Harvest Crew";

  return (
    <DialogFrame
      label={th ? "ข้อมูลคู่ค้าและประวัติรีวิว" : "Partner Profile & Reviews"}
      onClose={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-surface text-foreground rounded-2xl max-w-xl w-full p-5 sm:p-7 shadow-panel border border-line max-h-[90vh] flex flex-col">
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-line">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-semibold text-lg flex items-center justify-center shrink-0 overflow-hidden">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                (profile?.fullName || fallbackName || "U").charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-lg truncate">
                  {profile?.fullName || fallbackName || (th ? "ข้อมูลคู่ค้า" : "Partner")}
                </h3>
                {profile?.isKycVerified && (
                  <CheckCircle2 className="w-4 h-4 text-brand-ink shrink-0" />
                )}
              </div>
              {profile?.province && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {th ? `จ.${profile.province}` : profile.province}
                    {profile.region ? ` (${profile.region})` : ""}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={th ? "ปิดหน้าต่าง" : "Close"}
            className="rounded-lg bg-muted hover:bg-hover p-2 text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <p role="status" className="text-sm text-muted-foreground py-8 text-center">
            {th ? "กำลังโหลดโปรไฟล์และความคิดเห็นรีวิว…" : "Loading partner profile & reviews…"}
          </p>
        ) : error || !profile ? (
          <div role="alert" className="py-8 text-center text-sm text-danger-ink">
            {th ? "ไม่สามารถโหลดข้อมูลโปรไฟล์คู่ค้าได้" : "Could not load partner profile."}
          </div>
        ) : (
          <>
            {/* Trust & Stats Strip */}
            <div className="grid grid-cols-3 gap-2.5 py-4 border-b border-line">
              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="text-[11px] text-muted-foreground">
                  {th ? "คะแนนรีวิวคู่ค้า" : "Partner Rating"}
                </div>
                <div className="mt-1 text-sm font-semibold text-warning-ink">
                  <ReviewSummary average={profile.ratingAvg} count={profile.ratingCount} language={lang} />
                </div>
              </div>
              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="text-[11px] text-muted-foreground">
                  {th ? "คะแนนความประพฤติ" : "Trust Score"}
                </div>
                <div className="mt-1 text-sm font-bold text-brand-ink flex items-center gap-1 num">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{profile.trustScore}/100</span>
                </div>
              </div>
              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="text-[11px] text-muted-foreground">
                  {th ? "ปิดดีลสำเร็จ" : "Closed Deals"}
                </div>
                <div className="mt-1 text-sm font-bold text-foreground flex items-center gap-1 num">
                  <Handshake className="w-4 h-4 text-brand-ink shrink-0" />
                  <span>
                    {profile.dealsCount} {th ? "ดีล" : "deals"}
                  </span>
                </div>
              </div>
            </div>

            {/* Verified Roles */}
            {profile.roles.length > 0 && (
              <div className="py-3 border-b border-line flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground mr-1">
                  {th ? "บทบาทที่ยืนยันแล้ว:" : "Verified roles:"}
                </span>
                {profile.roles.map((r) => (
                  <span
                    key={r.roleType}
                    className="px-2.5 py-1 rounded-full bg-brand-soft text-brand-ink border border-brand-line font-medium"
                  >
                    {roleLabel(r.roleType)}
                    {r.businessName ? ` • ${r.businessName}` : ""}
                  </span>
                ))}
              </div>
            )}

            {/* Review Comments List */}
            <div className="flex-1 overflow-y-auto pt-4 space-y-3 min-h-32">
              <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider">
                {th
                  ? `ความคิดเห็นจากคู่ค้าจริง (${reviews.length} รายการ)`
                  : `Verified Partner Reviews (${reviews.length})`}
              </h4>

              {reviews.length === 0 ? (
                <div className="rounded-xl border border-line bg-canvas p-6 text-center text-xs text-muted-foreground">
                  {th
                    ? "สมาชิกท่านนี้ยังไม่มีข้อความรีวิวจากดีลที่ปิดสำเร็จ"
                    : "No written reviews recorded for this partner yet."}
                </div>
              ) : (
                reviews.map((rv) => (
                  <article key={rv.id} className="rounded-xl border border-line bg-canvas p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-foreground inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand-ink" />
                        <span>{rv.reviewerName}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5 font-semibold text-warning-ink num">
                          {Array.from({ length: rv.rating }).map((_, idx) => (
                            <Star key={idx} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          <span className="ml-1">{rv.rating}/5</span>
                        </span>
                        <time dateTime={rv.createdAt} className="text-muted-foreground">
                          {new Date(rv.createdAt).toLocaleDateString(th ? "th-TH" : "en-GB")}
                        </time>
                      </div>
                    </div>
                    {rv.comment ? (
                      <p className="text-sm text-foreground leading-relaxed">{rv.comment}</p>
                    ) : (
                      <p className="text-xs italic text-muted-foreground">
                        {th ? "(ให้คะแนนดาวโดยไม่มีข้อความเพิ่มเติม)" : "(Star rating without written comment)"}
                      </p>
                    )}
                    <div className="text-[11px] text-muted-foreground pt-1 border-t border-line/60">
                      {th ? "ดีลประกาศ:" : "Deal listing:"} {rv.postTitle}
                    </div>
                  </article>
                ))
              )}
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-muted hover:bg-hover px-4 py-2 text-sm text-foreground cursor-pointer"
          >
            {th ? "ปิดหน้าต่าง" : "Close"}
          </button>
        </div>
      </div>
    </DialogFrame>
  );
}
