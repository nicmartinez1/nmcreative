import "./globals.css";

export const metadata = {
  title: "Web Skillet",
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