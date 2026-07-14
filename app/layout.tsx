import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://webskillet.net"),
  title: "Web Skillet | webskillet.net",
  description: "Web design, social, ads, and SEO — cooked up together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}