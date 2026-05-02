import pdfParse from "pdf-parse";
import { parse } from "csv-parse/sync";
import fs from "fs/promises";

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: "credit" | "debit";
}

export interface ParsedStatement {
  transactions: ParsedTransaction[];
  closingBalance: number;
  periodStart: Date;
  periodEnd: Date;
}

// ── Amount parsers ────────────────────────────────────────────────────────────

/**
 * Parses BIND-style amounts: commas as thousands sep, period as decimal.
 * Handles trailing minus for negative saldos: "1,111,288.69-"
 */
function parseBINDAmount(raw: string): number {
  const s = raw.trim();
  const negative = s.endsWith("-");
  const cleaned = s.replace(/,/g, "").replace(/-$/, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : negative ? -n : n;
}

/**
 * Parses dates in D/MM/YY or DD/MM/YY or DD/MM/YYYY format.
 */
function parseDate(raw: string): Date {
  const parts = raw.trim().split(/[\/\-]/);
  if (parts.length === 3) {
    const day   = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const rawYear = parseInt(parts[2], 10);
    const year  = rawYear < 100 ? 2000 + rawYear : rawYear;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date() : d;
}

// ── BIND PDF parser ───────────────────────────────────────────────────────────
//
// BIND statement format (Banco Industrial):
//   FECHA    DETALLE                     REFERENCIA          DEBITOS      CREDITOS     SALDO
//   3/11/25  Crédito Transf. entre Ctas                                42,000,000.00  44,600,318.77
//   3/11/25  Compra Tarjeta Debito        MERPAGO*MERCADOLRD  32,500.00               44,567,818.77
//
// When extracted by pdf-parse each row becomes a single line with ONE amount
// (either debit or credit, never both) followed by the running saldo.
// We determine credit/debit by comparing the new saldo to the previous one.

async function parseBINDPDF(fileBuffer: Buffer): Promise<ParsedStatement> {
  const pdfData = await pdfParse(fileBuffer);
  const lines = pdfData.text
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  // Matches: D/MM/YY  <description + optional reference>  AMOUNT  SALDO  LINE_NUMBER
  // BIND PDFs include a trailing integer (line counter) after the saldo on every row.
  const txRe =
    /^(\d{1,2}\/\d{2}\/\d{2})\s+(.+?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2}-?)\s+\d+\s*$/;

  const saldoInicialRe = /SALDO\s+INICIAL\s+([\d,]+\.\d{2}-?)/i;
  const saldoFinalRe   = /SALDO\s+FINAL\s+([\d,]+\.\d{2}-?)/i;

  let prevSaldo: number | null = null;
  let closingBalance = 0;
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    const si = line.match(saldoInicialRe);
    if (si) {
      prevSaldo = parseBINDAmount(si[1]);
      continue;
    }

    const sf = line.match(saldoFinalRe);
    if (sf) {
      closingBalance = parseBINDAmount(sf[1]);
      continue;
    }

    if (prevSaldo === null) continue;

    const m = line.match(txRe);
    if (!m) continue;

    const [, dateStr, rawDesc, amountStr, saldoStr] = m;

    // Skip page transport/carry-forward lines
    if (/^Transporte\b/i.test(rawDesc)) continue;
    if (/^FECHA\b/.test(rawDesc))       continue;

    const date     = parseDate(dateStr);
    const newSaldo = parseBINDAmount(saldoStr);
    const amount   = parseBINDAmount(amountStr);

    if (isNaN(date.getTime()) || Math.abs(amount) === 0) {
      prevSaldo = newSaldo;
      continue;
    }

    // Determine type from running saldo change
    const diff = newSaldo - prevSaldo;
    const type: "credit" | "debit" = diff >= 0 ? "credit" : "debit";

    transactions.push({
      date,
      description: rawDesc.replace(/\s+/g, " ").trim().substring(0, 200),
      amount: Math.abs(amount),
      type,
    });

    prevSaldo = newSaldo;
  }

  if (closingBalance === 0 && prevSaldo !== null) {
    closingBalance = prevSaldo;
  }

  if (transactions.length === 0) {
    throw new Error(
      "No se encontraron transacciones. Verificá que el extracto sea del Banco Industrial (BIND)."
    );
  }

  const timestamps = transactions
    .map((t) => t.date.getTime())
    .filter((ts) => !isNaN(ts));

  return {
    transactions,
    closingBalance,
    periodStart: new Date(Math.min(...timestamps)),
    periodEnd:   new Date(Math.max(...timestamps)),
  };
}

// ── Generic PDF parser (fallback for other banks) ─────────────────────────────

function parseGenericAmount(raw: string): number {
  const s = raw.trim();
  const negative = s.startsWith("-") || s.endsWith("-");
  const clean = s.replace(/^-/, "").replace(/-$/, "");

  // Detect format: if last separator before digits is comma → Argentine (1.234,56)
  // If last separator before digits is period → US (1,234.56)
  const lastComma  = clean.lastIndexOf(",");
  const lastPeriod = clean.lastIndexOf(".");

  let normalized: string;
  if (lastComma > lastPeriod) {
    // Argentine: 1.234.567,89
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else {
    // US: 1,234,567.89
    normalized = clean.replace(/,/g, "");
  }

  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : negative ? -n : n;
}

async function parseGenericPDF(fileBuffer: Buffer): Promise<ParsedStatement> {
  const pdfData = await pdfParse(fileBuffer);
  const lines = pdfData.text
    .split("\n")
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  // Date patterns: DD/MM/YYYY or DD-MM-YYYY
  const dateRe   = /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/;
  // Amount: numbers with optional thousands sep and 2 decimal places
  const amountRe = /(-?[\d.,]+\.\d{2}|-?[\d.,]+,\d{2})/g;

  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    const dateMatch = line.match(dateRe);
    if (!dateMatch) continue;

    const amounts: number[] = [];
    let m: RegExpExecArray | null;
    amountRe.lastIndex = 0;
    while ((m = amountRe.exec(line)) !== null) {
      const a = parseGenericAmount(m[1]);
      if (a !== 0) amounts.push(a);
    }

    if (amounts.length === 0) continue;

    const amount = amounts[0];
    const date = parseDate(dateMatch[1]);
    const description = line
      .replace(dateMatch[0], "")
      .replace(/(-?[\d.,]+\.\d{2}|-?[\d.,]+,\d{2})/g, "")
      .trim()
      .substring(0, 200);

    if (description.length === 0) continue;

    transactions.push({
      date,
      description,
      amount: Math.abs(amount),
      type: amount < 0 ? "debit" : "credit",
    });
  }

  if (transactions.length === 0) {
    throw new Error(
      "No se pudieron extraer transacciones del PDF. " +
      "Probá con un archivo CSV o verificá que el archivo sea un extracto bancario válido."
    );
  }

  const closingBalance = transactions.reduce(
    (sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount),
    0
  );

  const timestamps = transactions.map((t) => t.date.getTime());
  return {
    transactions,
    closingBalance,
    periodStart: new Date(Math.min(...timestamps)),
    periodEnd:   new Date(Math.max(...timestamps)),
  };
}

// ── PDF entry point ───────────────────────────────────────────────────────────

const BIND_NAMES = ["bind", "banco industrial", "bancoindust"];

export async function parsePDF(
  filePath: string,
  bankName?: string
): Promise<ParsedStatement> {
  const fileBuffer = await fs.readFile(filePath);
  const bank = (bankName ?? "").toLowerCase();

  if (BIND_NAMES.some((n) => bank.includes(n))) {
    return parseBINDPDF(fileBuffer);
  }

  // Try BIND parser first for unrecognized banks — BIND format is common in AR
  try {
    const result = await parseBINDPDF(fileBuffer);
    if (result.transactions.length > 0) return result;
  } catch {
    // Fall through to generic parser
  }

  return parseGenericPDF(fileBuffer);
}

// ── CSV parser ────────────────────────────────────────────────────────────────

export async function parseCSV(
  filePath: string,
  _bankName?: string
): Promise<ParsedStatement> {
  const fileContent = await fs.readFile(filePath, "utf-8");

  const records: string[][] = parse(fileContent, {
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  if (records.length < 2) {
    throw new Error("El archivo CSV no tiene datos suficientes");
  }

  const header = records[0].map((h) => h.toLowerCase().trim());

  const dateIdx   = header.findIndex((h) => /fecha|date/.test(h));
  const descIdx   = header.findIndex((h) => /descripcion|concepto|detalle|description/.test(h));
  const amountIdx = header.findIndex((h) => /monto|importe|amount|valor/.test(h));
  const debitIdx  = header.findIndex((h) => /debito|debit/.test(h));
  const creditIdx = header.findIndex((h) => /credito|credit/.test(h));

  const effDateIdx   = dateIdx   >= 0 ? dateIdx   : 0;
  const effDescIdx   = descIdx   >= 0 ? descIdx   : 1;
  const effAmountIdx = amountIdx >= 0 ? amountIdx : 2;

  const transactions: ParsedTransaction[] = [];

  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (row.length < 2) continue;

    const rawDate   = row[effDateIdx]   ?? "";
    const rawDesc   = row[effDescIdx]   ?? "Sin descripción";
    const rawDebit  = debitIdx  >= 0 ? row[debitIdx]  ?? "" : "";
    const rawCredit = creditIdx >= 0 ? row[creditIdx] ?? "" : "";
    const rawAmount = row[effAmountIdx] ?? "0";

    if (!rawDate) continue;

    const date = parseDate(rawDate);
    if (isNaN(date.getTime())) continue;

    let amount: number;
    let type: "credit" | "debit";

    if (debitIdx >= 0 && creditIdx >= 0) {
      const debit  = parseGenericAmount(rawDebit);
      const credit = parseGenericAmount(rawCredit);
      if (credit !== 0) { amount = credit; type = "credit"; }
      else              { amount = debit;  type = "debit";  }
    } else {
      amount = parseGenericAmount(rawAmount);
      type   = amount >= 0 ? "credit" : "debit";
    }

    if (Math.abs(amount) === 0) continue;

    transactions.push({
      date,
      description: rawDesc.substring(0, 200),
      amount: Math.abs(amount),
      type,
    });
  }

  if (transactions.length === 0) {
    throw new Error("No se encontraron transacciones en el CSV");
  }

  const closingBalance = transactions.reduce(
    (sum, t) => sum + (t.type === "credit" ? t.amount : -t.amount),
    0
  );

  const timestamps = transactions.map((t) => t.date.getTime());
  return {
    transactions,
    closingBalance,
    periodStart: new Date(Math.min(...timestamps)),
    periodEnd:   new Date(Math.max(...timestamps)),
  };
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function parseStatement(
  filePath: string,
  fileType: "pdf" | "csv",
  bankName?: string
): Promise<ParsedStatement> {
  return fileType === "pdf"
    ? parsePDF(filePath, bankName)
    : parseCSV(filePath, bankName);
}
