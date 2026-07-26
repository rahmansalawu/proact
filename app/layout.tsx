import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "ProAct HSE Pro | Capture. Control. Prove.",
    description: "An intelligent HSE and ESG command centre for safer, audit-ready organisations.",
    openGraph: {
      title: "ProAct HSE Pro",
      description: "Capture. Control. Prove. Your intelligent HSE command centre.",
      type: "website",
      images: [{ url: socialImage, width: 1680, height: 945, alt: "ProAct HSE Pro compliance command centre" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "ProAct HSE Pro",
      description: "Capture. Control. Prove. Your intelligent HSE command centre.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
