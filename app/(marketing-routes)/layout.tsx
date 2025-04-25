export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="light bg-white text-black">
      {children}
    </div>
  );
} 