import { Zap, FileUp, Clock, FileCheck } from "lucide-react";

// ── Right-panel bullet data ───────────────────────────────────────────────────

const BULLETS = [
  {
    icon: FileUp,
    text: "Subí tu extracto y la IA clasifica todo",
  },
  {
    icon: Clock,
    text: "Conciliá transacciones en minutos, no horas",
  },
  {
    icon: FileCheck,
    text: "Reportes listos para tu contador",
  },
];

// ── AuthLayout ────────────────────────────────────────────────────────────────

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Left panel: form ── */}
      <div className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>

      {/* ── Right panel: visual (hidden on mobile) ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-14">
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-800 to-primary-950" />

        {/* Dot grid pattern */}
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full text-white/[0.07]"
        >
          <defs>
            <pattern
              id="auth-dots"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="3" cy="3" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-dots)" />
        </svg>

        {/* Decorative blurred orbs */}
        <div className="absolute -top-32 right-0 h-96 w-96 rounded-full bg-primary-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-primary-300/10 blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-xs text-white">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight">
              FlowForge
            </span>
          </div>

          {/* Tagline */}
          <h2 className="font-heading text-[28px] font-bold leading-snug text-white">
            Automatizá tu contabilidad con inteligencia artificial
          </h2>

          {/* Bullets */}
          <ul className="mt-8 space-y-4">
            {BULLETS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4 text-primary-200" />
                </div>
                <span className="pt-1 text-sm leading-relaxed text-primary-100">
                  {text}
                </span>
              </li>
            ))}
          </ul>

          {/* Bottom badge */}
          <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-primary-100">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-300" />
            Más de 500 PyMEs argentinas ya usan FlowForge
          </div>
        </div>
      </div>
    </div>
  );
}
