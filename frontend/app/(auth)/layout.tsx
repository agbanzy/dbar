export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Panel – Branding / Hero Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background gradient layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1400] via-bg-primary to-bg-primary" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(251,191,36,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(217,119,6,0.1),transparent_50%)]" />

        {/* Decorative floating shapes */}
        <div className="absolute top-[15%] left-[10%] w-72 h-72 rounded-full bg-gold/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-[20%] right-[15%] w-96 h-96 rounded-full bg-gold-dark/5 blur-3xl animate-pulse [animation-delay:1s]" />
        <div className="absolute top-[50%] left-[50%] w-48 h-48 rounded-full bg-gold-light/5 blur-2xl animate-pulse [animation-delay:2s]" />

        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(251,191,36,0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(251,191,36,0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gold-light to-gold-dark shadow-glow">
                <span className="text-lg font-black text-black">DB</span>
              </div>
              <span className="text-2xl font-black text-gradient-gold">DigiBar</span>
            </div>
          </div>

          {/* Hero section */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            {/* Large decorative icon */}
            <div className="relative mb-10">
              <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-gold/20 to-gold-dark/10 backdrop-blur-sm border border-gold/20 flex items-center justify-center shadow-glow-lg rotate-6">
                <div className="w-36 h-36 rounded-2xl bg-gradient-to-br from-gold/10 to-transparent border border-gold/10 flex items-center justify-center -rotate-6">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="-rotate-3">
                    <path d="M20 15h40l-12 30v15h-16V45L20 15z" stroke="url(#goldGrad)" strokeWidth="2.5" fill="rgba(251,191,36,0.08)" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M24 65h32" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M36 60h8" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="52" cy="22" r="3" fill="#fbbf24" opacity="0.6" />
                    <circle cx="35" cy="18" r="2" fill="#fcd34d" opacity="0.4" />
                    <path d="M25 25h22" stroke="rgba(251,191,36,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="goldGrad" x1="20" y1="15" x2="60" y2="65" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#fcd34d" />
                        <stop offset="1" stopColor="#d97706" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
              {/* Floating accent dots */}
              <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-gold/20 border border-gold/30 animate-bounce [animation-duration:3s]" />
              <div className="absolute -bottom-2 -left-6 w-6 h-6 rounded-full bg-gold-dark/20 border border-gold-dark/30 animate-bounce [animation-duration:4s] [animation-delay:1s]" />
              <div className="absolute top-1/2 -right-8 w-4 h-4 rounded-full bg-gold-light/30 animate-bounce [animation-duration:3.5s] [animation-delay:0.5s]" />
            </div>

            <h2 className="text-4xl font-black text-center mb-4 leading-tight">
              <span className="text-gradient-gold">Luxury Bar</span>
              <br />
              <span className="text-text-primary">Management</span>
            </h2>
            <p className="text-text-secondary text-center text-lg max-w-sm leading-relaxed">
              Streamline your operations with real-time sales tracking, inventory control, and powerful analytics.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {["Sales Tracking", "Inventory", "Reports", "Multi-Role"].map((feature) => (
                <span
                  key={feature}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-gold/10 text-gold border border-gold/20 backdrop-blur-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="text-text-tertiary text-sm">
            <p>Powered by intelligence. Built for excellence.</p>
          </div>
        </div>
      </div>

      {/* Right Panel – Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-bg-primary p-6 sm:p-8 lg:p-12 relative">
        {/* Subtle background accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(251,191,36,0.04),transparent_50%)]" />

        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
