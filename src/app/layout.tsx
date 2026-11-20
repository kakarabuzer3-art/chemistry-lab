import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chemistry Beaker Lab · 3D",
  description: "Explore and arrange realistic 3D laboratory beakers in an interactive chemistry learning lab.",
  applicationName: "Chemistry Beaker Lab",
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#090c0d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
