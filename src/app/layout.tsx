import "./globals.css";

export const metadata = {
  title: "Ginhawa Spa & Wellness",
  description: "Wellness booking & scheduling platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}