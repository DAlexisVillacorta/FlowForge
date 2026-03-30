"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { mockOrganization } from "@/lib/mock-data";
import {
  SettingsSection,
  SettingsField,
  SaveButton,
  inputCls,
  selectCls,
} from "./SettingsUI";

// ── CUIT mask ─────────────────────────────────────────────────────────────────

function applyMaskCuit(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

// ── EmpresaTab ────────────────────────────────────────────────────────────────

export function EmpresaTab() {
  const [name, setName] = useState(mockOrganization.name);
  const [cuit, setCuit] = useState(mockOrganization.cuit);
  const [fiscalCategory, setFiscalCategory] = useState("responsable_inscripto");
  const [address, setAddress] = useState("Av. Entre Ríos 1240, CABA");
  const [phone, setPhone] = useState("(011) 4567-8900");

  const handleSave = () => {
    toast.success("Datos de la empresa actualizados", {
      icon: "🏢",
    });
  };

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Datos de la empresa"
        description="Información fiscal y de contacto de tu organización"
        action={
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
            <Building2 className="h-4.5 h-[18px] w-[18px] text-primary-600" />
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SettingsField label="Nombre de la empresa" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Razón social completa"
              />
            </SettingsField>
          </div>

          <SettingsField
            label="CUIT"
            required
            hint="Formato: XX-XXXXXXXX-X"
          >
            <input
              value={cuit}
              onChange={(e) => setCuit(applyMaskCuit(e.target.value))}
              className={inputCls}
              placeholder="30-71234567-9"
              inputMode="numeric"
            />
          </SettingsField>

          <SettingsField label="Categoría fiscal">
            <select
              value={fiscalCategory}
              onChange={(e) => setFiscalCategory(e.target.value)}
              className={selectCls}
            >
              <option value="responsable_inscripto">
                Responsable Inscripto
              </option>
              <option value="monotributista">Monotributista</option>
              <option value="exento">Exento</option>
            </select>
          </SettingsField>

          <SettingsField label="Dirección">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputCls}
              placeholder="Calle, número, ciudad"
            />
          </SettingsField>

          <SettingsField label="Teléfono">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputCls}
              placeholder="(011) 4567-8900"
              type="tel"
            />
          </SettingsField>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5">
          <p className="text-xs text-neutral-400">
            Empresa creada el 10/03/2022
          </p>
          <SaveButton onClick={handleSave} />
        </div>
      </SettingsSection>
    </div>
  );
}
