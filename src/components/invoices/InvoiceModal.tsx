"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { mockInvoices } from "@/lib/mock-data";
import { getInvoiceTypeLabel } from "./InvoiceTypeBadge";
import type { Invoice } from "@/lib/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const INVOICE_TYPES = [
  "factura_a",
  "factura_b",
  "factura_c",
  "nota_credito",
  "nota_debito",
  "recibo",
] as const;

const IVA_RATES = [
  { label: "21%", value: 0.21 },
  { label: "10,5%", value: 0.105 },
  { label: "27%", value: 0.27 },
  { label: "0%", value: 0 },
  { label: "Exento", value: 0 },
];

// Unique counterparties from mock data for autocomplete
const KNOWN_COUNTERPARTIES = Array.from(
  new Map(
    mockInvoices.map((inv) => [
      inv.counterpartyName,
      { name: inv.counterpartyName, cuit: inv.counterpartyCuit },
    ]),
  ).values(),
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyMaskCuit(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

function onlyDigits(v: string, max: number) {
  return v.replace(/\D/g, "").slice(0, max);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ── Form state ────────────────────────────────────────────────────────────────

interface InvoiceFormState {
  type: Invoice["type"];
  puntoVenta: string;
  numero: string;
  counterpartyName: string;
  counterpartyCuit: string;
  netAmount: string;
  ivaRate: string;
  ivaAmount: string;
  totalAmount: string;
  issueDate: string;
  dueDate: string;
  pdfFile: File | null;
}

const EMPTY_FORM: InvoiceFormState = {
  type: "factura_a",
  puntoVenta: "",
  numero: "",
  counterpartyName: "",
  counterpartyCuit: "",
  netAmount: "",
  ivaRate: "0.21",
  ivaAmount: "",
  totalAmount: "",
  issueDate: "",
  dueDate: "",
  pdfFile: null,
};

// ── Shared input cls ──────────────────────────────────────────────────────────

const inputCls =
  "h-9 w-full rounded-input border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed";

const selectCls =
  "h-9 w-full rounded-input border border-neutral-200 bg-white px-2.5 text-sm text-neutral-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/15";

// ── Mini dropzone ─────────────────────────────────────────────────────────────

function MiniDropzone({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.type === "application/pdf") onChange(dropped);
        else toast.error("Solo se aceptan archivos PDF");
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
        dragging
          ? "border-primary-400 bg-primary-50"
          : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(f);
        }}
      />
      {file ? (
        <>
          <FileText className="h-5 w-5 text-primary-600" />
          <p className="max-w-full truncate text-sm font-medium text-primary-700">
            {file.name}
          </p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="mt-0.5 text-xs text-neutral-400 hover:text-danger-600"
          >
            Quitar
          </button>
        </>
      ) : (
        <>
          <Upload className="h-5 w-5 text-neutral-400" />
          <p className="text-sm text-neutral-500">
            <span className="font-medium text-primary-600">
              Hacé clic
            </span>{" "}
            o arrastrá el PDF de la factura
          </p>
          <p className="text-[11px] text-neutral-400">Opcional · máx. 10 MB</p>
        </>
      )}
    </div>
  );
}

// ── Autocomplete input ────────────────────────────────────────────────────────

function CounterpartyInput({
  value,
  onChange,
  onSelectCuit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelectCuit: (cuit: string) => void;
}) {
  const [showList, setShowList] = useState(false);
  const suggestions = KNOWN_COUNTERPARTIES.filter(
    (cp) =>
      value.length > 0 &&
      cp.name.toLowerCase().includes(value.toLowerCase()),
  ).slice(0, 5);

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowList(true); }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 150)}
        className={inputCls}
        placeholder="Ej: Limpieza Total SA"
        autoComplete="off"
      />
      {showList && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-elevated">
          {suggestions.map((cp) => (
            <li key={cp.name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(cp.name);
                  onSelectCuit(cp.cuit);
                  setShowList(false);
                }}
                className="flex w-full flex-col px-3.5 py-2.5 text-left transition-colors hover:bg-neutral-50"
              >
                <span className="text-sm font-medium text-neutral-800">
                  {cp.name}
                </span>
                <span className="font-mono text-[11px] text-neutral-400">
                  {cp.cuit}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Label helper ──────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-700">
        {label}
        {required && <span className="ml-0.5 text-danger-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

// ── InvoiceModal ──────────────────────────────────────────────────────────────

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, "id" | "orgId">) => void;
  editing?: Invoice | null;
}

export function InvoiceModal({
  isOpen,
  onClose,
  onSave,
  editing,
}: InvoiceModalProps) {
  const [form, setForm] = useState<InvoiceFormState>(() => {
    if (editing) {
      const parts = editing.invoiceNumber.split("-");
      return {
        type: editing.type,
        puntoVenta: parts[0]?.trim() ?? "",
        numero: parts[1]?.trim() ?? "",
        counterpartyName: editing.counterpartyName,
        counterpartyCuit: editing.counterpartyCuit,
        netAmount: String(editing.netAmount),
        ivaRate: "0.21",
        ivaAmount: String(editing.ivaAmount),
        totalAmount: String(editing.totalAmount),
        issueDate: editing.issueDate.toISOString().slice(0, 10),
        dueDate: editing.dueDate.toISOString().slice(0, 10),
        pdfFile: null,
      };
    }
    return EMPTY_FORM;
  });

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      if (editing) {
        const parts = editing.invoiceNumber.split("-");
        setForm({
          type: editing.type,
          puntoVenta: parts[0]?.trim() ?? "",
          numero: parts[1]?.trim() ?? "",
          counterpartyName: editing.counterpartyName,
          counterpartyCuit: editing.counterpartyCuit,
          netAmount: String(editing.netAmount),
          ivaRate: "0.21",
          ivaAmount: String(editing.ivaAmount),
          totalAmount: String(editing.totalAmount),
          issueDate: editing.issueDate.toISOString().slice(0, 10),
          dueDate: editing.dueDate.toISOString().slice(0, 10),
          pdfFile: null,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [isOpen, editing]);

  // Auto-calc IVA
  const updateAmounts = (
    net: string,
    rate: string,
  ): Partial<InvoiceFormState> => {
    const n = parseFloat(net) || 0;
    const r = parseFloat(rate) || 0;
    const iva = round2(n * r);
    const total = round2(n + iva);
    return {
      netAmount: net,
      ivaRate: rate,
      ivaAmount: iva > 0 ? String(iva) : "",
      totalAmount: n > 0 ? String(total) : "",
    };
  };

  const set = (patch: Partial<InvoiceFormState>) =>
    setForm((f) => ({ ...f, ...patch }));

  const handleSave = () => {
    if (!form.counterpartyName.trim() || !form.issueDate || !form.dueDate) {
      toast.error("Completá todos los campos obligatorios");
      return;
    }
    const net = parseFloat(form.netAmount) || 0;
    const iva = parseFloat(form.ivaAmount) || 0;
    const total = parseFloat(form.totalAmount) || net + iva;
    const number = `${form.puntoVenta.padStart(4, "0")}-${form.numero.padStart(8, "0")}`;

    onSave({
      type: form.type,
      invoiceNumber: number,
      counterpartyName: form.counterpartyName,
      counterpartyCuit: form.counterpartyCuit,
      netAmount: net,
      ivaAmount: iva,
      totalAmount: total,
      issueDate: new Date(form.issueDate),
      dueDate: new Date(form.dueDate),
      status: "pending",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title={editing ? "Editar factura" : "Cargar factura"}
        description="Completá los datos del comprobante"
        onClose={onClose}
      />
      <ModalBody className="max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          {/* Tipo */}
          <Field label="Tipo de comprobante" required>
            <select
              value={form.type}
              onChange={(e) => set({ type: e.target.value as Invoice["type"] })}
              className={selectCls}
            >
              {INVOICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {getInvoiceTypeLabel(t)}
                </option>
              ))}
            </select>
          </Field>

          {/* Número */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Punto de venta" required hint="4 dígitos">
              <input
                value={form.puntoVenta}
                onChange={(e) =>
                  set({ puntoVenta: onlyDigits(e.target.value, 4) })
                }
                className={inputCls + " font-mono"}
                placeholder="0001"
                inputMode="numeric"
              />
            </Field>
            <Field label="Número" required hint="8 dígitos">
              <input
                value={form.numero}
                onChange={(e) =>
                  set({ numero: onlyDigits(e.target.value, 8) })
                }
                className={inputCls + " font-mono"}
                placeholder="00045678"
                inputMode="numeric"
              />
            </Field>
          </div>

          {/* Proveedor / Cliente */}
          <Field label="Proveedor / Cliente" required>
            <CounterpartyInput
              value={form.counterpartyName}
              onChange={(v) => set({ counterpartyName: v })}
              onSelectCuit={(cuit) => set({ counterpartyCuit: cuit })}
            />
          </Field>

          {/* CUIT */}
          <Field label="CUIT" hint="Formato: XX-XXXXXXXX-X">
            <input
              value={form.counterpartyCuit}
              onChange={(e) =>
                set({ counterpartyCuit: applyMaskCuit(e.target.value) })
              }
              className={inputCls + " font-mono"}
              placeholder="30-71234567-9"
              inputMode="numeric"
            />
          </Field>

          {/* Montos */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto neto" required>
              <input
                type="number"
                value={form.netAmount}
                onChange={(e) => {
                  const updated = updateAmounts(e.target.value, form.ivaRate);
                  setForm((f) => ({ ...f, ...updated }));
                }}
                className={inputCls}
                placeholder="0,00"
                min={0}
                step={0.01}
              />
            </Field>
            <Field label="Alícuota IVA">
              <select
                value={form.ivaRate}
                onChange={(e) => {
                  const updated = updateAmounts(form.netAmount, e.target.value);
                  setForm((f) => ({ ...f, ...updated }));
                }}
                className={selectCls}
              >
                {IVA_RATES.map((r) => (
                  <option key={r.label} value={String(r.value)}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto IVA">
              <input
                value={form.ivaAmount}
                disabled
                className={inputCls}
                placeholder="Auto"
              />
            </Field>
            <Field label="Total">
              <input
                value={form.totalAmount}
                disabled
                className={inputCls + " font-bold"}
                placeholder="Auto"
              />
            </Field>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha de emisión" required>
              <input
                type="date"
                value={form.issueDate}
                onChange={(e) => set({ issueDate: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Fecha de vencimiento" required>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          {/* Dropzone */}
          <Field label="Adjuntar PDF" hint="Opcional">
            <MiniDropzone
              file={form.pdfFile}
              onChange={(f) => set({ pdfFile: f })}
            />
          </Field>
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
          {editing ? "Guardar cambios" : "Guardar factura"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
