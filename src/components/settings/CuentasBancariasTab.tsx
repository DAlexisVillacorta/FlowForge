"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, CreditCard, Building } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { SettingsSection, SettingsField, inputCls, selectCls } from "./SettingsUI";
import type { BankAccount } from "@/lib/types";

const BANKS = [
  "Banco Galicia",
  "Banco BIND",
  "Santander Argentina",
  "Banco Macro",
  "Banco de la Nación Argentina",
  "BBVA Argentina",
  "ICBC Argentina",
  "Banco Ciudad",
  "Banco Provincia de Buenos Aires",
  "Banco Patagonia",
];

function onlyDigits(v: string, max: number) {
  return v.replace(/\D/g, "").slice(0, max);
}

function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: BankAccount;
  onEdit: (a: BankAccount) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-subtle">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <Building className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-neutral-900">{account.bankName}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold",
                account.currency === "ARS"
                  ? "bg-primary-50 text-primary-700"
                  : "bg-amber-50 text-amber-700",
              )}
            >
              {account.currency}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-neutral-500">
            Cta: {account.accountNumber}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-neutral-400">
            CBU: {account.cbu}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => onEdit(account)}
          className="flex items-center gap-1.5 rounded-input border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
        <button
          onClick={() => onDelete(account.id)}
          className="rounded-input border border-transparent p-1.5 text-neutral-400 transition-colors hover:border-danger-200 hover:bg-danger-50 hover:text-danger-600"
          title="Eliminar cuenta"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

interface AccountForm {
  bankName: string;
  accountNumber: string;
  cbu: string;
  currency: "ARS" | "USD";
}

const EMPTY_FORM: AccountForm = {
  bankName: "Banco Galicia",
  accountNumber: "",
  cbu: "",
  currency: "ARS",
};

function AccountModal({
  isOpen,
  editing,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  editing: BankAccount | null;
  onClose: () => void;
  onSave: (form: AccountForm) => void;
}) {
  const [form, setForm] = useState<AccountForm>(
    editing
      ? {
          bankName: editing.bankName,
          accountNumber: editing.accountNumber,
          cbu: editing.cbu,
          currency: editing.currency,
        }
      : EMPTY_FORM,
  );

  const handleSave = () => {
    if (!form.accountNumber.trim() || form.cbu.length < 22) {
      toast.error("Completá todos los campos correctamente");
      return;
    }
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader
        title={editing ? "Editar cuenta bancaria" : "Agregar cuenta bancaria"}
        description="Completá los datos de la cuenta"
        onClose={onClose}
      />
      <ModalBody>
        <div className="space-y-4">
          <SettingsField label="Banco" required>
            <select
              value={form.bankName}
              onChange={(e) =>
                setForm((f) => ({ ...f, bankName: e.target.value }))
              }
              className={selectCls}
            >
              {BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </SettingsField>

          <SettingsField label="Número de cuenta" required>
            <input
              value={form.accountNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, accountNumber: e.target.value }))
              }
              className={inputCls}
              placeholder="4019871/2 070-3"
            />
          </SettingsField>

          <SettingsField
            label="CBU"
            required
            hint={`${form.cbu.length}/22 dígitos`}
          >
            <input
              value={form.cbu}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  cbu: onlyDigits(e.target.value, 22),
                }))
              }
              className={inputCls}
              placeholder="22 dígitos numéricos"
              inputMode="numeric"
              maxLength={22}
            />
          </SettingsField>

          <SettingsField label="Moneda">
            <select
              value={form.currency}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  currency: e.target.value as "ARS" | "USD",
                }))
              }
              className={selectCls}
            >
              <option value="ARS">$ Peso argentino (ARS)</option>
              <option value="USD">$ Dólar (USD)</option>
            </select>
          </SettingsField>
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          onClick={onClose}
          className="rounded-input px-4 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="rounded-input bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          {editing ? "Guardar cambios" : "Agregar cuenta"}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export function CuentasBancariasTab() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (a: BankAccount) => {
    setEditing(a);
    setModalOpen(true);
  };

  const handleSave = async (form: {
    bankName: string;
    accountNumber: string;
    cbu: string;
    currency: "ARS" | "USD";
  }) => {
    if (editing) {
      try {
        await fetch(`/api/bank-accounts/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === editing.id ? { ...a, ...form } : a,
          ),
        );
        toast.success("Cuenta actualizada correctamente");
      } catch {
        toast.error("Error al actualizar la cuenta");
      }
    } else {
      try {
        const res = await fetch("/api/bank-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const newAccount = await res.json();
        setAccounts((prev) => [...prev, newAccount]);
        toast.success("Cuenta agregada correctamente");
      } catch {
        toast.error("Error al crear la cuenta");
      }
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/bank-accounts?id=${id}`, { method: "DELETE" });
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      toast("Cuenta eliminada", { icon: "🗑️" });
    } catch {
      toast.error("Error al eliminar la cuenta");
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-400">Cargando cuentas...</p>;
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Cuentas bancarias"
        description="Administrá las cuentas bancarias vinculadas a tu organización"
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-input bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar cuenta
          </button>
        }
      >
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <CreditCard className="mb-3 h-8 w-8 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-500">
              No hay cuentas bancarias
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              Agregá tu primera cuenta para empezar a procesar extractos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((a) => (
              <AccountCard
                key={a.id}
                account={a}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </SettingsSection>

      <AccountModal
        isOpen={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
