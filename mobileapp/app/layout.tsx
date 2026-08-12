import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VizhaOne",
  description: "Plan, find and book everything for your celebration.",
  applicationName: "VizhaOne",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e11d48",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="capacitor-app-body">{children}</body>
    </html>
  );
}
