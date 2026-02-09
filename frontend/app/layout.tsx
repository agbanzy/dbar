import "./globals.css";

export const metadata = {
  title: "DigiBar - Luxury Bar Management",
  description: "Premium operations and financial control for bars"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
