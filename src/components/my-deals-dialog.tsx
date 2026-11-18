"use client";

import { useEffect, useState } from "react";
import { Calendar, CheckCircle2, FileText, Handshake, Printer, RefreshCw, Star, X } from "lucide-react";
import { DialogFrame } from "@/components/dialog-frame";

interface DealRecord {
  id: number;
  postId: number;
  postTitle: string;
  postType: string;
  variety: string;
  grade: string;
  province: string;
  partnerName: string;
  agreedPrice: number;
  agreedPricePerKg: number | null;
  agreedQuantityKg: number | null;
  cutDate: string | null;
  note: string | null;
  status: string;
  roleInDeal: "INITIATOR" | "RECEIVER";
  myConfirmed: boolean;
  partnerConfirmed: boolean;
  hasMyReview: boolean;
  myRating: number | null;
  createdAt: string;
}

export function MyDealsDialog({
  lang,
  onClose,
}: {
  lang: string;
  onClose: () => void;
}) {
  const th = lang === "TH";
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [summary, setSummary] = useState({
    totalDeals: 0,
    totalVolumeKg: 0,
    totalValueThb: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<DealRecord | null>(null);

  const loadDeals = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/deals", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setDeals(data.deals || []);
      setSummary(data.summary || { totalDeals: 0, totalVolumeKg: 0, totalValueThb: 0 });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDeals();
  }, []);

  const updateDeal = async (dealId: number, status: string) => {
    setBusyId(dealId);
    setActionError("");
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await loadDeals();
    } catch (error) {
      setActionError(error instanceof Error && error.message ? error.message : "อัปเดตดีลไม่สำเร็จ");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DialogFrame
      label={th ? "ประวัติสัญญาดีลและยอดซื้อขาย" : "My Deals & Contract Summary"}
      onClose={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-surface text-foreground rounded-2xl max-w-2xl w-full p-5 sm:p-8 shadow-panel border border-line max-h-[90vh] flex flex-col">
        <div className="flex items-start gap-3 pb-4 border-b border-line">
          <Handshake className="w-8 h-8 text-brand-ink shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {selectedSlip
                ? th ? `ใบสรุปสัญญาซื้อขายดิจิทัล #${selectedSlip.id}` : `Digital Deal Contract #${selectedSlip.id}`
                : th ? "ประวัติสัญญาดีล & สรุปยอดซื้อขาย" : "My Deals & Summary"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {selectedSlip
                ? th ? "ใช้เป็นหลักฐานอ้างอิงข้อตกลงราคา ปริมาณ และวันนัดตัดทุเรียน" : "Official summary of agreed price, quantity, and harvest date"
                : th ? "รวบรวมดีลที่ตกลงราคาแล้ว ปริมาณรวม และวันนัดตัดทุเรียน" : "All agreed deals, volume totals, and scheduled harvest dates"}
            </p>
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

        {selectedSlip ? (
          <div className="py-5 space-y-4 overflow-y-auto">
            <div className="rounded-2xl border-2 border-brand-line bg-canvas p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line">
                <div>
                  <div className="text-xs font-semibold text-brand-ink">
                    DURIAN HUB • DIGITAL CONTRACT SLIP
                  </div>
                  <div className="text-base font-bold text-foreground mt-0.5">
                    {selectedSlip.postTitle}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-soft text-brand-ink border border-brand-line">
                  #{selectedSlip.id} •{" "}
                  {selectedSlip.status === "COMPLETED"
                    ? th ? "ส่งมอบเสร็จสมบูรณ์" : "COMPLETED"
                    : th ? "ยืนยันสัญญาแล้ว" : "ACCEPTED"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-surface p-3 border border-line">
                  <span className="text-muted-foreground block">{th ? "คู่สัญญา" : "Trading Partner"}</span>
                  <strong className="text-sm text-foreground mt-0.5 block">{selectedSlip.partnerName}</strong>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-line">
                  <span className="text-muted-foreground block">{th ? "สายพันธุ์ / เกรด / พื้นที่" : "Variety / Grade / Area"}</span>
                  <strong className="text-sm text-foreground mt-0.5 block">
                    {selectedSlip.variety} • {selectedSlip.grade} • {selectedSlip.province}
                  </strong>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-line">
                  <span className="text-muted-foreground block">{th ? "ราคาที่ตกลง" : "Agreed Price"}</span>
                  <strong className="text-base text-brand-ink mt-0.5 block num">
                    ฿{selectedSlip.agreedPrice.toLocaleString()}
                    {selectedSlip.agreedPricePerKg
                      ? ` (฿${selectedSlip.agreedPricePerKg.toLocaleString()}/${th ? "กก." : "kg"})`
                      : ""}
                  </strong>
                </div>
                <div className="rounded-xl bg-surface p-3 border border-line">
                  <span className="text-muted-foreground block">{th ? "ปริมาณ & วันนัดตัด" : "Volume & Cut Date"}</span>
                  <strong className="text-sm text-foreground mt-0.5 block num">
                    {selectedSlip.agreedQuantityKg
                      ? `${selectedSlip.agreedQuantityKg.toLocaleString()} ${th ? "กก." : "kg"}`
                      : th ? "ตามตกลง" : "As agreed"}
                    {selectedSlip.cutDate ? ` • ${selectedSlip.cutDate}` : ""}
                  </strong>
                </div>
              </div>

              {selectedSlip.note && (
                <div className="rounded-xl bg-surface p-3 border border-line text-xs">
                  <span className="text-muted-foreground block mb-1">{th ? "เงื่อนไขและหมายเหตุเพิ่มเติม:" : "Contract Notes:"}</span>
                  <p className="text-foreground">{selectedSlip.note}</p>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2">
                <span>
                  {th ? "วันที่บันทึกสัญญา:" : "Recorded on:"}{" "}
                  {new Date(selectedSlip.createdAt).toLocaleString(th ? "th-TH" : "en-GB")}
                </span>
                <span>Durian Hub Verified Transaction</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedSlip(null)}
                className="rounded-lg bg-muted hover:bg-hover px-4 py-2 text-xs font-semibold text-foreground cursor-pointer"
              >
                {th ? "← กลับหน้ารายการดีล" : "← Back to deals"}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{th ? "พิมพ์ / บันทึก PDF" : "Print / Save PDF"}</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary KPI Strip */}
            <div className="grid grid-cols-3 gap-2.5 py-4">
              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="text-[11px] text-muted-foreground">
                  {th ? "จำนวนดีลทั้งหมด" : "Total Deals"}
                </div>
                <div className="mt-1 text-lg sm:text-xl font-bold text-foreground num">
                  {summary.totalDeals}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="text-[11px] text-muted-foreground">
                  {th ? "ปริมาณรวม (กก.)" : "Total Volume (kg)"}
                </div>
                <div className="mt-1 text-lg sm:text-xl font-bold text-brand-ink num">
                  {summary.totalVolumeKg.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-line bg-canvas p-3">
                <div className="text-[11px] text-muted-foreground">
                  {th ? "มูลค่าสัญญาประมาณ" : "Est. Contract Value"}
                </div>
                <div className="mt-1 text-lg sm:text-xl font-bold text-warning-ink num">
                  ฿{Math.round(summary.totalValueThb).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-28" aria-busy={loading}>
              {loading && (
                <p role="status" className="text-sm text-muted-foreground py-6 text-center">
                  {th ? "กำลังโหลดประวัติสัญญาดีล…" : "Loading deal history…"}
                </p>
              )}
              {error && (
                <div role="alert" className="py-6 text-center space-y-3">
                  <p className="text-sm text-danger-ink">
                    {th ? "ไม่สามารถโหลดประวัติสัญญาดีลได้" : "Could not load deal history"}
                  </p>
                  <button
                    type="button"
                    onClick={loadDeals}
                    className="rounded-lg bg-muted hover:bg-hover px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{th ? "ลองใหม่" : "Retry"}</span>
                  </button>
                </div>
              )}
              {!loading && !error && deals.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {th
                    ? "ยังไม่มีประวัติการปิดดีล — เริ่มเจรจาในแชตแล้วกด 'ตกลงราคา (ปิดดีล)' เพื่อบันทึกสัญญา"
                    : "No closed deals yet. Negotiate in chat and click 'Close Deal' to record a contract."}
                </div>
              )}
              {!loading &&
                !error &&
                deals.map((d) => (
                  <article key={d.id} className="rounded-xl border border-line p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded-full border ${
                          d.status === "COMPLETED"
                            ? "bg-brand-soft text-brand-ink border-brand-line"
                            : "bg-info-soft text-info-ink border-info-line"
                        }`}
                      >
                        #{d.id} •{" "}
                        {d.status === "COMPLETED" ? (th ? "ส่งมอบเสร็จสมบูรณ์" : "Completed")
                          : d.status === "PENDING" ? (th ? "รอคู่ค้าตอบรับ" : "Awaiting response")
                          : d.status === "ACCEPTED" ? (th ? "ยอมรับแล้ว" : "Accepted")
                          : d.status === "CANCELLED" ? (th ? "ยกเลิกแล้ว" : "Cancelled") : d.status}
                      </span>
                      <time dateTime={d.createdAt} className="text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString(th ? "th-TH" : "en-GB")}
                      </time>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground">{d.postTitle}</h4>
                    <div className="text-xs text-muted-foreground">
                      {th ? "คู่สัญญา:" : "Partner:"} <strong className="text-foreground">{d.partnerName}</strong> •{" "}
                      {d.variety} ({d.grade}) • {d.province}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-semibold text-foreground num">
                          {th ? "ราคาตกลง:" : "Agreed:"} ฿{d.agreedPrice.toLocaleString()}
                          {d.agreedPricePerKg ? ` (฿${d.agreedPricePerKg.toLocaleString()}/${th ? "กก." : "kg"})` : ""}
                        </span>
                        {d.agreedQuantityKg != null && (
                          <span className="text-secondary num">
                            {d.agreedQuantityKg.toLocaleString()} {th ? "กก." : "kg"}
                          </span>
                        )}
                        {d.cutDate && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{d.cutDate}</span>
                          </span>
                        )}
                      </div>
                      {d.hasMyReview && d.myRating && (
                        <span className="inline-flex items-center gap-1 text-warning-ink font-semibold num">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {d.myRating}/5
                        </span>
                      )}
                    </div>
                    {d.note && (
                      <p className="text-xs text-muted-foreground bg-canvas rounded-lg p-2.5 border border-line/60">
                        {d.note}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-line/60">
                      {["ACCEPTED", "COMPLETED"].includes(d.status) && <button
                        type="button"
                        onClick={() => setSelectedSlip(d)}
                        className="rounded-lg bg-muted hover:bg-hover px-3 py-1.5 text-xs font-semibold text-foreground inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-ink" />
                        <span>{th ? "ดูใบสัญญาซื้อขาย" : "Contract Slip"}</span>
                      </button>}
                      {d.status === "PENDING" && <>
                        {d.roleInDeal === "RECEIVER" && <button type="button" disabled={busyId !== null} className="px-3 py-2 rounded bg-brand-soft text-brand-ink" onClick={() => updateDeal(d.id, "ACCEPTED")}>{th ? "ยอมรับข้อเสนอ" : "Accept offer"}</button>}
                        <button type="button" disabled={busyId !== null} className="px-3 py-2 rounded border" onClick={() => updateDeal(d.id, "CANCELLED")}>{d.roleInDeal === "RECEIVER" ? (th ? "ปฏิเสธ" : "Decline") : (th ? "ถอนข้อเสนอ" : "Withdraw")}</button>
                      </>}
                      {d.status === "ACCEPTED" && d.myConfirmed && <span>{th ? "รอคู่ค้ายืนยันส่งมอบ" : "Waiting for partner to confirm delivery"}</span>}
                      {d.status === "ACCEPTED" && !d.myConfirmed && (
                        <button
                          type="button"
                          disabled={busyId === d.id}
                          onClick={() => updateDeal(d.id, "COMPLETED")}
                          className="rounded-lg bg-brand-soft hover:bg-brand-soft/80 text-brand-ink border border-brand-line px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {busyId === d.id
                              ? th ? "กำลังบันทึก…" : "Saving…"
                              : th ? "ยืนยันส่งมอบ/ตัดเสร็จแล้ว" : "Mark Completed"}
                          </span>
                        </button>
                      )}
                    </div>
                  </article>
                ))}
            </div>
          </>
        )}

        {actionError && <p role="alert" className="text-sm text-danger-ink">{actionError}</p>}
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
