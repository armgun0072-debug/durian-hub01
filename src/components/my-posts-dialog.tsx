"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Lock, Package, Pencil, Trash2, Unlock, X } from "lucide-react";
import { DialogFrame } from "@/components/dialog-frame";
import type { MarketplacePostItem } from "@/data/mockData";

type HistoryPost = MarketplacePostItem & {
  price: number;
  priceUnit: string;
  hasDeals?: boolean;
};

const filters = ["", "OPEN", "CLOSED", "HIDDEN_BY_ADMIN"] as const;

export function MyPostsDialog({
  userId,
  lang,
  onClose,
  onView,
  onCreate,
  onMutated,
}: {
  userId: number;
  lang: string;
  onClose: () => void;
  onView: (post: MarketplacePostItem) => void;
  onCreate: () => void;
  onMutated?: () => void;
}) {
  const th = lang === "TH";
  const labels = th
    ? ["ทั้งหมด", "เปิดรับอยู่", "ปิดดีลแล้ว", "ถูกซ่อน"]
    : ["All", "Active", "Closed", "Hidden"];

  const [status, setStatus] = useState("");
  const [postType, setPostType] = useState("");
  const [items, setItems] = useState<HistoryPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editContent, setEditContent] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const generation = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++generation.current;
    setLoading(true);
    setError(false);
    fetch(`/api/posts/mine?page=${page}&status=${status}&postType=${postType}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("history failed");
        return res.json();
      })
      .then((data) => {
        if (current !== generation.current) return;
        setItems((previous) =>
          page === 1
            ? data.posts
            : [
                ...previous,
                ...data.posts.filter(
                  (p: HistoryPost) => !previous.some((old) => old.id === p.id)
                ),
              ]
        );
        setTotal(data.total);
        setHasMore(data.hasMore);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [userId, status, postType, page, retry]);

  const startEdit = (p: HistoryPost) => {
    setActionMsg(null);
    setConfirmDeleteId(null);
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditPrice(String(p.pricePerKg || p.price));
    setEditQty(p.quantityKg ? String(p.quantityKg) : "");
    setEditContent(p.content || "");
  };

  const handleSaveEdit = async (postId: number) => {
    setActionMsg(null);
    setActionBusyId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          price: Number(editPrice),
          quantityKg: editQty.trim() ? Number(editQty) : null,
          content: editContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg({ kind: "error", text: data.error || (th ? "บันทึกไม่สำเร็จ" : "Save failed") });
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === postId
            ? {
                ...item,
                title: data.post.title,
                content: data.post.content,
                price: data.post.pricePerKg,
                pricePerKg: data.post.pricePerKg,
                quantityKg: data.post.quantityKg,
              }
            : item
        )
      );
      setEditingId(null);
      setActionMsg({ kind: "success", text: th ? "แก้ไขประกาศสำเร็จ" : "Listing updated" });
      onMutated?.();
    } catch {
      setActionMsg({ kind: "error", text: th ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" : "Network error" });
    } finally {
      setActionBusyId(null);
    }
  };

  const handleToggleStatus = async (p: HistoryPost) => {
    const nextStatus = p.status === "OPEN" ? "CLOSED" : "OPEN";
    setActionMsg(null);
    setActionBusyId(p.id);
    try {
      const res = await fetch(`/api/posts/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg({ kind: "error", text: data.error || (th ? "เปลี่ยนสถานะไม่สำเร็จ" : "Update failed") });
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === p.id ? { ...item, status: nextStatus } : item)));
      setActionMsg({
        kind: "success",
        text:
          nextStatus === "CLOSED"
            ? th ? "ปิดการขายประกาศแล้ว" : "Listing closed"
            : th ? "เปิดรับประกาศใหม่อีกครั้งแล้ว" : "Listing reopened",
      });
      onMutated?.();
    } catch {
      setActionMsg({ kind: "error", text: th ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" : "Network error" });
    } finally {
      setActionBusyId(null);
    }
  };

  const handleDelete = async (postId: number) => {
    setActionMsg(null);
    setActionBusyId(postId);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg({ kind: "error", text: data.error || (th ? "ลบประกาศไม่สำเร็จ" : "Delete failed") });
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== postId));
      setTotal((t) => Math.max(0, t - 1));
      setConfirmDeleteId(null);
      setActionMsg({ kind: "success", text: th ? "ลบประกาศเรียบร้อยแล้ว" : "Listing deleted" });
      onMutated?.();
    } catch {
      setActionMsg({ kind: "error", text: th ? "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" : "Network error" });
    } finally {
      setActionBusyId(null);
    }
  };

  const button = "rounded-lg bg-muted hover:bg-hover px-3 py-1.5 text-xs sm:text-sm text-foreground disabled:opacity-50 cursor-pointer transition";

  return (
    <DialogFrame
      label={th ? "ประวัติการโพสต์ของคุณ" : "My Post History"}
      onClose={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-surface text-foreground rounded-2xl max-w-2xl w-full p-5 sm:p-8 shadow-panel border border-line max-h-[90vh] flex flex-col">
        <div className="flex items-start gap-3 pb-4 border-b border-line">
          <Package className="w-8 h-8 text-brand-ink shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{th ? "ประวัติและการจัดการประกาศ" : "My Listings & History"}</h3>
            <p className="text-xs text-muted-foreground">
              {th
                ? "แก้ไขราคา ปิดการขาย หรือดูประวัติประกาศซื้อ ขาย และรับตัดทั้งหมด"
                : "Edit, close, or review all your listings and closed deals"}
            </p>
          </div>
          <button type="button" className={button} onClick={onClose} aria-label={th ? "ปิดหน้าต่าง" : "Close"}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <label className="flex items-center gap-3 pt-4 text-sm">
          {th ? "ประเภทประกาศ" : "Listing type"}
          <select
            aria-label={th ? "กรองประเภทประกาศ" : "Filter listing type"}
            value={postType}
            onChange={(event) => {
              setPostType(event.target.value);
              setPage(1);
              setItems([]);
              setTotal(0);
              setHasMore(false);
            }}
            className="rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
          >
            <option value="">{th ? "ทุกประเภท" : "All types"}</option>
            <option value="SELL">{th ? "ขาย · ชาวสวน" : "Sell · Grower"}</option>
            <option value="BUY">{th ? "รับซื้อ · ล้ง" : "Buy · Buyer"}</option>
            <option value="CUT_SERVICE">{th ? "รับตัด · ทีมตัด" : "Cut service · Crew"}</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-2 py-4" aria-label={th ? "กรองสถานะ" : "Filter status"}>
          {filters.map((value, i) => (
            <button
              type="button"
              key={value}
              aria-pressed={status === value}
              onClick={() => {
                if (value === status) return;
                setStatus(value);
                setPage(1);
                setItems([]);
                setTotal(0);
                setHasMore(false);
              }}
              className={`${button} ${
                status === value ? "!bg-brand-soft !text-brand-ink ring-1 ring-brand-line" : ""
              }`}
            >
              {labels[i]}
            </button>
          ))}
        </div>

        {actionMsg && (
          <div
            role={actionMsg.kind === "error" ? "alert" : "status"}
            className={`mb-3 px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
              actionMsg.kind === "error"
                ? "bg-danger-soft border-danger-line text-danger-ink"
                : "bg-brand-soft border-brand-line text-brand-ink"
            }`}
          >
            <span>{actionMsg.text}</span>
            <button type="button" onClick={() => setActionMsg(null)} className="p-0.5">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 min-h-24" aria-busy={loading}>
          {items.map((p) => {
            const isEditing = editingId === p.id;
            const isBusy = actionBusyId === p.id;
            const canEditOrDelete = p.status !== "HIDDEN_BY_ADMIN";

            return (
              <article key={p.id} className="rounded-xl border border-line p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>
                      {p.postType === "SELL"
                        ? th ? "ขาย" : "Sell"
                        : p.postType === "BUY"
                        ? th ? "รับซื้อ" : "Buy"
                        : th ? "รับตัด" : "Cut service"}
                    </span>
                    <span className="rounded-full px-2 py-0.5 bg-brand-soft text-brand-ink font-medium">
                      {labels[filters.indexOf(p.status as (typeof filters)[number])] || p.status}
                    </span>
                    <time dateTime={p.createdAt}>
                      {new Date(p.createdAt).toLocaleDateString(th ? "th-TH" : "en-GB")}
                    </time>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2.5 pt-1 border-t border-line/60">
                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">
                        {th ? "หัวข้อประกาศ" : "Title"}
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1">
                          {th ? "ราคา (บาท)" : "Price (THB)"}
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-foreground num"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-secondary mb-1">
                          {th ? "ปริมาณ (กก.)" : "Quantity (kg)"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-foreground num"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">
                        {th ? "รายละเอียด" : "Details"}
                      </label>
                      <textarea
                        rows={2}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-foreground"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => setEditingId(null)}
                        className={button}
                      >
                        {th ? "ยกเลิก" : "Cancel"}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSaveEdit(p.id)}
                        className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{th ? "บันทึกการแก้ไข" : "Save"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold break-words">{p.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {p.variety} • {p.grade} • {p.province} • {p.quantityKg.toLocaleString()}{" "}
                      {th ? "กก." : "kg"}
                    </p>
                    <div className="flex flex-wrap justify-between items-center gap-2 pt-1">
                      <span className="text-sm font-semibold text-brand-ink num">
                        {th ? "ราคาเสนอ " : "Offer "}฿{p.price.toLocaleString()}{" "}
                        {p.priceUnit === "PER_KG"
                          ? th ? "/กก." : "/kg"
                          : p.priceUnit === "PER_TON"
                          ? th ? "/ตัน" : "/ton"
                          : th ? "/เหมา" : "/lot"}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {canEditOrDelete && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => startEdit(p)}
                              className={`${button} inline-flex items-center gap-1`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>{th ? "แก้ไข" : "Edit"}</span>
                            </button>

                            {!(p.status === "CLOSED" && p.hasDeals) && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleToggleStatus(p)}
                                className={`${button} inline-flex items-center gap-1`}
                              >
                                {p.status === "OPEN" ? (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>{th ? "ปิดการขาย" : "Close"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>{th ? "เปิดรับใหม่" : "Reopen"}</span>
                                  </>
                                )}
                              </button>
                            )}

                            {!p.hasDeals && (
                              confirmDeleteId === p.id ? (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleDelete(p.id)}
                                  className="rounded-lg bg-danger-soft hover:bg-danger-soft/80 text-danger-ink border border-danger-line px-3 py-1.5 text-xs font-semibold cursor-pointer"
                                >
                                  {th ? "ยืนยันลบ?" : "Confirm delete?"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => setConfirmDeleteId(p.id)}
                                  className="rounded-lg bg-muted hover:bg-danger-soft text-danger-ink px-2.5 py-1.5 text-xs cursor-pointer transition inline-flex items-center gap-1"
                                  aria-label={th ? "ลบประกาศ" : "Delete listing"}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )
                            )}
                          </>
                        )}

                        <button type="button" className={button} onClick={() => onView(p)}>
                          {th ? "ดูประกาศ" : "View"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            );
          })}

          {loading && (
            <p role="status" className="text-sm text-muted-foreground py-4">
              {th ? "กำลังโหลดประวัติ…" : "Loading history…"}
            </p>
          )}
          {error && (
            <div role="alert" className="py-4 space-y-2">
              <p>{th ? "โหลดประวัติไม่สำเร็จ" : "Could not load history"}</p>
              <button type="button" className={button} onClick={() => setRetry((r) => r + 1)}>
                {th ? "ลองอีกครั้ง" : "Retry"}
              </button>
            </div>
          )}
          {!loading && !error && !items.length && (
            <div className="text-center py-8 space-y-3">
              <p>
                {th
                  ? status || postType
                    ? "ไม่พบประกาศตามตัวกรองที่เลือก"
                    : "คุณยังไม่มีประวัติประกาศ"
                  : status || postType
                  ? "No listings match these filters"
                  : "No listings yet"}
              </p>
              {!status && !postType && (
                <button type="button" className={button} onClick={onCreate}>
                  {th ? "สร้างประกาศแรก" : "Create your first listing"}
                </button>
              )}
            </div>
          )}
          {hasMore && !error && (
            <button
              type="button"
              className={button}
              disabled={loading}
              onClick={() => setPage((p) => p + 1)}
            >
              {th ? "โหลดเพิ่มเติม" : "Load more"}
            </button>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 mt-4 border-t border-line gap-2">
          <span className="text-xs text-muted-foreground">
            {th ? `ทั้งหมด ${total} รายการ` : `${total} listings`}
          </span>
          <button type="button" className={button} onClick={onClose}>
            {th ? "ปิดหน้าต่าง" : "Close"}
          </button>
        </div>
      </div>
    </DialogFrame>
  );
}
