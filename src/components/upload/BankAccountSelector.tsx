"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, X, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockBankAccounts } from "@/lib/mock-data";

// ── Bancos disponibles ────────────────────────────────────────────────────────

const BANKS = [
  "Galicia",
  "BIND",
  "Santander",
  "BBVA",
  "Macro",
  "HSBC",
  "Otro",
];

// Mapeo banco-selección → nombre en mock data
const BANK_NAME_MAP: Record<string, string> = {
  Galicia: "Banco Galicia",
  BIND: "Banco BIND",
};

// ── Modal agregar cuenta ──────────────────────────────────────────────────────

function AddAccountModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.22 }}
        className="relative w-full max-w-md rounded-card border border-neutral-200 bg-white p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Banco
            </label>
            <input
              type="text"
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
                    defaultChecked={cur === "ARS"}
                    className="accent-primary-600"
                  />
                  <span className="text-sm text-neutral-700">{cur}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-input px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            Cancelar
          </button>
          <button
            onClick={onClose}
            className="rounded-input bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Guardar cuenta
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Select custom liviano ─────────────────────────────────────────────────────

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
            {/* Click-away */}
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

// ── Componente principal ──────────────────────────────────────────────────────

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

  // Filtrar cuentas según banco seleccionado
  const matchingAccounts = selectedBank
    ? mockBankAccounts.filter((ba) => {
        const mapped = BANK_NAME_MAP[selectedBank];
        return mapped ? ba.bankName === mapped : false;
      })
    : [];

  const accountOptions = matchingAccounts.map((ba) => ({
    value: ba.id,
    label: `${ba.accountNumber} — CBU ${ba.cbu.slice(0, 6)}…`,
  }));

  const handleBankChange = (bank: string) => {
    onBankChange(bank);
    onAccountChange("");
  };

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

        {/* Banco */}
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

        {/* Cuenta */}
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
                  : "Primero elegí un banco"
              }
              options={accountOptions}
              disabled={!selectedBank || matchingAccounts.length === 0}
            />
          )}
        </div>

        {/* Período */}
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

      {/* Modal agregar cuenta */}
      <AnimatePresence>
        {showAddModal && (
          <AddAccountModal onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
