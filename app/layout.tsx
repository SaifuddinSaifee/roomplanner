import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Room Planner",
  description: "Plan rectangular rooms with real furniture dimensions and fit checks.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
