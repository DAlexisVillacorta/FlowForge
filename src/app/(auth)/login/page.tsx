"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";

// ── Animation variants ────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, type: "tween" as const } },
};

// ── Shared input class ────────────────────────────────────────────────────────

const inputCls =
  "h-11 w-full rounded-input border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15";

// ── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-neutral-200" />
      <span className="text-xs font-medium text-neutral-400">o</span>
      <div className="h-px flex-1 bg-neutral-200" />
    </div>
  );
}

// ── LoginPage ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    router.push("/dashboard");
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.push("/dashboard");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Logo */}
      <motion.div variants={item} className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="font-heading text-lg font-bold text-neutral-900">
          FlowForge
        </span>
      </motion.div>

      {/* Heading */}
      <motion.div variants={item} className="mb-7">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Iniciá sesión
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Ingresá a tu cuenta de FlowForge
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <motion.div variants={item}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            placeholder="lucia@empresa.com.ar"
            autoComplete="email"
            required
          />
        </motion.div>

        {/* Password */}
        <motion.div variants={item}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Contraseña
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls + " pr-10"}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Remember + forgot */}
        <motion.div
          variants={item}
          className="flex items-center justify-between"
        >
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 accent-primary-600"
            />
            <span className="text-sm text-neutral-600">Recordarme</span>
          </label>
          <button
            type="button"
            className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </motion.div>

        {/* Submit */}
        <motion.div variants={item}>
          <button
            type="submit"
            disabled={loading}
            className="relative flex h-11 w-full items-center justify-center gap-2 rounded-input bg-primary-600 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando sesión…
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </motion.div>
      </form>

      {/* Divider */}
      <motion.div variants={item} className="my-5">
        <Divider />
      </motion.div>

      {/* Google */}
      <motion.div variants={item}>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-input border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:border-neutral-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Conectando con Google…" : "Continuar con Google"}
        </button>
      </motion.div>

      {/* Register link */}
      <motion.p
        variants={item}
        className="mt-6 text-center text-sm text-neutral-500"
      >
        ¿No tenés cuenta?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          Registrate
        </Link>
      </motion.p>
    </motion.div>
  );
}
