"use client";

import { useEffect, useState } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";

interface TrendPoint {
  date: string;
  avgBuyPrice: number | null;
  avgSellPrice: number | null;
  avgCutWagePerKg: number | null;
  sampleCount: number;
}

export function MarketTrendPanel({
  region,
  variety,
  lang,
  onOpenMarketplace,
}: {
  region: string;
  variety: string;
  lang: "TH" | "EN";
  onOpenMarketplace?: () => void;
}) {
  const th = lang === "TH";
  const [series, setSeries] = useState<TrendPoint[]>([]);
  const [source, setSource] = useState<"SNAPSHOT" | "LIVE_POSTS" | "NONE">("NONE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ days: "30" });
    if (region) params.set("region", region);
    if (variety && variety !== "ALL") params.set("variety", variety);

    fetch(`/api/market-stats?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : { series: [], source: "NONE" }))
      .then((data) => {
        setSeries(Array.isArray(data.series) ? data.series : []);
        setSource(data.source === "SNAPSHOT" || data.source === "LIVE_POSTS" ? data.source : "NONE");
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setSeries([]);
          setSource("NONE");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [region, variety]);

  const prices = series
    .flatMap((p) => [p.avgBuyPrice, p.avgSellPrice])
    .filter((v): v is number => v != null && v > 0);
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const minPrice = prices.length ? Math.min(...prices) : 0;

  const sourceLabel =
    source === "SNAPSHOT"
      ? th ? "ข้อมูลสถิติรายวัน" : "Daily market snapshots"
      : source === "LIVE_POSTS"
      ? th ? "คำนวณจากประกาศซื้อ-ขายจริงในระบบ" : "Aggregated from active market listings"
      : th ? "ยังไม่มีประกาศในรอบ 30 วัน" : "No recent listings in the last 30 days";

  // Build SVG polyline points when >= 2 days exist
  const chartPoints = series.slice(-14);
  const svgWidth = 640;
  const svgHeight = 140;
  const padX = 24;
  const padY = 16;
  const range = Math.max(1, maxPrice - minPrice);

  const buildPolyline = (pick: (pt: TrendPoint) => number | null) => {
    const coords: string[] = [];
    const total = Math.max(1, chartPoints.length - 1);
    chartPoints.forEach((pt, idx) => {
      const val = pick(pt);
      if (val == null) return;
      const x = padX + (idx / total) * (svgWidth - padX * 2);
      const y =
        maxPrice === minPrice
          ? svgHeight / 2
          : svgHeight - padY - ((val - minPrice) / range) * (svgHeight - padY * 2);
      coords.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    });
    return coords.join(" ");
  };

  const buyLine = chartPoints.length >= 2 ? buildPolyline((p) => p.avgBuyPrice) : "";
  const sellLine = chartPoints.length >= 2 ? buildPolyline((p) => p.avgSellPrice) : "";

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-brand-ink shrink-0" />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">
              {th ? "แนวโน้มราคากลางย้อนหลัง 30 วัน" : "30-Day Price Trend"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {region}
              {variety && variety !== "ALL" ? ` • ${variety}` : ""} • {sourceLabel}
            </p>
          </div>
        </div>
        {prices.length > 0 && (
          <div className="text-xs text-muted-foreground num bg-canvas border border-line rounded-lg px-3 py-1.5">
            {th ? "ช่วงราคา:" : "Range:"}{" "}
            <strong className="text-foreground">
              ฿{minPrice.toLocaleString()} – ฿{maxPrice.toLocaleString()}
            </strong>{" "}
            {th ? "/กก." : "/kg"}
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground py-4">
          {th ? "กำลังโหลดสถิติราคาย้อนหลัง…" : "Loading historical stats…"}
        </p>
      ) : series.length === 0 ? (
        <div className="rounded-xl border border-line bg-canvas p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {th
                ? `ยังไม่มีข้อมูลซื้อ-ขายย้อนหลัง 30 วันใน${region}`
                : `No 30-day listing history in ${region} yet`}
            </p>
            <p className="text-xs text-muted-foreground">
              {th
                ? "เมื่อมีประกาศซื้อหรือขายในพื้นที่นี้ กราฟแนวโน้มราคาจะคำนวณและแสดงผลโดยอัตโนมัติ"
                : "Price trends will appear automatically as listings are posted in this region."}
            </p>
          </div>
          {onOpenMarketplace && (
            <button
              type="button"
              onClick={onOpenMarketplace}
              className="rounded-lg bg-brand-soft hover:bg-brand-soft/80 text-brand-ink border border-brand-line px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition"
            >
              <span>{th ? "ไปที่ตลาดกลาง" : "Open Marketplace"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(buyLine || sellLine) && (
            <div className="rounded-xl border border-line bg-canvas p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-4 text-xs mb-2">
                <span className="inline-flex items-center gap-1.5 text-info-ink font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-info-ink inline-block" />
                  {th ? "ราคารับซื้อหน้าล้ง" : "Lhong Buying Price"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-brand-ink font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-ink inline-block" />
                  {th ? "ราคาขายหน้าสวน" : "Farm-gate Selling Price"}
                </span>
              </div>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-32 overflow-visible"
                role="img"
                aria-label={th ? "กราฟเส้นแนวโน้มราคาย้อนหลัง" : "Historical price trend line chart"}
              >
                <line x1={padX} y1={padY} x2={svgWidth - padX} y2={padY} stroke="currentColor" strokeOpacity="0.1" />
                <line x1={padX} y1={svgHeight / 2} x2={svgWidth - padX} y2={svgHeight / 2} stroke="currentColor" strokeOpacity="0.1" />
                <line x1={padX} y1={svgHeight - padY} x2={svgWidth - padX} y2={svgHeight - padY} stroke="currentColor" strokeOpacity="0.1" />
                {buyLine && (
                  <polyline
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={buyLine}
                  />
                )}
                {sellLine && (
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={sellLine}
                  />
                )}
              </svg>
            </div>
          )}

          <div className="space-y-2.5">
            {series.slice(-10).map((point) => {
              const buyVal = point.avgBuyPrice;
              const sellVal = point.avgSellPrice;
              const buyPct = buyVal && maxPrice > 0 ? Math.max(12, Math.round((buyVal / maxPrice) * 100)) : 0;
              const sellPct = sellVal && maxPrice > 0 ? Math.max(12, Math.round((sellVal / maxPrice) * 100)) : 0;
              return (
                <div key={point.date} className="grid grid-cols-12 items-center gap-2 text-xs">
                  <span className="col-span-3 sm:col-span-2 text-muted-foreground num">
                    {point.date}
                  </span>
                  <div className="col-span-9 sm:col-span-10 space-y-1">
                    {buyVal != null && (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 rounded-full bg-info-ink/80 transition-all"
                          style={{ width: `${buyPct}%` }}
                        />
                        <span className="text-info-ink font-medium num shrink-0">
                          {th ? "รับซื้อ" : "Buy"} ฿{buyVal.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {sellVal != null && (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 rounded-full bg-brand-ink/80 transition-all"
                          style={{ width: `${sellPct}%` }}
                        />
                        <span className="text-brand-ink font-medium num shrink-0">
                          {th ? "ขายหน้าสวน" : "Sell"} ฿{sellVal.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
