import "@/styles/globals.css";
import { Metadata } from "next";
import { Providers } from "@/app/[lang]/providers";
import { fontSans } from "@/config/fonts";
import clsx from "clsx";

export const metadata: Metadata = {
  title: "Admin Panel - FreewayVPN",
  description: "FreewayVPN Admin Panel",
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: "en" | "zh" }>;
}) {
  const { lang } = await params;

  return (
    <html suppressHydrationWarning lang={lang}>
      <head />
      <body
        className={clsx("min-h-screen font-sans antialiased", fontSans.variable)}
        style={{ backgroundColor: "#060010" }}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
