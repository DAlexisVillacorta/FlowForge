"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Zap, Brain, Info, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import { cn, getCategoryLabel } from "@/lib/utils";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { SettingsSection, SettingsField, inputCls, selectCls } from "./SettingsUI";
import type { ClassificationRule, TransactionCategory } from "@/lib/types";

const ALL_CATEGORIES: TransactionCategory[] = [
  "pago_proveedor",
  "cobro_cliente",
  "impuesto",
  "comision_bancaria",
  "transferencia_interna",
  "salario",
  "alquiler",
  "servicio",
  "retencion",
  "percepcion",
  "iva",
  "otros",
];

function SourceBadge({ source }: { source: ClassificationRule["source"] }) {
  if (source === "ai_generated") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-ai-200 bg-ai-50 px-2 py-0.5 text-[10px] font-bold text-ai-700">
        <Brain className="h-2.5 w-2.5" />
        Aprendida por IA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
      Manual
    </span>
  );
}

interface RuleForm {
  pattern: string;
  category: TransactionCategory;
}

const EMPTY_RULE_FORM: RuleForm = {
  pattern: "",
  category: "otros",
};

function RuleModal({
  isOpen,
  editing,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  editing: ClassificationRule | null;
  onClose: () => void;
  onSave: (form: RuleForm) => void;
}) {
  const [form, setForm] = useState<RuleForm>(
    editing
      ? { pattern: editing.pattern, category: editing.category }
      : EMPTY_RULE_FORM,
  );
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSave = () => {
    if (!form.pattern.trim()) {
      toast.error("El patrón no puede estar vacío");
      return;
    }
    onSave(form);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader
        title={editing ? "Editar regla" : "Agregar regla de clasificación"}
        description="Las reglas se aplican a nuevas transacciones importadas"
        onClose={onClose}
      />
      <ModalBody>
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <label className="text-sm font-medium text-neutral-700">
                Patrón <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute left-5 top-0 z-50 w-64 rounded-lg border border-neutral-200 bg-white p-3 text-xs text-neutral-600 shadow-elevated">
                    <p className="font-semibold text-neutral-800 mb-1">Usá % como comodín</p>
                    <p className="text-neutral-500">
                      <span className="font-mono text-primary-600">COMISION%</span> — matchea cualquier descripción que empiece con COMISION.
                    </p>
                    <p className="mt-1 text-neutral-500">
                      <span className="font-mono text-primary-600">%GALICIA%</span> — matchea si contiene GALICIA.
                    </p>
                    <p className="mt-1 text-neutral-500">
                      También podés usar <span className="font-mono">|</span> para múltiples opciones.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <input
              value={form.pattern}
              onChange={(e) =>
                setForm((f) => ({ ...f, pattern: e.target.value.toUpperCase() }))
              }
              className={inputCls + " font-mono"}
              placeholder="COMISION.*MANTENIMIENTO"
            />
          </div>

          <SettingsField label="Categoría" required>
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  category: e.target.value as TransactionCategory,
                }))
              }
              className={selectCls}
            >
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {getCategoryLabel(c)}
                </option>
              ))}
            </select>
          </SettingsField>

          {form.category && (
            <div className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2.5">
              <span className="text-xs text-neutral-500">Vista previa:</span>
              <CategoryBadge category={form.category} size="sm" />
            </div>
          )}
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
          {editing ? "Guardar cambios" : "Agregar regla"}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export function ReglasTab() {
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassificationRule | null>(null);

  useEffect(() => {
    fetch("/api/rules")
      .then((r) => r.json())
      .then((data) => {
        setRules(data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (rule: ClassificationRule) => {
    setEditing(rule);
    setModalOpen(true);
  };

  const handleSave = async (form: RuleForm) => {
    if (editing) {
      try {
        await fetch(`/api/rules`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        });
        setRules((prev) =>
          prev.map((r) =>
            r.id === editing.id ? { ...r, ...form } : r,
          ),
        );
        toast.success("Regla actualizada");
      } catch {
        toast.error("Error al actualizar la regla");
      }
    } else {
      try {
        const res = await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const newRule = await res.json();
        setRules((prev) => [...prev, newRule]);
        toast.success("Regla agregada");
      } catch {
        toast.error("Error al crear la regla");
      }
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast("Regla eliminada", { icon: "🗑️" });
    } catch {
      toast.error("Error al eliminar la regla");
    }
  };

  const aiCount = rules.filter((r) => r.source === "ai_generated").length;
  const userCount = rules.filter((r) => r.source === "user_defined").length;

  if (loading) {
    return <p className="text-sm text-neutral-400">Cargando reglas...</p>;
  }

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Reglas de clasificación"
        description={`${rules.length} reglas activas · ${aiCount} aprendidas por IA · ${userCount} manuales`}
        action={
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 rounded-input bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar regla
          </button>
        }
      >
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <div className="hidden grid-cols-[1fr_140px_140px_80px_88px] gap-4 border-b border-neutral-100 bg-neutral-50 px-4 py-2.5 lg:grid">
            {["Patrón", "Categoría", "Origen", "Aplicada", "Acciones"].map((h) => (
              <span
                key={h}
                className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400"
              >
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-neutral-50">
            {rules.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">No hay reglas configuradas</p>
            ) : (
              rules.map((rule) => (
                <div key={rule.id}>
                  <div className="hidden grid-cols-[1fr_140px_140px_80px_88px] items-center gap-4 px-4 py-3 transition-colors hover:bg-neutral-50/60 lg:grid">
                    <code className="truncate rounded bg-neutral-50 px-2 py-1 font-mono text-xs text-neutral-700">
                      {rule.pattern}
                    </code>
                    <div>
                      <CategoryBadge category={rule.category} size="sm" />
                    </div>
                    <div>
                      <SourceBadge source={rule.source} />
                    </div>
                    <span className="font-mono text-sm font-semibold text-neutral-600">
                      {rule.timesApplied}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(rule)}
                        className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
                        title="Editar regla"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className={cn(
                          "rounded-md p-1.5 transition-colors",
                          rule.source === "ai_generated"
                            ? "cursor-not-allowed text-neutral-200"
                            : "text-neutral-400 hover:bg-danger-50 hover:text-danger-600",
                        )}
                        disabled={rule.source === "ai_generated"}
                        title={
                          rule.source === "ai_generated"
                            ? "Las reglas de IA no se pueden eliminar"
                            : "Eliminar regla"
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-3 px-4 py-3.5 lg:hidden">
                    <div className="min-w-0 flex-1">
                      <code className="mb-1.5 block truncate rounded bg-neutral-50 px-2 py-1 font-mono text-xs text-neutral-700">
                        {rule.pattern}
                      </code>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CategoryBadge category={rule.category} size="sm" />
                        <SourceBadge source={rule.source} />
                        <span className="text-[11px] text-neutral-400">
                          · {rule.timesApplied}x aplicada
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => openEdit(rule)}
                        className="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        disabled={rule.source === "ai_generated"}
                        className={cn(
                          "rounded-md p-1.5",
                          rule.source === "ai_generated"
                            ? "text-neutral-200"
                            : "text-neutral-400 hover:bg-danger-50 hover:text-danger-600",
                        )}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SettingsSection>

      <div className="rounded-xl border border-ai-200 bg-ai-50/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ai-100">
            <Brain className="h-4 w-4 text-ai-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ai-800">
              Cómo aprende la IA
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ai-700">
              Las reglas marcadas como{" "}
              <span className="font-semibold">Aprendida por IA</span> se generan
              automáticamente cuando corregís una clasificación. Cuanto más usés
              FlowForge, más preciso se vuelve el modelo.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-ai-500" />
              <span className="text-xs text-ai-600">
                {aiCount} reglas aprendidas automáticamente este mes
              </span>
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-lg border border-ai-200 bg-white/60 px-3 py-2 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ai-500" />
          <p className="text-[11px] text-ai-700">
            Las reglas de IA no se pueden eliminar directamente. Para
            desactivarlas, editá el patrón o contactá a soporte.
          </p>
        </div>
      </div>

      <RuleModal
        isOpen={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
