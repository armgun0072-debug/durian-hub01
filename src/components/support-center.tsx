"use client";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Headphones, Inbox, MessageSquare, Package, RefreshCw, Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type Ticket = { id: number; status: string; category: string; resolution?: string; requester: { fullName: string }; room: { postId: number; post: { title: string; price?: string; priceUnit?: string; status?: string; isPriceOutlier?: boolean } } };
type Message = { id: number; content: string; isAdmin: boolean; createdAt: string; sender: { fullName: string } };
type Detail = { ahead?: number | null; handler?: { fullName: string } | null; canManage?: boolean; ticket: Ticket; messages: Message[]; nextBefore: number | null; evidence?: { messages: { id: number; content: string; sender: { fullName: string } }[]; deals: { id: number; agreedPrice: string; agreedQuantityKg?: string; agreedPricePerKg?: string; note?: string; cutDate?: string }[] } };
const labels: Record<string, string> = { OPEN: "รอตรวจสอบ", IN_PROGRESS: "กำลังดำเนินการ", RESOLVED: "แก้ไขแล้ว", DELIVERY: "การส่งมอบ", PAYMENT: "การชำระเงิน", QUALITY: "คุณภาพสินค้า", SCAM: "สงสัยถูกหลอกลวง", OTHER: "อื่น ๆ" };
const statusColors: Record<string, string> = {
  OPEN: "bg-warning-soft text-warning-ink",
  IN_PROGRESS: "bg-info-soft text-info-ink",
  RESOLVED: "bg-brand-soft text-brand-ink",
};
const secondaryButton = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-foreground hover:bg-hover disabled:opacity-50";

function TicketStatus({ status }: { status: string }) {
  return <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[status] ?? "bg-muted text-secondary"}`}>
    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />{labels[status] ?? status}
  </span>;
}

export function SupportCenter({ roomId, admin = false }: { roomId?: number; admin?: boolean }) {
  const base = admin ? "/api/admin/support" : "/api/support";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [cursor, setCursor] = useState<number | null>(null);
  const [evidence, setEvidence] = useState<{ ticketId: number; value: NonNullable<Detail["evidence"]> } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [resolution, setResolution] = useState("");
  const [showResolution, setShowResolution] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);
  const caseHeading = useRef<HTMLHeadingElement>(null);
  const ticketButtons = useRef(new Map<number, HTMLButtonElement>());
  const focusCase = useRef(false);
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
  useEffect(() => {
    if (detail?.ticket.id === selected && focusCase.current) {
      caseHeading.current?.focus();
      focusCase.current = false;
    }
  }, [detail, selected]);

  function openTicket(id: number | null) {
    setSelected(id);
    setDetail(null);
    setEvidence(null);
    setText("");
    setResolution("");
    setShowResolution(false);
    setError("");
    focusCase.current = id !== null;
  }
  async function act(payload: object, create = false) {
    setBusy(true); setError("");
    try {
      const data = await read(create ? base : `${base}/${selected}`, { method: create ? "POST" : "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!alive.current) return;
      setText(""); setResolution("");
      setShowResolution(false);
      await loadList();
      if (create) setSelected(data.ticket.id);
      else setDetail(await read(`${base}/${selected}`));
    } catch (e) { if (alive.current) setError((e as Error).message); }
    finally { if (alive.current) setBusy(false); }
  }
  async function claimNext() {
    setBusy(true);
    setError("");
    try {
      const data = await read(`${base}/claim`, { method: "POST" });
      setStatusFilter("IN_PROGRESS");
      if (data.ticket.id !== selected) openTicket(data.ticket.id);
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <section aria-label={admin ? "ศูนย์ช่วยเหลือ" : "สนทนากับทีมดูแล Durian Hub"}
    className={admin ? "mt-6 overflow-hidden rounded-2xl border border-line bg-surface text-foreground" : "space-y-3 p-3 text-foreground"}>
    {admin ? <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink"><Headphones className="size-5" aria-hidden="true" /></div>
        <h2 className="text-xl font-semibold">ศูนย์ช่วยเหลือ</h2>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="รีเฟรชคำร้อง" title="รีเฟรชคำร้อง" className={`${secondaryButton} w-10 px-0`} onClick={() => loadList().catch(e => setError(e.message))}>
          <RefreshCw className="size-4" aria-hidden="true" />
        </button>
        <button type="button" disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50" onClick={claimNext}>
          รับคิวถัดไป <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header> : <h2 className="flex items-center gap-2 font-semibold"><Headphones className="size-5 text-brand-ink" aria-hidden="true" />สนทนากับทีมดูแล Durian Hub</h2>}
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-danger-soft px-4 py-3 text-sm text-danger-ink">
      <span>{error}</span><button type="button" className="font-semibold underline underline-offset-4" onClick={() => { setError(""); loadList().catch(e => setError(e.message)); }}>รีเฟรชคำร้อง</button>
    </div>}
    <div className={admin ? "grid min-h-[34rem] lg:grid-cols-[minmax(17rem,22rem)_minmax(0,1fr)]" : ""}>
      {admin && <aside aria-label="รายการคำร้อง" className={`${selected ? "hidden lg:block" : ""} min-w-0 bg-canvas/60 lg:border-r lg:border-line`}>
        <div role="group" aria-label="กรองสถานะคำร้อง" className="grid grid-cols-3 gap-0.5 border-b border-line px-2">
          {["OPEN", "IN_PROGRESS", "RESOLVED"].map(status => <button key={status} type="button" aria-pressed={statusFilter === status} disabled={busy}
            className={`min-h-12 border-b-2 px-1 text-xs font-semibold transition-colors sm:text-sm ${statusFilter === status ? "border-brand-ink text-brand-ink" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            onClick={() => { if (status === statusFilter) return; setLoading(true); setTickets([]); setCursor(null); setStatusFilter(status); openTicket(null); }}>{labels[status]}</button>)}
        </div>
        <div className="lg:max-h-[39rem] lg:overflow-y-auto">
          {loading && <p role="status" className="p-5 text-sm text-muted-foreground">กำลังโหลดคำร้อง…</p>}
          {!loading && !error && tickets.length === 0 && <div className="px-5 py-10 text-center text-muted-foreground">
            <Inbox className="mx-auto mb-3 size-6" aria-hidden="true" />
            <p className="text-sm">ไม่มีคำร้องในสถานะนี้</p>
          </div>}
          <ul className="divide-y divide-line">
            {tickets.map(ticket => <li key={ticket.id}>
              <button type="button" aria-current={selected === ticket.id ? "true" : undefined} disabled={busy}
                ref={element => { if (element) ticketButtons.current.set(ticket.id, element); else ticketButtons.current.delete(ticket.id); }}
                className={`group flex w-full min-w-0 items-center gap-2 px-4 py-4 text-left outline-offset-[-3px] sm:px-5 ${selected === ticket.id ? "bg-brand-soft" : "hover:bg-hover"}`}
                onClick={() => { if (selected !== ticket.id) openTicket(ticket.id); }}>
                <span className="min-w-0 flex-1">
                  <span className="mb-1 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                    <span>#{ticket.id} · {labels[ticket.category]}</span><TicketStatus status={ticket.status} />
                  </span>
                  <span className="block truncate font-semibold" title={ticket.room.post.title}>{ticket.room.post.title}</span>
                  <span className="mt-0.5 block truncate text-sm text-muted-foreground">{ticket.requester.fullName}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-brand-ink" />
              </button>
            </li>)}
          </ul>
          {cursor && <div className="p-3"><button type="button" className={`${secondaryButton} w-full`} onClick={() => loadList(cursor).catch(e => setError(e.message))}>โหลดคำร้องเพิ่มเติม</button></div>}
        </div>
      </aside>}
      <div className={admin ? `min-w-0 ${selected ? "" : "hidden lg:grid lg:place-items-center"}` : ""}>
      {admin && !selected && <div className="px-6 py-14 text-center">
        <MessageSquare aria-hidden="true" className="mx-auto mb-4 size-7 text-brand-ink" />
        <h3 className="font-semibold">เลือกคำร้องเพื่อเปิดบทสนทนา</h3>
      </div>}
      {admin && selected && <button type="button" disabled={busy} className="flex min-h-11 items-center gap-2 px-4 text-sm font-semibold text-brand-ink lg:hidden" onClick={() => {
        const previous = selected;
        openTicket(null);
        requestAnimationFrame(() => ticketButtons.current.get(previous)?.focus());
      }}><ArrowLeft aria-hidden="true" className="size-4" />กลับไปรายการ</button>}
      {selected && !detail && !error && <p role="status" className="p-5 text-sm text-muted-foreground">กำลังโหลดบทสนทนา…</p>}
      {detail && <div className={admin ? "min-w-0" : "space-y-3 rounded-xl border border-line p-3"}>
        <header className={admin ? "border-b border-line px-4 pb-4 pt-2 sm:px-6 lg:pt-5" : ""}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 tabIndex={-1} ref={caseHeading} className={admin ? "min-w-0 break-words text-lg font-semibold outline-none" : "font-semibold outline-none"}>
              {admin ? detail.ticket.room.post.title : `คำร้อง #${detail.ticket.id} · ${labels[detail.ticket.category]}`}
            </h3>
            <TicketStatus status={detail.ticket.status} />
          </div>
          {admin && <p className="mt-1 text-sm text-muted-foreground">#{detail.ticket.id} · {labels[detail.ticket.category]} · {detail.ticket.requester.fullName}</p>}
          {detail.handler && <p className="mt-1 text-xs text-muted-foreground">ผู้ดูแลเรื่อง {detail.handler.fullName}</p>}
        </header>
        <div className={admin ? "space-y-4 px-4 py-4 sm:px-6" : "space-y-3"}>
      {detail.ahead !== null && detail.ahead !== undefined && <p role="status" className="bg-info-soft p-3 rounded">รอรับเรื่อง · มีอีก {detail.ahead} เรื่องก่อนคุณ สามารถส่งรายละเอียดเพิ่มได้โดยไม่เสียลำดับ</p>}

      {detail.ticket.resolution && <p className="flex items-start gap-2 rounded-lg bg-brand-soft px-3 py-2.5 text-sm text-brand-ink"><CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 break-words"><strong>ผลการแก้ไข</strong> · {detail.ticket.resolution}</span></p>}
      {detail.canManage && <section className="rounded-lg border border-line p-3 space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><Package className="size-4 shrink-0 text-brand-ink" aria-hidden="true" />ประกาศ #{detail.ticket.room.postId} · {detail.ticket.room.post.title}</h4>
        <p>฿{Number(detail.ticket.room.post.price).toLocaleString("th-TH")} {{
          PER_KG: "ต่อกิโลกรัม", PER_TON: "ต่อตัน", LUMP_SUM: "ราคาเหมา",
        }[detail.ticket.room.post.priceUnit ?? ""] ?? ""}</p>
        {detail.ticket.room.post.status === "REMOVED_BY_ADMIN" ? <p>นำออกจากตลาดแล้ว</p> : <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy || detail.ticket.room.post.status === "HIDDEN_BY_ADMIN"} className={secondaryButton} onClick={() => act({ postAction: "HIDE" })}>ซ่อนประกาศ</button>
          <button type="button" disabled={busy || detail.ticket.room.post.isPriceOutlier} className={secondaryButton} onClick={() => act({ postAction: "FLAG_PRICE" })}>พักราคาเพื่อตรวจสอบ</button>
          <button type="button" disabled={busy} className={secondaryButton} onClick={() => { if (window.confirm("นำประกาศออกจากตลาดและเก็บประวัติคำร้องไว้?")) void act({ postAction: "REMOVE" }); }}>นำออกจากตลาด</button>
        </div>}
        <button type="button" className="underline text-sm" onClick={async () => {
          if (evidence?.ticketId === detail.ticket.id) { setEvidence(null); return; }
          try {
            const data = await read(`${base}/${detail.ticket.id}?evidence=1`);
            if (data.evidence) setEvidence({ ticketId: detail.ticket.id, value: data.evidence });
          } catch (e) { setError((e as Error).message); }
        }}>{evidence?.ticketId === detail.ticket.id ? "ปิดหลักฐาน" : "เปิดหลักฐานการสนทนา"}</button>
      </section>}
      {detail.canManage && evidence && evidence.ticketId === detail.ticket.id && <details open><summary className="cursor-pointer">หลักฐานในห้องที่แจ้ง · 50 ข้อความล่าสุด</summary>
        {evidence.value.deals.map(deal => <p key={deal.id} className="p-2 border-b">ดีล #{deal.id} · ราคาตกลง {deal.agreedPrice} บาท · {deal.agreedQuantityKg || "—"} กก. · ราคา/กก. {deal.agreedPricePerKg || "—"} · วันตัด {deal.cutDate || "—"} · {deal.note}</p>)}
        <div className="max-h-64 overflow-y-auto">{evidence.value.messages.map(message => <p key={message.id} className="whitespace-pre-wrap p-2 border-b">{message.sender.fullName}: {message.content}</p>)}</div>
      </details>}
      {detail.nextBefore && <button onClick={async () => { try { const data = await read(`${base}/${selected}?before=${detail.nextBefore}`); setDetail(previous => previous ? { ...previous, messages: [...data.messages, ...previous.messages], nextBefore: data.nextBefore } : previous); } catch (e) { setError((e as Error).message); } }}>อ่านข้อความก่อนหน้า</button>}
      <div className="max-h-[45dvh] space-y-3 overflow-y-auto rounded-lg bg-canvas/60 p-3 sm:p-4" aria-live="polite">{detail.messages.map(message => <article key={message.id} className={`p-3 sm:p-4 rounded-2xl w-fit max-w-[92%] sm:max-w-[85%] ${message.isAdmin === admin ? "ml-auto bg-brand-soft text-brand-ink rounded-br-sm" : "mr-auto bg-muted border border-line rounded-bl-sm"}`}>
        <p className="text-xs font-semibold">{message.isAdmin ? "ผู้ดูแลระบบ" : message.sender.fullName} · {new Date(message.createdAt).toLocaleString("th-TH")}</p>
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.content}</p>
      </article>)}</div>
      {detail.ticket.status === "RESOLVED" ? (!admin && <button disabled={busy} className={secondaryButton} onClick={() => act({ status: "OPEN" })}>ปัญหายังไม่จบ · เปิดเรื่องอีกครั้ง</button>) : (!admin || detail.canManage) ? <>
        <form className="sticky bottom-0 z-10 flex items-end gap-2 bg-surface border-t border-line py-3" onSubmit={e => { e.preventDefault(); act({ content: text }); }}>
          <textarea aria-label="ข้อความถึงศูนย์ช่วยเหลือ" rows={2} maxLength={5000} required value={text} onChange={e => setText(e.target.value)} className="flex-1 min-w-0 border border-line bg-subtle rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder={admin ? "พิมพ์ข้อความถึงผู้แจ้ง" : "พิมพ์ข้อความถึงผู้ดูแลระบบ"} />
          <button aria-label="ส่งข้อความ" disabled={busy || !text.trim()} className="bg-emerald-700 text-white rounded-full p-3 disabled:opacity-50"><Send className="w-5 h-5" /></button>
        </form>
        {admin && <div className="space-y-2 border-t border-line pt-3">
          <button type="button" aria-expanded={showResolution} className={secondaryButton} onClick={() => setShowResolution(open => !open)}>
            <CheckCircle2 className="size-4" aria-hidden="true" />{showResolution ? "ยกเลิกการปิดเรื่อง" : "บันทึกผลและปิดเรื่อง"}
          </button>
          {showResolution && <div className="space-y-2">
          <textarea aria-label="ผลการแก้ปัญหา" maxLength={5000} value={resolution} onChange={e => setResolution(e.target.value)} className="w-full border border-line bg-surface rounded p-2" placeholder="บันทึกผลการแก้ปัญหา" />
          <button disabled={busy || !resolution.trim()} className={secondaryButton} onClick={() => act({ status: "RESOLVED", resolution })}>แก้ไขแล้ว · ปิดเรื่อง</button>
          </div>}
        </div>}
      </> : <p className="text-sm text-muted-foreground">เรื่องที่รอรับจะถูกจัดตามลำดับ ใช้ปุ่ม “รับคิวถัดไป” ส่วนเรื่องที่รับแล้วให้แอดมินผู้ดูแลดำเนินการ</p>}
        </div>
      </div>}
      </div>
    </div>
    {!admin && roomId && tickets.length === 0 && !loading && <form className="space-y-2" onSubmit={e => { e.preventDefault(); act({ roomId, category, content: text }, true); }}>
      <div className="bg-muted border border-line rounded-2xl rounded-bl-sm p-4 max-w-[92%] space-y-2"><p className="font-semibold">สวัสดีครับ ทีม Durian Hub ยินดีช่วยเหลือ</p><p className="text-sm">โปรดเลือกหัวข้อและอธิบายปัญหาของรายการนี้ เมื่อส่งแล้ว ผู้ดูแลที่รับเรื่องจะเปิดดูข้อตกลงและข้อความล่าสุดในห้องนี้เพื่อแก้ปัญหาได้ ระบบบันทึกการเปิดดูไว้</p></div>
      <div className="flex flex-col items-end gap-2 py-3" role="group" aria-label="เลือกหัวข้อปัญหา">{["DELIVERY", "PAYMENT", "QUALITY", "SCAM", "OTHER"].map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)} className={`rounded-2xl border px-4 py-3 text-sm font-semibold text-left max-w-[95%] transition ${category === value ? "bg-brand-soft border-brand-line text-brand-ink" : "bg-surface border-line text-secondary hover:bg-hover"}`}>{value === "DELIVERY" ? "มีปัญหาเรื่องการส่งมอบ / นัดตัด" : value === "PAYMENT" ? "มีปัญหาเรื่องราคา / การชำระเงิน" : value === "QUALITY" ? "สินค้า / คุณภาพไม่ตรงข้อตกลง" : value === "SCAM" ? "แจ้งปัญหาคู่ค้า / สงสัยถูกหลอกลวง" : "ต้องการความช่วยเหลือเรื่องอื่น"}</button>)}</div>
      <label className="text-sm font-semibold block" htmlFor="support-initial-detail">รายละเอียด · {labels[category]}</label>
      <div className="sticky bottom-0 bg-surface border-t border-line py-3 flex items-end gap-2">
        <textarea id="support-initial-detail" aria-label="รายละเอียดปัญหา" rows={3} required maxLength={5000} value={text} onChange={e => setText(e.target.value)} className="flex-1 min-w-0 border border-line rounded-2xl p-3 bg-subtle focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="อธิบายสิ่งที่เกิดขึ้น เพื่อให้ทีมงานช่วยได้ตรงจุด" />
        <button aria-label="ส่งคำร้อง" disabled={busy || !text.trim()} className="bg-emerald-700 text-white rounded-full p-3 disabled:opacity-50"><Send className="w-5 h-5" /></button>
      </div>
    </form>}
  </section>;
}
