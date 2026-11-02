import { ArrowUpRight, BarChart3, Handshake, Sprout } from "lucide-react";

export function AuthBrandPanel({ language }: { language: "TH" | "EN" }) {
  const th = language === "TH";
  return (
    <aside className="auth-brand-panel lg:col-span-5">
      <div className="flex items-center gap-2 text-sm font-medium"><Sprout className="h-5 w-5" aria-hidden="true" /> DURIAN HUB</div>
      <div className="mt-5 lg:my-16">
        <p className="mb-4 hidden text-xs uppercase tracking-[0.2em] opacity-70 lg:block">THAILAND DURIAN MARKETPLACE</p>
        <h1 className="text-xl font-semibold leading-snug tracking-tight sm:text-3xl lg:text-4xl">{th ? <>ตลาดทุเรียนที่ดี<br />เริ่มต้นด้วยความเชื่อใจ</> : <>Good trade starts<br />with trust.</>}</h1>
        <p className="mt-5 hidden max-w-sm text-sm leading-7 opacity-80 sm:block">{th ? "เชื่อมชาวสวน ล้งรับซื้อ และทีมตัดไว้ในที่เดียว ค้นหาราคา เจรจา และจัดการข้อตกลงได้ง่ายขึ้น" : "One place for growers, buyers and cutting teams. Explore prices, start a conversation and manage your agreements."}</p>
        <div className="mt-8 hidden space-y-4 text-sm lg:block">
          <div className="flex items-center gap-3"><BarChart3 className="h-4 w-4 opacity-70" aria-hidden="true" /><span>{th ? "เปรียบเทียบราคาแยกตามพื้นที่" : "Compare prices by region"}</span></div>
          <div className="flex items-center gap-3"><Handshake className="h-4 w-4 opacity-70" aria-hidden="true" /><span>{th ? "พูดคุยกับคู่ค้าและบันทึกข้อตกลง" : "Connect directly and record agreements"}</span></div>
        </div>
      </div>
      <div className="hidden items-center justify-between border-t border-white/15 pt-5 text-xs opacity-70 lg:flex"><span>{th ? "เติบโตไปด้วยกันอย่างมั่นใจ" : "Trade with confidence"}</span><ArrowUpRight className="h-4 w-4" aria-hidden="true" /></div>
    </aside>
  );
}
