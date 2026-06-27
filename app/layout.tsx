import "./globals.css";

export const metadata = {
  title: "NM Creative",
  description: "Strategy. Design. Growth.",
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