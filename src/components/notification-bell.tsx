"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, FileCheck2, Handshake, MessageSquare, Star } from "lucide-react";

interface NotificationItem {
  id: string;
  kind: "ROLE" | "DEAL" | "REVIEW";
  titleTh: string;
  titleEn: string;
  detailTh: string;
  detailEn: string;
  createdAt: string;
}

function readSeenIds(storageKey: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeSeenIds(storageKey: string, ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    // Keep up to 100 latest seen IDs per user
    window.localStorage.setItem(storageKey, JSON.stringify(ids.slice(-100)));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function NotificationBell({
  userId,
  lang,
  unreadChatCount,
  onOpenChat,
  onOpenDeals,
}: {
  userId: number;
  lang: "TH" | "EN";
  unreadChatCount: number;
  onOpenChat: () => void;
  onOpenDeals: () => void;
}) {
  const th = lang === "TH";
  const storageKey = `durian_hub_notif_seen_${userId}`;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>(() => readSeenIds(storageKey));
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSeenIds(readSeenIds(storageKey));
  }, [storageKey]);

  useEffect(() => {
    let active = true;
    const load = () => {
      fetch("/api/notifications", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { notifications: [] }))
        .then((data) => {
          if (!active) return;
          const list = Array.isArray(data.notifications) ? data.notifications : [];
          setItems(list);
        })
        .catch(() => {});
    };
    load();
    const timer = setInterval(load, 15000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [userId]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const seenSet = useMemo(() => new Set(seenIds), [seenIds]);
  const unreadItems = useMemo(() => items.filter((item) => !seenSet.has(item.id)), [items, seenSet]);
  const totalBadge = unreadChatCount + unreadItems.length;

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setHighlightedIds(unreadItems.map((i) => i.id));
      if (items.length > 0) {
        const merged = Array.from(new Set([...seenIds, ...items.map((i) => i.id)]));
        setSeenIds(merged);
        writeSeenIds(storageKey, merged);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={th ? "การแจ้งเตือน" : "Notifications"}
        aria-expanded={open}
        className="relative w-9 h-9 rounded-full bg-surface hover:bg-hover border border-line flex items-center justify-center text-secondary hover:text-foreground transition cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {totalBadge > 0 && (
          <span className="num absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-semibold flex items-center justify-center">
            {totalBadge > 9 ? "9+" : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-line rounded-2xl shadow-panel p-3.5 text-foreground z-50 space-y-2.5">
          <div className="flex items-center justify-between px-1 pb-2 border-b border-line">
            <span className="font-semibold text-sm">
              {th ? "ศูนย์การแจ้งเตือน" : "Notifications"}
            </span>
            <span className="text-xs text-muted-foreground num">
              {items.length + (unreadChatCount > 0 ? 1 : 0)} {th ? "รายการ" : "items"}
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5">
            {unreadChatCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpenChat();
                }}
                className="w-full text-left p-2.5 rounded-xl bg-brand-soft/80 hover:bg-brand-soft border border-brand-line flex items-start gap-2.5 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-brand-ink shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 text-xs">
                  <div className="font-semibold text-brand-ink">
                    {th
                      ? `มีข้อความแชตใหม่ยังไม่ได้อ่าน ${unreadChatCount} ข้อความ`
                      : `${unreadChatCount} unread chat message(s)`}
                  </div>
                  <div className="text-secondary mt-0.5">
                    {th ? "คลิกเพื่อเปิดห้องสนทนา" : "Click to open conversations"}
                  </div>
                </div>
              </button>
            )}

            {items.length === 0 && unreadChatCount === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                {th ? "ยังไม่มีการแจ้งเตือนใหม่" : "No notifications yet"}
              </div>
            ) : (
              items.map((item) => {
                const isNewThisOpen = highlightedIds.includes(item.id);
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => {
                      setOpen(false);
                      if (item.kind === "DEAL") onOpenDeals();
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-start gap-2.5 transition cursor-pointer ${
                      isNewThisOpen
                        ? "bg-brand-soft/40 border-brand-line/50 hover:bg-brand-soft/70"
                        : "hover:bg-muted/70 border-transparent hover:border-line"
                    }`}
                  >
                    {item.kind === "DEAL" ? (
                      <Handshake className="w-4 h-4 text-brand-ink shrink-0 mt-0.5" />
                    ) : item.kind === "REVIEW" ? (
                      <Star className="w-4 h-4 text-warning-ink shrink-0 mt-0.5" />
                    ) : (
                      <FileCheck2 className="w-4 h-4 text-info-ink shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="truncate">{th ? item.titleTh : item.titleEn}</span>
                        {isNewThisOpen && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-muted-foreground truncate mt-0.5">
                        {th ? item.detailTh : item.detailEn}
                      </div>
                      <time className="text-[11px] text-muted-foreground/80 mt-0.5 block">
                        {new Date(item.createdAt).toLocaleDateString(th ? "th-TH" : "en-GB")}
                      </time>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
