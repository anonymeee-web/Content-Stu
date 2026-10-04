import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flowmark — Marketing Workflow Studio",
  description: "Quản lý workflow, dữ liệu khách mời, content và feedback của lead.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
