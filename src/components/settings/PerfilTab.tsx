"use client";

import { useState } from "react";
import { Camera, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { mockOrganization } from "@/lib/mock-data";
import {
  SettingsSection,
  SettingsField,
  SaveButton,
  inputCls,
} from "./SettingsUI";

// ── PerfilTab ─────────────────────────────────────────────────────────────────

export function PerfilTab() {
  const [name, setName] = useState("Lucía Fernández");
  const email = "lucia.fernandez@techflow.com.ar";

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSave = () => {
    toast.success("Perfil actualizado correctamente", { icon: "👤" });
  };

  return (
    <div className="space-y-4">
      <SettingsSection
        title="Mi perfil"
        description="Información de tu cuenta de usuario"
      >
        {/* Avatar */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-xl font-bold text-primary-700">
              {initials}
            </div>
            <button
              disabled
              className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-not-allowed items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-neutral-400"
              title="Cambiar foto (próximamente)"
            >
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">{name}</p>
            <p className="text-xs text-neutral-500">{email}</p>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-700">
              <Shield className="h-2.5 w-2.5" />
              Admin
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SettingsField label="Nombre completo" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="Tu nombre completo"
              />
            </SettingsField>
          </div>

          <div className="sm:col-span-2">
            <SettingsField
              label="Email"
              hint="El email no se puede modificar. Contactá a soporte si necesitás cambiarlo."
            >
              <input
                value={email}
                disabled
                className={inputCls}
                readOnly
              />
            </SettingsField>
          </div>

          <SettingsField label="Organización">
            <input
              value={mockOrganization.name}
              disabled
              className={inputCls}
              readOnly
            />
          </SettingsField>

          <SettingsField label="Rol">
            <div className="flex h-9 items-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-700">
                <Shield className="h-3.5 w-3.5" />
                Administrador
              </span>
            </div>
          </SettingsField>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5">
          <p className="text-xs text-neutral-400">
            Miembro desde el 10/03/2022
          </p>
          <SaveButton onClick={handleSave} />
        </div>
      </SettingsSection>
    </div>
  );
}
