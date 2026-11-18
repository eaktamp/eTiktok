import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok LIVE Background Studio | คลังฉากหลัง 8 หมวด & ตัวจัดการตั้งค่า",
  description: "สตูดิโอสร้างและจัดการฉากหลัง TikTok LIVE แนวตั้ง 9:16 พร้อม 52 ฉาก 8 หมวดหมู่ ปรับแต่งสี แสง ข้อความ และส่งออก PNG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
