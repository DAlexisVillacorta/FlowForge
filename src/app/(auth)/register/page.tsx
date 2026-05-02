"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, type: "tween" as const } },
};

const inputCls =
  "h-11 w-full rounded-input border border-neutral-200 bg-white px-3.5 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15";

function applyMaskCuit(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

interface StrengthResult {
  score: 0 | 1 | 2 | 3;
  label: string;
  color: string;
  bg: string;
}

function getStrength(pwd: string): StrengthResult {
  if (!pwd) return { score: 0, label: "", color: "", bg: "" };
  let pts = 0;
  if (pwd.length >= 8) pts++;
  if (/[A-Z]/.test(pwd)) pts++;
  if (/[0-9]/.test(pwd)) pts++;
  if (/[^A-Za-z0-9]/.test(pwd)) pts++;
  if (pts <= 1) return { score: 1, label: "Débil", color: "text-danger-600", bg: "bg-danger-500" };
  if (pts <= 2) return { score: 2, label: "Media", color: "text-amber-600", bg: "bg-amber-400" };
  return { score: 3, label: "Fuerte", color: "text-success-600", bg: "bg-success-500" };
}

function StrengthBar({ password }: { password: string }) {
  const s = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              s.score >= i ? s.bg : "bg-neutral-200"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1 text-xs font-medium ${s.color}`}>{s.label}</p>
    </div>
  );
}

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

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-neutral-200" />
      <span className="text-xs font-medium text-neutral-400">o</span>
      <div className="h-px flex-1 bg-neutral-200" />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cuit, setCuit] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [error, setError] = useState("");

  const confirmMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit = terms && !confirmMismatch && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setError("");
    if (!canSubmit) return;
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, companyName, cuit }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al crear la cuenta");
        toast.error(data.error || "Error al crear la cuenta");
        return;
      }

      toast.success("Cuenta creada exitosamente");

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Error de conexión");
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast.error("Error al conectar con Google");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item} className="mb-7 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="font-heading text-lg font-bold text-neutral-900">
          FlowForge
        </span>
      </motion.div>

      <motion.div variants={item} className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-neutral-900">
          Creá tu cuenta
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          Empezá a automatizar tu contabilidad
        </p>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div variants={item}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Nombre completo <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
            placeholder="Lucía Fernández"
            autoComplete="name"
            required
          />
        </motion.div>

        <motion.div variants={item}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email <span className="text-danger-500">*</span>
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

        <motion.div variants={item}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Contraseña <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls + " pr-10"}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
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
          <StrengthBar password={password} />
        </motion.div>

        <motion.div variants={item}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Confirmar contraseña <span className="text-danger-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={
                inputCls +
                " pr-10 " +
                (confirmMismatch
                  ? "border-danger-300 focus:border-danger-400 focus:ring-danger-500/15"
                  : "")
              }
              placeholder="Repetí tu contraseña"
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-600"
              tabIndex={-1}
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {confirmMismatch && (
            <p className="mt-1 text-xs text-danger-600">
              Las contraseñas no coinciden
            </p>
          )}
        </motion.div>

        <motion.div variants={item}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Nombre de empresa <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className={inputCls}
            placeholder="TechFlow S.R.L."
            required
          />
        </motion.div>

        <motion.div variants={item}>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            CUIT <span className="text-danger-500">*</span>
          </label>
          <input
            value={cuit}
            onChange={(e) => setCuit(applyMaskCuit(e.target.value))}
            className={inputCls + " font-mono"}
            placeholder="30-71234567-9"
            inputMode="numeric"
            required
          />
          <p className="mt-1 text-xs text-neutral-400">Formato: XX-XXXXXXXX-X</p>
        </motion.div>

        <motion.div variants={item}>
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-primary-600"
              required
            />
            <span className="text-sm text-neutral-600">
              Acepto los{" "}
              <button
                type="button"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                términos y condiciones
              </button>{" "}
              y la{" "}
              <button
                type="button"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                política de privacidad
              </button>
            </span>
          </label>
        </motion.div>

        <motion.div variants={item} className="space-y-2">
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="relative flex h-11 w-full items-center justify-center gap-2 rounded-input bg-primary-600 text-sm font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando cuenta…
              </>
            ) : (
              "Crear cuenta"
            )}
          </button>
          {submitAttempted && !terms && (
            <p className="text-center text-xs text-danger-600">
              Tenés que aceptar los términos y condiciones para continuar
            </p>
          )}
          {submitAttempted && confirmMismatch && (
            <p className="text-center text-xs text-danger-600">
              Las contraseñas no coinciden
            </p>
          )}
        </motion.div>
      </form>

      <motion.div variants={item} className="my-5">
        <Divider />
      </motion.div>

      <motion.div variants={item}>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-input border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
          ) : (
            <GoogleIcon />
          )}
          {googleLoading ? "Conectando con Google…" : "Registrate con Google"}
        </button>
      </motion.div>

      <motion.p
        variants={item}
        className="mt-6 text-center text-sm text-neutral-500"
      >
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
        >
          Iniciá sesión
        </Link>
      </motion.p>
    </motion.div>
  );
}
