"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import { Plus, ChevronRight, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceModal } from "@/components/invoices/InvoiceModal";
import { InvoiceDrawer } from "@/components/invoices/InvoiceDrawer";
import { InvoiceSummaryFooter } from "@/components/invoices/InvoiceSummaryFooter";
import type { InvoiceTab, InvoiceFilterState } from "@/components/invoices/InvoiceFilters";
import type { Invoice } from "@/lib/types";

function InvoicesPageContent() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InvoiceTab>("all");
  const [filters, setFilters] = useState<InvoiceFilterState>({
    search: "",
    type: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((data) => {
        setInvoices(data?.invoices || data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const pending = invoices.filter(
      (inv) => inv.status === "pending" || inv.status === "partially_matched",
    ).length;
    const matched = invoices.filter((inv) => inv.status === "matched").length;
    const overdue = invoices.filter((inv) => inv.status === "overdue").length;
    return { all: invoices.length, pending, matched, overdue };
  }, [invoices]);

  const filtered = useMemo(() => {
    let list = invoices;

    if (activeTab === "pending") {
      list = list.filter(
        (inv) => inv.status === "pending" || inv.status === "partially_matched",
      );
    } else if (activeTab === "matched") {
      list = list.filter((inv) => inv.status === "matched");
    } else if (activeTab === "overdue") {
      list = list.filter((inv) => inv.status === "overdue");
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.counterpartyName.toLowerCase().includes(q) ||
          inv.counterpartyCuit.includes(q),
      );
    }

    if (filters.type) {
      list = list.filter((inv) => inv.type === filters.type);
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      list = list.filter((inv) => inv.issueDate >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      list = list.filter((inv) => inv.issueDate <= to);
    }

    if (filters.amountMin) {
      const min = parseFloat(filters.amountMin);
      list = list.filter((inv) => inv.totalAmount >= min);
    }
    if (filters.amountMax) {
      const max = parseFloat(filters.amountMax);
      list = list.filter((inv) => inv.totalAmount <= max);
    }

    return list;
  }, [invoices, activeTab, filters]);

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedId) ?? null,
    [invoices, selectedId],
  );

  const handleSave = async (data: Omit<Invoice, "id" | "orgId">) => {
    if (editingInvoice) {
      try {
        await fetch(`/api/invoices/${editingInvoice.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === editingInvoice.id ? { ...inv, ...data } : inv,
          ),
        );
        toast.success("Factura actualizada");
      } catch {
        toast.error("Error al actualizar la factura");
      }
    } else {
      try {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const newInv = await res.json();
        setInvoices((prev) => [newInv, ...prev]);
        toast.success("Factura cargada correctamente", { icon: "🧾" });
      } catch {
        toast.error("Error al crear la factura");
      }
    }
    setModalOpen(false);
    setEditingInvoice(null);
  };

  const handleEdit = (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    if (inv) {
      setEditingInvoice(inv);
      setModalOpen(true);
    }
  };

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      if (selectedId === id) setSelectedId(null);
      toast("Factura eliminada", { icon: "🗑️" });
    } catch {
      toast.error("Error al eliminar la factura");
    }
  }, [selectedId]);

  if (loading) return <PageLoader variant="table" />;

  return (
    <div className="animate-fade-in space-y-6">
      <nav className="flex items-center gap-1 text-sm text-neutral-400">
        <FileText className="h-4 w-4" />
        <span>FlowForge</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-700">Facturas</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Facturas y comprobantes
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            {invoices.length} facturas cargadas
            {counts.pending > 0 && (
              <>
                {" · "}
                <span className="font-medium text-amber-600">
                  {counts.pending} pendientes de match
                </span>
              </>
            )}
            {counts.overdue > 0 && (
              <>
                {" · "}
                <span className="font-medium text-danger-600">
                  {counts.overdue} vencidas
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setEditingInvoice(null);
            setModalOpen(true);
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-input bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Cargar factura
        </button>
      </div>

      <InvoiceFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        filters={filters}
        onFiltersChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced((v) => !v)}
      />

      <InvoiceTable
        invoices={filtered}
        onView={(id) => setSelectedId(id)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <InvoiceSummaryFooter invoices={invoices} />

      <InvoiceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSave}
        editing={editingInvoice}
      />

      <InvoiceDrawer
        invoice={selectedInvoice}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

export default function InvoicesPage() {
  const loading = usePageLoader();
  if (loading) return <PageLoader variant="table" />;
  return <InvoicesPageContent />;
}
