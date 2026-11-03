"use client";
import { Headphones, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Ticket = { id: number; status: string; category: string; resolution?: string; requester: { fullName: string }; room: { post: { title: string } } };
type Message = { id: number; content: string; isAdmin: boolean; createdAt: string; sender: { fullName: string } };
type Detail = { ahead?: number | null; handler?: { fullName: string } | null; canManage?: boolean; ticket: Ticket; messages: Message[]; nextBefore: number | null; evidence?: { messages: { id: number; content: string; sender: { fullName: string } }[]; deals: { id: number; agreedPrice: string; agreedQuantityKg?: string; agreedPricePerKg?: string; note?: string; cutDate?: string }[] } };
const labels: Record<string, string> = { OPEN: "รอตรวจสอบ", IN_PROGRESS: "กำลังดำเนินการ", RESOLVED: "แก้ไขแล้ว", DELIVERY: "การส่งมอบ", PAYMENT: "การชำระเงิน", QUALITY: "คุณภาพสินค้า", SCAM: "สงสัยถูกหลอกลวง", OTHER: "อื่น ๆ" };

export function SupportCenter({ roomId, admin = false }: { roomId?: number; admin?: boolean }) {
  const base = admin ? "/api/admin/support" : "/api/support";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [cursor, setCursor] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);
  const read = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, { cache: "no-store", ...init });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "โหลดข้อมูลไม่สำเร็จ");
    return data;
  }, []);
  const loadList = useCallback(async (next?: number) => {
    const query = new URLSearchParams();
    if (admin) query.set("status", statusFilter);
    if (roomId) query.set("roomId", String(roomId));
    if (next) query.set("cursor", String(next));
    const data = await read(`${base}?${query}`);
    if (!alive.current) return;
    setTickets(previous => next ? [...previous, ...data.tickets] : data.tickets);
    if (roomId && !next && data.tickets.length) setSelected(previous => previous ?? data.tickets[0].id);
    setCursor(data.nextCursor);
    return data;
  }, [base, roomId, read, admin, statusFilter]);
  useEffect(() => {
    alive.current = true;
    loadList().catch(e => setError(e.message)).finally(() => setLoading(false));
    const timer = setInterval(() => loadList().catch(e => setError(e.message)), 10000);
    return () => { alive.current = false; clearInterval(timer); };
  }, [loadList]);
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setDetail(null);
    const refresh = () => read(`${base}/${selected}`).then(data => { if (!cancelled) setDetail(previous => {
      if (!previous || previous.ticket.id !== data.ticket.id) return data;
      const older = previous.messages.filter(message => !data.messages.some((latest: Message) => latest.id === message.id));
      return { ...data, messages: [...older, ...data.messages], nextBefore: older.length ? previous.nextBefore : data.nextBefore };
    }); }).catch(e => { if (!cancelled) setError(e.message); });
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [selected, base, read]);
  async function act(payload: object, create = false) {
    setBusy(true); setError("");
    try {
      const data = await read(create ? base : `${base}/${selected}`, { method: create ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!alive.current) return;
      setText(""); setResolution("");
      await loadList();
      if (create) setSelected(data.ticket.id);
      else setDetail(await read(`${base}/${selected}`));
    } catch (e) { if (alive.current) setError((e as Error).message); }
    finally { if (alive.current) setBusy(false); }
  }
  return <section className="space-y-3 p-3 text-foreground">
    <h2 className="font-semibold flex items-center gap-2"><Headphones className="w-5 h-5 text-brand-ink" />{admin ? "ศูนย์ช่วยเหลือ" : "สนทนากับทีมดูแล Durian Hub"}</h2>
    {admin && <div className="flex flex-wrap gap-2">
      {["OPEN", "IN_PROGRESS", "RESOLVED"].map(status => <button key={status} className={`border rounded p-2 ${statusFilter === status ? "bg-brand-soft" : ""}`} onClick={() => { setStatusFilter(status); setSelected(null); setDetail(null); }}>{labels[status]}</button>)}
      <button disabled={busy} className="bg-emerald-700 text-white rounded p-2" onClick={async () => {
        setBusy(true); setError("");
        try { const data = await read(`${base}/claim`, { method: "POST" }); setStatusFilter("IN_PROGRESS"); setSelected(data.ticket.id); setDetail(await read(`${base}/${data.ticket.id}`)); }
        catch (e) { setError((e as Error).message); } finally { setBusy(false); }
      }}>รับคิวถัดไป</button>
    </div>}
    <button className="text-sm underline" onClick={() => loadList().catch(e => setError(e.message))}>รีเฟรชคำร้อง</button>
    <p className="text-sm text-muted-foreground">สนทนาส่วนตัวระหว่างผู้แจ้งกับผู้ดูแลระบบ ใช้งานได้แม้แชตคู่ค้าครบ 7 วันแล้ว</p>
    {error && <p role="alert" className="text-danger-ink">{error} <button onClick={() => { setError(""); loadList().catch(e => setError(e.message)); }}>ลองใหม่</button></p>}
    {loading && <p>กำลังโหลด...</p>}
    {!loading && tickets.length === 0 && admin && <p>ยังไม่มีคำร้อง</p>}
    <div className="flex flex-wrap gap-2">{tickets.map(ticket => <button key={ticket.id} className={`border rounded-lg p-2 text-left ${selected === ticket.id ? "bg-brand-soft" : "bg-surface"}`} onClick={() => setSelected(ticket.id)}>
      #{ticket.id} · {labels[ticket.status]} · {ticket.room.post.title}{admin && ` · ${ticket.requester.fullName}`}
    </button>)}{cursor && <button onClick={() => loadList(cursor).catch(e => setError(e.message))}>โหลดคำร้องเพิ่มเติม</button>}</div>
    {selected && !detail && !error && <p role="status">กำลังโหลดบทสนทนากับผู้ดูแลระบบ...</p>}
    {detail && <div className="border border-line rounded-xl p-3 space-y-3">
      <h3 className="font-semibold">คำร้อง #{detail.ticket.id} · {labels[detail.ticket.category]} · {labels[detail.ticket.status]}</h3>
      {detail.ahead !== null && detail.ahead !== undefined && <p role="status" className="bg-info-soft p-3 rounded">รอรับเรื่อง · มีอีก {detail.ahead} เรื่องก่อนคุณ สามารถส่งรายละเอียดเพิ่มได้โดยไม่เสียลำดับ</p>}
      {detail.handler && <p>ผู้ดูแลเรื่อง: {detail.handler.fullName}</p>}
      {detail.ticket.resolution && <p className="bg-brand-soft p-2 rounded">ผลการแก้ไข: {detail.ticket.resolution}</p>}
      {admin && detail.evidence && <details><summary className="cursor-pointer">ดูข้อตกลงและบทสนทนาต้นเรื่อง</summary>
        {detail.evidence.deals.map(deal => <p key={deal.id} className="p-2 border-b">ดีล #{deal.id} · ราคาตกลง {deal.agreedPrice} บาท · {deal.agreedQuantityKg || "—"} กก. · ราคา/กก. {deal.agreedPricePerKg || "—"} · วันตัด {deal.cutDate || "—"} · {deal.note}</p>)}
        <div className="max-h-64 overflow-y-auto">{detail.evidence.messages.map(message => <p key={message.id} className="whitespace-pre-wrap p-2 border-b">{message.sender.fullName}: {message.content}</p>)}</div>
      </details>}
      {detail.nextBefore && <button onClick={async () => { try { const data = await read(`${base}/${selected}?before=${detail.nextBefore}`); setDetail(previous => previous ? { ...previous, messages: [...data.messages, ...previous.messages], nextBefore: data.nextBefore } : previous); } catch (e) { setError((e as Error).message); } }}>อ่านข้อความก่อนหน้า</button>}
      <div className="max-h-[45dvh] overflow-y-auto space-y-3 py-3" aria-live="polite">{detail.messages.map(message => <article key={message.id} className={`p-3 sm:p-4 rounded-2xl w-fit max-w-[92%] sm:max-w-[85%] ${message.isAdmin === admin ? "ml-auto bg-brand-soft text-brand-ink rounded-br-sm" : "mr-auto bg-muted border border-line rounded-bl-sm"}`}>
        <p className="text-xs font-semibold">{message.isAdmin ? "ผู้ดูแลระบบ" : message.sender.fullName} · {new Date(message.createdAt).toLocaleString("th-TH")}</p>
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </article>)}</div>
      {detail.ticket.status === "RESOLVED" ? (!admin && <button disabled={busy} className="border rounded p-2" onClick={() => act({ status: "OPEN" })}>ปัญหายังไม่จบ · เปิดเรื่องอีกครั้ง</button>) : (!admin || detail.canManage) ? <>
        <form className="sticky bottom-0 z-10 flex items-end gap-2 bg-surface border-t border-line py-3" onSubmit={e => { e.preventDefault(); act({ content: text }); }}>
          <textarea aria-label="ข้อความถึงศูนย์ช่วยเหลือ" rows={2} maxLength={5000} required value={text} onChange={e => setText(e.target.value)} className="flex-1 min-w-0 border border-line bg-subtle rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="พิมพ์ข้อความถึงผู้ดูแลระบบ" />
          <button aria-label="ส่งข้อความ" disabled={busy || !text.trim()} className="bg-emerald-700 text-white rounded-full p-3 disabled:opacity-50"><Send className="w-5 h-5" /></button>
        </form>
        {admin && <div className="space-y-2">
          <textarea aria-label="ผลการแก้ปัญหา" maxLength={5000} value={resolution} onChange={e => setResolution(e.target.value)} className="w-full border border-line bg-surface rounded p-2" placeholder="บันทึกผลการแก้ปัญหา" />
          <button disabled={busy || !resolution.trim()} className="border rounded p-2" onClick={() => act({ status: "RESOLVED", resolution })}>แก้ไขแล้ว · ปิดเรื่อง</button>
        </div>}
      </> : <p className="text-sm text-muted-foreground">เรื่องที่รอรับจะถูกจัดตามลำดับ ใช้ปุ่ม “รับคิวถัดไป” ส่วนเรื่องที่รับแล้วให้แอดมินผู้ดูแลดำเนินการ</p>}
    </div>}
    {!admin && roomId && tickets.length === 0 && !loading && <form className="space-y-2" onSubmit={e => { e.preventDefault(); act({ roomId, category, content: text }, true); }}>
      <div className="bg-muted border border-line rounded-2xl rounded-bl-sm p-4 max-w-[92%] space-y-2"><p className="font-semibold">สวัสดีครับ ทีม Durian Hub ยินดีช่วยเหลือ</p><p className="text-sm">โปรดเลือกหัวข้อและอธิบายปัญหาของรายการนี้ เมื่อส่งแล้วเราจะจัดคิวให้ผู้ดูแลรับเรื่องครับ</p></div>
      <div className="flex flex-col items-end gap-2 py-3" role="group" aria-label="เลือกหัวข้อปัญหา">{["DELIVERY", "PAYMENT", "QUALITY", "SCAM", "OTHER"].map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)} className={`rounded-2xl border px-4 py-3 text-sm font-semibold text-left max-w-[95%] transition ${category === value ? "bg-brand-soft border-brand-line text-brand-ink" : "bg-surface border-line text-secondary hover:bg-hover"}`}>{value === "DELIVERY" ? "มีปัญหาเรื่องการส่งมอบ / นัดตัด" : value === "PAYMENT" ? "มีปัญหาเรื่องราคา / การชำระเงิน" : value === "QUALITY" ? "สินค้า / คุณภาพไม่ตรงข้อตกลง" : value === "SCAM" ? "แจ้งปัญหาคู่ค้า / สงสัยถูกหลอกลวง" : "ต้องการความช่วยเหลือเรื่องอื่น"}</button>)}</div>
      <label className="text-sm font-semibold block" htmlFor="support-initial-detail">รายละเอียด · {labels[category]}</label>
      <div className="sticky bottom-0 bg-surface border-t border-line py-3 flex items-end gap-2">
        <textarea id="support-initial-detail" aria-label="รายละเอียดปัญหา" rows={3} required maxLength={5000} value={text} onChange={e => setText(e.target.value)} className="flex-1 min-w-0 border border-line rounded-2xl p-3 bg-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="อธิบายสิ่งที่เกิดขึ้น เพื่อให้ทีมงานช่วยได้ตรงจุด" />
        <button aria-label="ส่งคำร้อง" disabled={busy || !text.trim()} className="bg-emerald-700 text-white rounded-full p-3 disabled:opacity-50"><Send className="w-5 h-5" /></button>
      </div>
    </form>}
  </section>;
}
