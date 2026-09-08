import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Math Cards",
  description: "Multiplication flash card practice for elementary students.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-white text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
        <main className="flex min-h-dvh flex-col items-center justify-center p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
