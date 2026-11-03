"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Headphones, Package, X } from "lucide-react";
import { SupportCenter } from "@/components/support-center";
import { Button } from "@/components/ui";

type Room = { id: number; status: string; createdAt: string; partnerName: string; post: { id: number; title: string; postType: string; location?: { province: string } | null }; ticket: { id: number; status: string } | null };
export function SupportPortal({ initialRoomId, name, onClose }: { initialRoomId?: number; name: string; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(initialRoomId || null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [directRoom, setDirectRoom] = useState<Room | null>(null);
  const [cursor, setCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function load(next?: number, signal?: AbortSignal) {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/support/rooms${next ? `?cursor=${next}` : ""}`, { cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (signal?.aborted) return;
      setRooms(previous => next ? [...previous, ...data.rooms] : data.rooms); setCursor(data.nextCursor);
    } catch (e) { if (!signal?.aborted) setError((e as Error).message); }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => { const controller = new AbortController(); load(undefined, controller.signal); return () => controller.abort(); }, []);
  useEffect(() => {
    if (!initialRoomId) return;
    const controller = new AbortController();
    fetch(`/api/support/rooms?roomId=${initialRoomId}`, { cache: "no-store", signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      if (!controller.signal.aborted) setDirectRoom(data.rooms[0] || null);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [initialRoomId]);
  const room = rooms.find(item => item.id === selected) || (directRoom?.id === selected ? directRoom : null);
  return <div className="bg-surface text-foreground rounded-2xl border border-line shadow-panel w-full max-w-3xl h-[92dvh] sm:h-[85dvh] flex flex-col overflow-hidden">
    <header className="shrink-0 border-b border-line px-4 py-4 flex items-center gap-3">
      <button aria-label={selected ? "กลับไปเลือกรายการ" : "ปิดศูนย์ช่วยเหลือ"} onClick={() => selected ? setSelected(null) : onClose()} className="p-2 rounded-lg hover:bg-hover"><ArrowLeft className="w-5 h-5" /></button>
      <div className="flex-1"><h2 className="font-semibold text-lg">ศูนย์ช่วยเหลือ</h2><p className="text-xs text-muted-foreground">DURIAN HUB · ดูแลทุกการซื้อขาย</p></div>
      <button aria-label="ปิด" onClick={onClose} className="p-2 rounded-lg hover:bg-hover"><X className="w-5 h-5" /></button>
    </header>
    <div className="overflow-y-auto min-h-0 flex-1 overscroll-contain">
      {selected ? <>
        <div className="mx-4 mt-4 p-4 rounded-xl border border-line bg-subtle flex gap-3"><Package className="w-6 h-6 text-warning-ink shrink-0" /><div className="min-w-0"><p className="font-semibold break-words">{room?.post.title || `รายการห้อง #${selected}`}</p><p className="text-xs text-muted-foreground mt-1">ห้อง #{selected}{room ? ` · คู่ค้า ${room.partnerName} · ${room.post.location?.province || ""}` : ""}</p></div></div>
        <SupportCenter key={selected} roomId={selected} />
      </> : <>
        <div className="bg-brand-soft border-b border-brand-line p-6 flex items-start gap-4"><div className="flex-1"><p className="text-xs font-semibold text-brand-ink mb-2">พร้อมช่วยเหลือคุณ</p><h3 className="text-xl font-semibold">สวัสดี คุณ{name}</h3><p className="text-sm text-secondary mt-2">เลือกรายการที่ต้องการความช่วยเหลือ แจ้งรายละเอียด แล้วทีมงานจะรับเรื่องตามลำดับคิว</p></div><Headphones className="w-12 h-12 text-brand-ink shrink-0" /></div>
        <section className="p-4 sm:p-6 space-y-3"><h3 className="font-semibold">คุณต้องการแจ้งปัญหารายการไหน?</h3>
          <p className="text-xs text-muted-foreground">รวมรายการที่กำลังเจรจา ปิดดีลแล้ว และประวัติแชต</p>
          {error && <p role="alert" className="text-danger-ink">{error} <button onClick={() => load()}>ลองใหม่</button></p>}
          {!loading && !error && !rooms.length && <p className="p-5 bg-muted rounded-xl text-sm">ยังไม่มีรายการที่เคยสนทนา เมื่อเริ่มเจรจากับคู่ค้า รายการจะแสดงที่นี่</p>}
          {rooms.map(item => <button key={item.id} onClick={() => setSelected(item.id)} className="w-full flex items-start gap-3 text-left p-4 rounded-xl border border-line bg-surface hover:bg-brand-soft hover:border-brand-line transition focus-visible:ring-2 focus-visible:ring-emerald-500">
            <span className="rounded-xl p-3 bg-warning-soft text-warning-ink"><Package className="w-5 h-5" /></span><span className="flex-1 min-w-0"><span className="block text-xs text-brand-ink font-semibold mb-1">{item.post.postType === "BUY" ? "รับซื้อ" : item.post.postType === "CUT_SERVICE" ? "บริการรับตัด" : "ขายทุเรียน"} · ห้อง #{item.id}</span><span className="block font-semibold break-words">{item.post.title}</span><span className="block text-xs text-muted-foreground mt-1">คู่ค้า {item.partnerName} · {new Date(item.createdAt).toLocaleDateString("th-TH")}</span><span className="block text-xs text-secondary mt-2">{item.ticket ? `คำร้อง #${item.ticket.id} · ${item.ticket.status === "RESOLVED" ? "แก้ไขแล้ว" : item.ticket.status === "IN_PROGRESS" ? "กำลังดำเนินการ" : "รอรับเรื่อง"}` : item.status === "ACTIVE" ? "กำลังเจรจา" : "ปิดการเจรจาแล้ว"}</span></span><ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-2" />
          </button>)}
          {loading && <p role="status">กำลังโหลดรายการ...</p>}
          {cursor && <Button disabled={loading} className="w-full" onClick={() => load(cursor)}>ดูรายการเพิ่มเติม</Button>}
        </section>
      </>}
    </div>
  </div>;
}
