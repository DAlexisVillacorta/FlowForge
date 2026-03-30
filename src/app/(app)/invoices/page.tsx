"use client";

import { useMemo, useState } from "react";
import { usePageLoader } from "@/hooks/usePageLoader";
import { PageLoader } from "@/components/ui/PageLoader";
import { Plus, ChevronRight, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { mockInvoices } from "@/lib/mock-data";
import { InvoiceFilters } from "@/components/invoices/InvoiceFilters";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { InvoiceModal } from "@/components/invoices/InvoiceModal";
import { InvoiceDrawer } from "@/components/invoices/InvoiceDrawer";
import { InvoiceSummaryFooter } from "@/components/invoices/InvoiceSummaryFooter";
import type { InvoiceTab, InvoiceFilterState } from "@/components/invoices/InvoiceFilters";
import type { Invoice } from "@/lib/types";

// ── Seed ──────────────────────────────────────────────────────────────────────

let nextId = mockInvoices.length + 1;

// ── Page ──────────────────────────────────────────────────────────────────────

function InvoicesPageContent() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
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

  // ── Derived counts ──────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const pending = invoices.filter(
      (inv) => inv.status === "pending" || inv.status === "partially_matched",
    ).length;
    const matched = invoices.filter((inv) => inv.status === "matched").length;
    const overdue = invoices.filter((inv) => inv.status === "overdue").length;
    return { all: invoices.length, pending, matched, overdue };
  }, [invoices]);

  // ── Filtered list ───────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = invoices;

    // Tab filter
    if (activeTab === "pending") {
      list = list.filter(
        (inv) => inv.status === "pending" || inv.status === "partially_matched",
      );
    } else if (activeTab === "matched") {
      list = list.filter((inv) => inv.status === "matched");
    } else if (activeTab === "overdue") {
      list = list.filter((inv) => inv.status === "overdue");
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.counterpartyName.toLowerCase().includes(q) ||
          inv.counterpartyCuit.includes(q),
      );
    }

    // Type
    if (filters.type) {
      list = list.filter((inv) => inv.type === filters.type);
    }

    // Date range (by issueDate)
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      list = list.filter((inv) => inv.issueDate >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      list = list.filter((inv) => inv.issueDate <= to);
    }

    // Amount range (totalAmount)
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

  // ── Handlers ────────────────────────────────────────────────────────────────

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedId) ?? null,
    [invoices, selectedId],
  );

  const handleSave = (data: Omit<Invoice, "id" | "orgId">) => {
    if (editingInvoice) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === editingInvoice.id ? { ...inv, ...data } : inv,
        ),
      );
      toast.success("Factura actualizada");
    } else {
      const newInv: Invoice = {
        id: `inv-new-${nextId++}`,
        orgId: "org-1",
        ...data,
      };
      setInvoices((prev) => [newInv, ...prev]);
      toast.success("Factura cargada correctamente", { icon: "🧾" });
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

  const handleDelete = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast("Factura eliminada", { icon: "🗑️" });
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-neutral-400">
        <FileText className="h-4 w-4" />
        <span>FlowForge</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-neutral-700">Facturas</span>
      </nav>

      {/* Header */}
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

      {/* Filters */}
      <InvoiceFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        filters={filters}
        onFiltersChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
        showAdvanced={showAdvanced}
        onToggleAdvanced={() => setShowAdvanced((v) => !v)}
      />

      {/* Table */}
      <InvoiceTable
        invoices={filtered}
        onView={(id) => setSelectedId(id)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Summary footer */}
      <InvoiceSummaryFooter invoices={invoices} />

      {/* Modal */}
      <InvoiceModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingInvoice(null);
        }}
        onSave={handleSave}
        editing={editingInvoice}
      />

      {/* Drawer */}
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
