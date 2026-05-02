"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const BANKS = [
  "Galicia",
  "BIND",
  "Santander",
  "BBVA",
  "Macro",
  "HSBC",
  "Otro",
];

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  cbu: string;
  currency: string;
}

function AddAccountModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cbu, setCbu] = useState("");
  const [currency, setCurrency] = useState("ARS");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!bankName || !accountNumber || !cbu) {
      toast.error("Completá todos los campos");
      return;
    }

    if (cbu.length !== 22) {
      toast.error("El CBU debe tener 22 dígitos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, accountNumber, cbu, currency }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear la cuenta");
      }

      toast.success("Cuenta bancaria creada");
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-md rounded-card border border-neutral-200 bg-white p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-neutral-900">
              Agregar nueva cuenta
            </h3>
            <p className="mt-0.5 text-sm text-neutral-500">
              Registrá una cuenta bancaria nueva
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Banco
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ej: Banco Galicia"
              className="h-10 w-full rounded-input border border-neutral-200 px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Número de cuenta
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Ej: 4019871/2 070-3"
              className="h-10 w-full rounded-input border border-neutral-200 px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              CBU (22 dígitos)
            </label>
            <input
              type="text"
              value={cbu}
              onChange={(e) => setCbu(e.target.value.replace(/\D/g, "").slice(0, 22))}
              placeholder="0070670230000712345691"
              maxLength={22}
              className="h-10 w-full rounded-input border border-neutral-200 px-3 font-mono text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Moneda
            </label>
            <div className="flex gap-3">
              {["ARS", "USD"].map((cur) => (
                <label key={cur} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="currency"
                    checked={currency === cur}
                    onChange={() => setCurrency(cur)}
                    className="accent-primary-600"
                  />
                  <span className="text-sm text-neutral-700">{cur}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-input px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-input bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar cuenta"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SimpleSelect({
  value,
  onChange,
  placeholder,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-input border px-3 text-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30",
          open ? "border-primary-400 ring-2 ring-primary-500/15" : "border-neutral-200",
          disabled ? "cursor-not-allowed bg-neutral-50 text-neutral-400" : "bg-white text-neutral-900 hover:border-neutral-300",
          !selected && "text-neutral-400",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-card border border-neutral-200 bg-white py-1 shadow-elevated"
              style={{ transformOrigin: "top" }}
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-sm transition-colors",
                    opt.value === value
                      ? "bg-primary-50 font-medium text-primary-700"
                      : "text-neutral-700 hover:bg-neutral-50",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface BankAccountSelectorProps {
  selectedBank: string;
  onBankChange: (bank: string) => void;
  accountId: string;
  onAccountChange: (id: string) => void;
  dateFrom: string;
  onDateFromChange: (d: string) => void;
  dateTo: string;
  onDateToChange: (d: string) => void;
}

export function BankAccountSelector({
  selectedBank,
  onBankChange,
  accountId,
  onAccountChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: BankAccountSelectorProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAccounts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const matchingAccounts = selectedBank
    ? accounts.filter((ba) => ba.bankName.toLowerCase().includes(selectedBank.toLowerCase()))
    : accounts;

  const accountOptions = matchingAccounts.map((ba) => ({
    value: ba.id,
    label: `${ba.bankName} — ${ba.accountNumber} — CBU ${ba.cbu.slice(0, 6)}…`,
  }));

  const handleBankChange = (bank: string) => {
    onBankChange(bank);
    onAccountChange("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white p-5 shadow-subtle">
        <p className="text-sm text-neutral-400">Cargando cuentas bancarias...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay: 0.05 }}
        className="space-y-5 rounded-xl border border-neutral-200 bg-white p-5 shadow-subtle"
      >
        <h3 className="font-heading text-base font-semibold text-neutral-900">
          Información del extracto
        </h3>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            ¿De qué banco es este extracto?{" "}
            <span className="text-danger-500">*</span>
          </label>
          <SimpleSelect
            value={selectedBank}
            onChange={handleBankChange}
            placeholder="Seleccioná un banco"
            options={BANKS.map((b) => ({ value: b, label: b }))}
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-700">
              ¿Qué cuenta?
            </label>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar nueva cuenta
            </button>
          </div>

          {selectedBank && matchingAccounts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-input border border-dashed border-neutral-300 px-3 py-2.5">
              <Building2 className="h-4 w-4 text-neutral-400" />
              <span className="text-sm text-neutral-400">
                No hay cuentas registradas para {selectedBank}.{" "}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="font-medium text-primary-600 underline-offset-2 hover:underline"
                >
                  Agregá una
                </button>
              </span>
            </div>
          ) : (
            <SimpleSelect
              value={accountId}
              onChange={onAccountChange}
              placeholder={
                selectedBank
                  ? "Seleccioná una cuenta"
                  : "Seleccioná una cuenta bancaria"
              }
              options={accountOptions}
              disabled={!selectedBank || matchingAccounts.length === 0}
            />
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Período del extracto{" "}
            <span className="text-danger-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-xs text-neutral-500">Desde</p>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className={cn(
                  "h-10 w-full rounded-input border border-neutral-200 px-3 text-sm text-neutral-900 outline-none",
                  "focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15",
                  "transition-colors",
                )}
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-neutral-500">Hasta</p>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => onDateToChange(e.target.value)}
                className={cn(
                  "h-10 w-full rounded-input border border-neutral-200 px-3 text-sm text-neutral-900 outline-none",
                  "focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15",
                  "transition-colors",
                )}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <AddAccountModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              fetch("/api/bank-accounts")
                .then((res) => res.json())
                .then((data) => {
                  if (Array.isArray(data)) {
                    setAccounts(data);
                  }
                });
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
