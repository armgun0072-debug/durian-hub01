import type { Metadata } from "next";
import "./globals.css";
import "./ux-layout.css";
import { ThemeProvider } from "@/components/theme-provider";
import { themeBootstrap } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Durian Hub | ตลาดกลางทุเรียนไทยครบวงจร (ชาวสวน • ล้งรับซื้อ • ทีมรับตัด)",
  description:
    "ระบบตลาดกลางทุเรียน แสดงราคาเสนอจากประกาศแยกสายพันธุ์และพื้นที่ พร้อมระบบประกาศขาย รับซื้อ และรับจ้างตัดทุเรียนตามบทบาทสมาชิก",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body className="min-h-screen bg-canvas text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
