import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedBill Document Router",
  description: "Scan claim PDFs from an R2 input folder and route them into accepted, review, rejected, or failed output folders.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
