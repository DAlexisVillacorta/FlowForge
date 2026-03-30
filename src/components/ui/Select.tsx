"use client";

import {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
} from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  error?: string;
  className?: string;
  id?: string;
}

export function Select({
  options,
  value,
  onChange,
  multiple = false,
  placeholder = "Seleccioná una opción",
  searchable = false,
  disabled = false,
  label,
  helperText,
  error,
  className,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const inputId = id ?? uid;
  const listboxId = `${uid}-listbox`;

  // Normalize value to array
  const selected = useMemo<string[]>(() => {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
  }, [value]);

  // Filter + group options
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return options.filter((o) =>
      !q || o.label.toLowerCase().includes(q) || o.group?.toLowerCase().includes(q),
    );
  }, [options, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, SelectOption[]>();
    filtered.forEach((opt) => {
      const key = opt.group ?? "";
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, opt]);
    });
    return map;
  }, [filtered]);

  // Display label
  const displayLabel = useMemo(() => {
    if (selected.length === 0) return "";
    if (multiple) {
      if (selected.length === 1) {
        return options.find((o) => o.value === selected[0])?.label ?? selected[0];
      }
      return `${selected.length} seleccionados`;
    }
    return options.find((o) => o.value === selected[0])?.label ?? selected[0];
  }, [selected, options, multiple]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open && searchable) {
      requestAnimationFrame(() => searchRef.current?.focus());
    }
    if (!open) {
      setFocusedIndex(-1);
      setSearch("");
    }
  }, [open, searchable]);

  function toggleOption(val: string) {
    if (multiple) {
      const next = selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val];
      onChange?.(next);
    } else {
      onChange?.(val);
      setOpen(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    const flat = filtered.filter((o) => !o.disabled);
    switch (e.key) {
      case "Enter":
      case " ":
        if (!open) { setOpen(true); break; }
        if (focusedIndex >= 0 && flat[focusedIndex]) {
          toggleOption(flat[focusedIndex].value);
        }
        e.preventDefault();
        break;
      case "Escape":
        setOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) { setOpen(true); break; }
        setFocusedIndex((i) => Math.min(i + 1, flat.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
        break;
    }
  }

  function clearAll(e: React.MouseEvent) {
    e.stopPropagation();
    onChange?.(multiple ? [] : "");
  }

  const flat = filtered.filter((o) => !o.disabled);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}

      <div ref={containerRef} className="relative">
        {/* Trigger */}
        <button
          id={inputId}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-input border px-3 text-sm transition-all duration-150",
            "outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20",
            error
              ? "border-danger-400 focus-visible:border-danger-500"
              : "border-neutral-200 focus-visible:border-primary-500",
            disabled
              ? "cursor-not-allowed bg-neutral-50 text-neutral-400"
              : "bg-white text-neutral-900 hover:border-neutral-300",
          )}
        >
          <span className={cn("truncate", !displayLabel && "text-neutral-400")}>
            {displayLabel || placeholder}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {selected.length > 0 && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={clearAll}
                className="rounded p-0.5 text-neutral-400 hover:text-neutral-600"
                aria-label="Limpiar selección"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-neutral-400 transition-transform duration-150",
                open && "rotate-180",
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple}
            className="absolute z-50 mt-1 w-full rounded-card border border-neutral-200 bg-white py-1 shadow-elevated"
          >
            {searchable && (
              <div className="border-b border-neutral-100 px-2 py-2">
                <div className="flex items-center gap-2 rounded-input border border-neutral-200 bg-neutral-50 px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setFocusedIndex(-1);
                    }}
                    placeholder="Buscar…"
                    className="flex-1 bg-transparent text-xs text-neutral-900 outline-none placeholder:text-neutral-400"
                  />
                </div>
              </div>
            )}

            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-xs text-neutral-400">
                  Sin resultados
                </p>
              ) : (
                Array.from(grouped.entries()).map(([group, opts]) => (
                  <div key={group}>
                    {group && (
                      <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                        {group}
                      </p>
                    )}
                    {opts.map((opt) => {
                      const flatIdx = flat.indexOf(opt);
                      const isSelected = selected.includes(opt.value);
                      const isFocused = flatIdx === focusedIndex;
                      return (
                        <button
                          key={opt.value}
                          role="option"
                          aria-selected={isSelected}
                          disabled={opt.disabled}
                          onClick={() => toggleOption(opt.value)}
                          onMouseEnter={() => setFocusedIndex(flatIdx)}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                            isFocused ? "bg-neutral-50" : "",
                            isSelected ? "text-primary-700" : "text-neutral-700",
                            opt.disabled
                              ? "cursor-not-allowed opacity-50"
                              : "hover:bg-neutral-50",
                          )}
                        >
                          {/* Check mark */}
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-primary-600" />
                            )}
                          </span>
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {(helperText || error) && (
        <p className={cn("text-xs", error ? "text-danger-600" : "text-neutral-500")}>
          {error ?? helperText}
        </p>
      )}
    </div>
  );
}
