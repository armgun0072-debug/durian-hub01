"use client";

import { useMemo, useState } from "react";
import { ArrowRight, BarChart3, Check, MessageSquare, Search, Sprout, Store, X } from "lucide-react";
import { INITIAL_POSTS, REGIONAL_SEASONS_DATA, type MarketplacePostItem } from "@/data/mockData";
import { ListingCard } from "@/components/listing-card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DialogFrame } from "@/components/dialog-frame";
import { Button } from "@/components/ui";

const categories = [{ id: "ALL", label: "ทั้งหมด" }, { id: "SELL", label: "ประกาศขาย" }, { id: "BUY", label: "ประกาศรับซื้อ" }, { id: "CUT_SERVICE", label: "บริการตัด" }];
const number = (value: number) => value.toLocaleString("th-TH");

export default function DemoPage() {
  const [tab, setTab] = useState("market");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [province, setProvince] = useState("ALL");
  const [selected, setSelected] = useState<MarketplacePostItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [chat, setChat] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const provinces = [...new Set(INITIAL_POSTS.map(post => post.province))];
  const filtered = useMemo(() => INITIAL_POSTS.filter(post =>
    (category === "ALL" || post.postType === category) &&
    (province === "ALL" || post.province === province) &&
    `${post.title} ${post.variety} ${post.province} ${post.authorName}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [query, category, province]);

  return <>
    <div className="border-b border-warning-line bg-warning-soft px-4 py-2 text-center text-xs text-warning-ink">เว็บเดโมเพื่อการศึกษา · ทุกประกาศ บุคคล ราคา และบทสนทนาเป็นข้อมูลตัวอย่าง · ไม่รับคำสั่งซื้อจริง</div>
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
        <a href="#" aria-label="Durian Hub หน้าหลัก" className="flex items-center gap-3" onClick={() => { setTab("market"); }}><span className="rounded-xl bg-brand-soft p-3 text-brand-ink"><Sprout aria-hidden="true" /></span><span><strong className="block text-xl tracking-tight">Durian Hub</strong><span className="text-xs text-muted-foreground">ตลาดกลางทุเรียนไทย · Demo</span></span></a>
        <div className="flex flex-wrap items-center gap-3"><ThemeSwitcher /><Button variant="secondary" onClick={() => setNotice("เดโมนี้ไม่มีระบบเข้าสู่ระบบ สมัครสมาชิก หรือส่ง OTP และไม่เก็บรหัสผ่านของคุณ")}>เข้าสู่ระบบ</Button><Button onClick={() => setNotice("การสร้างประกาศและอัปโหลดไฟล์เปิดให้ใช้เฉพาะระบบจริง เดโมนี้แสดงประกาศตัวอย่างเท่านั้น")}>ลงประกาศ</Button></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-5 py-8 sm:py-12">
      <section className="rounded-2xl border border-brand-line bg-brand-soft p-6 sm:p-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-ink">เชื่อมชาวสวน · ล้งรับซื้อ · ทีมรับตัด</p>
        <h1 className="max-w-3xl text-3xl font-semibold leading-snug tracking-tight sm:text-5xl">พบคู่ค้าทุเรียน<br /><span className="text-brand-ink">ในพื้นที่และฤดูกาลที่ใช่</span></h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-secondary">สำรวจตัวอย่างตลาดทุเรียนไทย เปรียบเทียบประกาศขาย รับซื้อ และบริการตัด พร้อมข้อมูลฤดูกาลจาก 6 ภูมิภาค</p>
        <div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => { setTab("market"); document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" }); }}>สำรวจตลาด <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button><Button variant="secondary" onClick={() => { setTab("stats"); document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" }); }}>ดูภาพรวมฤดูกาล</Button></div>
      </section>
      <div className="my-7 grid grid-cols-1 gap-3 sm:grid-cols-3">{[{ label: "ประกาศตัวอย่าง", value: `${INITIAL_POSTS.length} รายการ` }, { label: "ภูมิภาคในข้อมูลตัวอย่าง", value: `${REGIONAL_SEASONS_DATA.length} ภูมิภาค` }, { label: "ประเภทตลาด", value: "ขาย · รับซื้อ · รับตัด" }].map(item => <div key={item.label} className="rounded-xl border border-line bg-surface p-5"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 text-xl font-semibold">{item.value}</p></div>)}</div>
      <section id="explore" className="scroll-mt-6">
        <nav aria-label="ส่วนของเว็บเดโม" className="mb-6 flex gap-2 border-b border-line pb-4"><Button variant={tab === "market" ? "primary" : "ghost"} aria-pressed={tab === "market"} onClick={() => setTab("market")}><Store className="mr-2 h-4 w-4" aria-hidden="true" />ตลาดกลาง</Button><Button variant={tab === "stats" ? "primary" : "ghost"} aria-pressed={tab === "stats"} onClick={() => setTab("stats")}><BarChart3 className="mr-2 h-4 w-4" aria-hidden="true" />ภาพรวมฤดูกาล</Button></nav>
        {tab === "market" ? <>
          <h2 className="text-2xl font-semibold">ประกาศในตลาด</h2><p className="mt-2 text-sm text-muted-foreground">ค้นหาและทดลองกรองข้อมูลตัวอย่าง ราคานี้ไม่ใช่ราคาตลาดปัจจุบัน</p>
          <div className="my-6 flex flex-col gap-3 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-lg border border-line bg-surface px-4"><Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><input aria-label="ค้นหาประกาศ" className="w-full bg-transparent py-3 outline-none" placeholder="ค้นหาสายพันธุ์ จังหวัด หรือชื่อประกาศ" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="จังหวัด" className="rounded-lg border border-line bg-surface px-4 py-3" value={province} onChange={event => setProvince(event.target.value)}><option value="ALL">ทุกจังหวัด</option>{provinces.map(value => <option key={value}>{value}</option>)}</select></div>
          <div className="mb-5 flex flex-wrap gap-2">{categories.map(item => <Button key={item.id} variant={category === item.id ? "primary" : "secondary"} aria-pressed={category === item.id} onClick={() => setCategory(item.id)}>{item.label}</Button>)}</div>
          <p role="status" className="mb-4 text-xs text-muted-foreground">พบ {filtered.length} ประกาศตัวอย่าง</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(post => <ListingCard key={post.id} post={{ ...post, authorName: `ผู้ใช้ตัวอย่าง ${post.id}` }} own={false} language="TH" time={{ text: "ข้อมูลตัวอย่าง", full: "ข้อมูลสาธิต ไม่ใช่ประกาศปัจจุบัน" }} onOpen={() => { setSelected(post); setChat(false); setMessages([]); setDraft(""); }} />)}</div>
          {!filtered.length && <div className="rounded-xl border border-dashed border-line py-14 text-center"><p>ไม่พบประกาศที่ตรงกับตัวกรอง</p><Button variant="ghost" className="mt-3" onClick={() => { setQuery(""); setCategory("ALL"); setProvince("ALL"); }}>ล้างตัวกรอง</Button></div>}
        </> : <>
          <h2 className="text-2xl font-semibold">ฤดูกาลทุเรียนทั่วไทย</h2><p className="mb-6 mt-2 text-sm text-muted-foreground">ข้อมูลสาธิตสำหรับสำรวจหน้าจอ ไม่ใช่ข้อมูลราคาสดหรือคำแนะนำซื้อขาย</p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{REGIONAL_SEASONS_DATA.map(region => <article key={region.id} className="rounded-xl border border-line bg-surface p-6"><p className="text-xs font-medium text-brand-ink">{region.harvestPeriod}</p><h3 className="mt-2 text-xl font-semibold">{region.regionName}</h3><p className="mt-2 text-sm text-secondary">{region.provinces.join(" · ")}</p><p className="my-4 text-sm text-muted-foreground">{region.highlightNote}</p><div className="border-t border-line pt-4"><span className="text-xs text-muted-foreground">ราคาขายเฉลี่ยตัวอย่าง</span><p className="mt-1 text-2xl font-semibold text-brand-ink">฿{number(region.avgSellPrice)} <span className="text-xs font-normal">/ กก.</span></p></div></article>)}</div>
        </>}
      </section>
      <aside className="mt-10 rounded-xl border border-info-line bg-info-soft p-5 text-sm leading-relaxed text-info-ink"><strong>เกี่ยวกับเดโมนี้</strong><p className="mt-1">ทดลองดูประกาศ กรองข้อมูล เปลี่ยนธีม และพิมพ์ข้อความแชตจำลองได้ ข้อความอยู่ในหน้านี้ชั่วคราวและหายเมื่อปิดหน้าต่างสนทนา ไม่มีการส่งถึงบุคคลอื่น ไม่มีการซื้อขาย ยืนยันตัวตน หรือบันทึกข้อมูลลงเซิร์ฟเวอร์</p></aside>
    </main>
    <footer className="border-t border-line px-5 py-6 text-center text-xs text-muted-foreground">Durian Hub · ตัวอย่างโครงงานตลาดกลางทุเรียนไทย · <a className="underline" href="https://github.com/armgun0072-debug/durian-hub01">ดูโค้ดบน GitHub</a></footer>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}><DialogFrame label={chat ? "แชตจำลอง" : "รายละเอียดประกาศตัวอย่าง"} onClose={() => setSelected(null)} className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-line bg-surface p-6" ><div onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between gap-3"><span className="rounded-md bg-warning-soft px-3 py-1 text-xs text-warning-ink">{chat ? "แชตจำลอง · ไม่ส่งข้อความจริง" : "ประกาศตัวอย่าง"}</span><Button variant="ghost" aria-label="ปิดรายละเอียด" onClick={() => setSelected(null)}><X className="h-5 w-5" /></Button></div>
      <h2 className="mt-5 text-xl font-semibold">{selected.title}</h2><p className="mt-2 text-sm text-muted-foreground">ผู้ใช้ตัวอย่าง {selected.id} · {selected.province} · {selected.variety} · {selected.grade}</p>
      {chat ? <><div aria-live="polite" className="my-5 space-y-3 rounded-xl bg-muted p-4"><p className="rounded-lg border border-line bg-surface p-3 text-sm">สวัสดีครับ นี่คือบทสนทนาตัวอย่างเกี่ยวกับประกาศนี้ คุณสามารถทดลองพิมพ์ข้อความได้</p>{messages.map((message, index) => <p key={index} className="ml-8 break-words rounded-lg bg-brand-soft p-3 text-sm text-brand-ink">{message}<span className="mt-1 block text-xs"><Check className="inline h-3 w-3" /> ข้อความจำลองในหน้านี้</span></p>)}</div><form className="flex gap-2" onSubmit={event => { event.preventDefault(); if (draft.trim()) { setMessages(previous => [...previous, draft.trim()]); setDraft(""); } }}><input aria-label="ข้อความจำลอง" maxLength={500} placeholder="ทดลองพิมพ์ข้อความ…" value={draft} onChange={event => setDraft(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 py-2" /><Button type="submit" disabled={!draft.trim()}>ส่งจำลอง</Button></form></> : <><p className="my-5 whitespace-pre-line text-sm leading-relaxed text-secondary">{selected.content}</p><div className="rounded-xl bg-muted p-4"><p className="text-2xl font-semibold text-brand-ink">฿{number(selected.pricePerKg)} <span className="text-sm font-normal">/ กก.</span></p><p className="mt-2 text-sm">ปริมาณ {number(selected.quantityKg)} กก. · วันที่พร้อมส่ง: {selected.availableDate}</p></div><Button className="mt-5 w-full" onClick={() => setChat(true)}><MessageSquare className="mr-2 h-4 w-4" aria-hidden="true" />ทดลองแชตจำลอง</Button></>}
    </div></DialogFrame></div>}
    {notice && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><DialogFrame label="ข้อจำกัดเว็บเดโม" onClose={() => setNotice(null)} className="w-full max-w-md rounded-2xl border border-line bg-surface p-6"><h2 className="text-xl font-semibold">โหมดสาธิต</h2><p className="my-5 text-sm leading-relaxed text-secondary">{notice}</p><Button onClick={() => setNotice(null)}>เข้าใจแล้ว</Button></DialogFrame></div>}
  </>;
}
