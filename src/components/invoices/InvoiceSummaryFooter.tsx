"use client";

import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

// Clients (cobros) vs suppliers (pagos) by counterparty keyword
const CLIENT_KEYWORDS = [
  "coto",
  "jumbo",
  "carrefour",
  "walmart",
  "farmacity",
  "disco",
  "makro",
  "tiendas metro",
];

function isClient(inv: Invoice) {
  return CLIENT_KEYWORDS.some((kw) =>
    inv.counterpartyName.toLowerCase().includes(kw),
  );
}

interface InvoiceSummaryFooterProps {
  invoices: Invoice[];
}

export function InvoiceSummaryFooter({ invoices }: InvoiceSummaryFooterProps) {
  const pendingInvs = invoices.filter(
    (inv) => inv.status === "pending" || inv.status === "partially_matched",
  );
  const overdueInvs = invoices.filter((inv) => inv.status === "overdue");

  const totalCobro = pendingInvs
    .filter(isClient)
    .reduce((acc, inv) => acc + inv.totalAmount, 0);

  const totalPago = pendingInvs
    .filter((inv) => !isClient(inv))
    .reduce((acc, inv) => acc + inv.totalAmount, 0);

  const totalVencido = overdueInvs.reduce(
    (acc, inv) => acc + inv.totalAmount,
    0,
  );

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {/* Cobrar */}
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 shadow-subtle">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-50">
          <TrendingUp className="h-4 w-4 text-success-600" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Pendiente de cobro
          </p>
          <p className="mt-0.5 font-mono text-base font-bold text-neutral-900">
            {formatCurrency(totalCobro)}
          </p>
        </div>
      </div>

      {/* Pagar */}
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 shadow-subtle">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <TrendingDown className="h-4 w-4 text-primary-600" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Pendiente de pago
          </p>
          <p className="mt-0.5 font-mono text-base font-bold text-neutral-900">
            {formatCurrency(totalPago)}
          </p>
        </div>
      </div>

      {/* Vencidas */}
      <div
        className={
          overdueInvs.length > 0
            ? "flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3.5"
            : "flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3.5 shadow-subtle"
        }
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            overdueInvs.length > 0 ? "bg-danger-100" : "bg-neutral-100"
          }`}
        >
          <AlertCircle
            className={`h-4 w-4 ${
              overdueInvs.length > 0 ? "text-danger-600" : "text-neutral-400"
            }`}
          />
        </div>
        <div>
          <p
            className={`text-[11px] font-medium uppercase tracking-wide ${
              overdueInvs.length > 0 ? "text-danger-600" : "text-neutral-400"
            }`}
          >
            Facturas vencidas
          </p>
          <p
            className={`mt-0.5 font-mono text-base font-bold ${
              overdueInvs.length > 0 ? "text-danger-700" : "text-neutral-900"
            }`}
          >
            {overdueInvs.length}{" "}
            <span className="text-sm font-normal">
              · {formatCurrency(totalVencido)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
