import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedBill D1 Claim Workspace",
  description: "Create a draft medical claim manually or from a PDF, validate its fields, and review a CMS-1500-style preview.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
