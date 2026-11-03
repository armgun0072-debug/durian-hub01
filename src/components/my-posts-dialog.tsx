"use client";

import { useEffect, useRef, useState } from "react";
import { Package, X } from "lucide-react";
import { DialogFrame } from "@/components/dialog-frame";
import type { MarketplacePostItem } from "@/data/mockData";

type HistoryPost = MarketplacePostItem & { price: number; priceUnit: string };
const filters = ["", "OPEN", "CLOSED", "HIDDEN_BY_ADMIN"] as const;

export function MyPostsDialog({ userId, lang, onClose, onView, onCreate }: {
  userId: number; lang: string; onClose: () => void;
  onView: (post: MarketplacePostItem) => void; onCreate: () => void;
}) {
  const th = lang === "TH";
  const labels = th ? ["ทั้งหมด", "เปิดรับอยู่", "ปิดดีลแล้ว", "ถูกซ่อน"] : ["All", "Active", "Closed", "Hidden"];
  const [status, setStatus] = useState("");
  const [postType, setPostType] = useState("");
  const [items, setItems] = useState<HistoryPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++generation.current;
    setLoading(true); setError(false);
    fetch(`/api/posts/mine?page=${page}&status=${status}&postType=${postType}`, { signal: controller.signal, cache: "no-store" })
      .then(async res => {
        if (!res.ok) throw new Error("history failed");
        return res.json();
      }).then(data => {
        if (current !== generation.current) return;
        setItems(previous => page === 1 ? data.posts : [...previous, ...data.posts.filter((p: HistoryPost) => !previous.some(old => old.id === p.id))]);
        setTotal(data.total); setHasMore(data.hasMore);
      }).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [userId, status, postType, page, retry]);

  const button = "rounded-lg bg-muted hover:bg-hover px-4 py-2 text-sm text-foreground disabled:opacity-50";
  return <DialogFrame label={th ? "ประวัติการโพสต์ของคุณ" : "My Post History"} onClose={onClose} className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-surface text-foreground rounded-2xl max-w-2xl w-full p-5 sm:p-8 shadow-panel border border-line max-h-[90vh] flex flex-col">
      <div className="flex items-start gap-3 pb-4 border-b border-line">
        <Package className="w-8 h-8 text-brand-ink shrink-0" />
        <div className="flex-1"><h3 className="font-semibold text-lg">{th ? "ประวัติการโพสต์ของคุณ" : "My Post History"}</h3>
          <p className="text-xs text-muted-foreground">{th ? "ประกาศซื้อ ขาย และรับตัดทั้งหมด รวมรายการที่ปิดดีลแล้ว" : "All your listings, including closed deals"}</p></div>
        <button className={button} onClick={onClose} aria-label={th ? "ปิดหน้าต่าง" : "Close"}><X className="w-4 h-4" /></button>
      </div>
      <label className="flex items-center gap-3 pt-4 text-sm">
        {th ? "ประเภทประกาศ" : "Listing type"}
        <select aria-label={th ? "กรองประเภทประกาศ" : "Filter listing type"} value={postType} onChange={event => {
          setPostType(event.target.value); setPage(1); setItems([]); setTotal(0); setHasMore(false);
        }} className="rounded-lg border border-line bg-surface px-3 py-2 text-foreground">
          <option value="">{th ? "ทุกประเภท" : "All types"}</option>
          <option value="SELL">{th ? "ขาย · ชาวสวน" : "Sell · Grower"}</option>
          <option value="BUY">{th ? "รับซื้อ · ล้ง" : "Buy · Buyer"}</option>
          <option value="CUT_SERVICE">{th ? "รับตัด · ทีมตัด" : "Cut service · Crew"}</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2 py-4" aria-label={th ? "กรองสถานะ" : "Filter status"}>
        {filters.map((value, i) => <button key={value} aria-pressed={status === value} onClick={() => { if (value === status) return; setStatus(value); setPage(1); setItems([]); setTotal(0); setHasMore(false); }} className={`${button} ${status === value ? "!bg-brand-soft !text-brand-ink ring-1 ring-brand-line" : ""}`}>{labels[i]}</button>)}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 min-h-24" aria-busy={loading}>
        {items.map(p => <article key={p.id} className="rounded-xl border border-line p-4 space-y-2">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{p.postType === "SELL" ? (th ? "ขาย" : "Sell") : p.postType === "BUY" ? (th ? "รับซื้อ" : "Buy") : (th ? "รับตัด" : "Cut service")}</span>
            <span className="rounded-full px-2 bg-brand-soft text-brand-ink">{labels[filters.indexOf(p.status as typeof filters[number]) ] || p.status}</span>
            <time dateTime={p.createdAt}>{new Date(p.createdAt).toLocaleDateString(th ? "th-TH" : "en-GB")}</time>
          </div>
          <h4 className="font-semibold break-words">{p.title}</h4>
          <p className="text-xs text-muted-foreground">{p.variety} • {p.grade} • {p.province} • {p.quantityKg.toLocaleString()} {th ? "กก." : "kg"}</p>
          <div className="flex flex-wrap justify-between items-center gap-2">
            <span className="text-sm text-brand-ink">{th ? "ราคาเสนอ " : "Offer "}฿{p.price.toLocaleString()} {p.priceUnit === "PER_KG" ? (th ? "/กก." : "/kg") : p.priceUnit === "PER_TON" ? (th ? "/ตัน" : "/ton") : (th ? "/เหมา" : "/lot")}</span>
            <button className={button} onClick={() => onView(p)}>{th ? "ดูประกาศ" : "View listing"}</button>
          </div>
        </article>)}
        {loading && <p role="status" className="text-sm text-muted-foreground py-4">{th ? "กำลังโหลดประวัติ…" : "Loading history…"}</p>}
        {error && <div role="alert" className="py-4 space-y-2"><p>{th ? "โหลดประวัติไม่สำเร็จ" : "Could not load history"}</p><button className={button} onClick={() => setRetry(r => r + 1)}>{th ? "ลองอีกครั้ง" : "Retry"}</button></div>}
        {!loading && !error && !items.length && <div className="text-center py-8 space-y-3">
          <p>{th ? (status || postType ? "ไม่พบประกาศตามตัวกรองที่เลือก" : "คุณยังไม่มีประวัติประกาศ") : (status || postType ? "No listings match these filters" : "No listings yet")}</p>
          {!status && !postType && <button className={button} onClick={onCreate}>{th ? "สร้างประกาศแรก" : "Create your first listing"}</button>}
        </div>}
        {hasMore && !error && <button className={button} disabled={loading} onClick={() => setPage(p => p + 1)}>{th ? "โหลดเพิ่มเติม" : "Load more"}</button>}
      </div>
      <div className="flex justify-between items-center pt-4 mt-4 border-t border-line gap-2">
        <span className="text-xs text-muted-foreground">{th ? `ทั้งหมด ${total} รายการ` : `${total} listings`}</span>
        <button className={button} onClick={onClose}>{th ? "ปิดหน้าต่าง" : "Close"}</button>
      </div>
    </div>
  </DialogFrame>;
}
