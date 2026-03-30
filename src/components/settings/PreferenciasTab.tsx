"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  SettingsSection,
  SettingsField,
  Toggle,
  SaveButton,
  selectCls,
} from "./SettingsUI";

// ── PreferenciasTab ───────────────────────────────────────────────────────────

export function PreferenciasTab() {
  const [darkMode, setDarkMode] = useState(false);
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [currencyFormat, setCurrencyFormat] = useState("ARS");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(false);

  const handleSave = () => {
    toast.success("Preferencias guardadas", { icon: "⚙️" });
  };

  return (
    <div className="space-y-4">
      {/* Apariencia */}
      <SettingsSection
        title="Apariencia"
        description="Personalizá cómo se ve FlowForge"
      >
        <Toggle
          checked={darkMode}
          onChange={setDarkMode}
          label="Modo oscuro"
          description="Cambia el tema de la interfaz a colores oscuros"
          disabled
        />
        {darkMode === false && (
          <p className="mt-1 text-[11px] text-neutral-400">
            El modo oscuro estará disponible próximamente.
          </p>
        )}
      </SettingsSection>

      {/* Formato */}
      <SettingsSection
        title="Formato regional"
        description="Configurá cómo se muestran fechas y monedas"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SettingsField label="Formato de fecha">
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className={selectCls}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (ej: 30/03/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (ej: 03/30/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ej: 2026-03-30)</option>
            </select>
          </SettingsField>

          <SettingsField label="Formato de moneda">
            <select
              value={currencyFormat}
              onChange={(e) => setCurrencyFormat(e.target.value)}
              className={selectCls}
            >
              <option value="ARS">$ Peso argentino ($ 1.234,56)</option>
              <option value="USD">Dólar estadounidense ($ 1,234.56)</option>
            </select>
          </SettingsField>
        </div>

        <div className="mt-5 flex justify-end border-t border-neutral-100 pt-4">
          <SaveButton onClick={handleSave} />
        </div>
      </SettingsSection>

      {/* Notificaciones */}
      <SettingsSection
        title="Notificaciones"
        description="Controlá cuándo y cómo te avisamos"
      >
        <div className="divide-y divide-neutral-50">
          <Toggle
            checked={emailNotifications}
            onChange={setEmailNotifications}
            label="Notificaciones por email"
            description="Recibí un aviso cuando la IA termine de procesar un extracto"
          />
          <Toggle
            checked={autoConfirm}
            onChange={setAutoConfirm}
            label="Confirmación automática de matches"
            description="Confirmar automáticamente los matches con confianza mayor al 95%"
          />
        </div>

        <div className="mt-5 flex justify-end border-t border-neutral-100 pt-4">
          <SaveButton onClick={handleSave} />
        </div>
      </SettingsSection>
    </div>
  );
}
