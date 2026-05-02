import { db } from "@/lib/db";
import type { TransactionCategory, MatchType } from "@prisma/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MatchTx {
  id: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  transactionDate: Date;
  aiCategory: TransactionCategory;
}

interface MatchInv {
  id: string;
  invoiceNumber: string;
  counterpartyName: string;
  counterpartyCuit: string;
  totalAmount: number;
  netAmount: number;
  ivaAmount: number;
  issueDate: Date;
  dueDate: Date;
  type: string;
}

interface SignalScores {
  amount: number;
  date: number;
  counterparty: number;
  reference: number;
  direction: number;
}

interface PairScore {
  signals: SignalScores;
  total: number;
  matchType: MatchType;
}

// ── Tunable parameters ────────────────────────────────────────────────────────

const WEIGHTS = {
  amount: 0.45,
  counterparty: 0.30,
  date: 0.15,
  reference: 0.10,
} as const;

const SUGGESTION_THRESHOLD = 0.55;

// Categories that should never be matched against invoices
const NON_MATCHABLE_CATEGORIES = new Set<TransactionCategory>([
  "transferencia_interna",
  "comision_bancaria",
  "retencion",
  "percepcion",
  "iva",
  "impuesto",
  "salario",
]);

// ── Text normalization ────────────────────────────────────────────────────────

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const COMPANY_SUFFIX_TOKENS = new Set([
  "sa", "srl", "sas", "sau", "saca", "sacai", "cicsa", "spa",
  "ltd", "ltda", "cia", "cio", "inc", "corp",
  "sociedad", "anonima", "limitada", "responsabilidad",
]);

const NOISE_TOKENS = new Set([
  "trf", "transferencia", "transf", "cobro", "debito", "credito",
  "acred", "acreditacion", "pago", "factura", "fact", "comprobante",
  "deb", "cred", "compra", "tarjeta", "ref", "varios", "movimiento",
  "argentina", "arg", "del", "los", "las", "para", "por", "via",
  "desde", "hasta", "con", "via", "nro", "num", "numero",
  "saldo", "venta", "ventas", "servicio", "servicios", "echeq", "debin",
]);

function normalizeText(s: string): string {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalizeText(s)
    .split(" ")
    .filter(
      (t) =>
        t.length >= 3 &&
        !NOISE_TOKENS.has(t) &&
        !COMPANY_SUFFIX_TOKENS.has(t) &&
        !/^\d+$/.test(t),
    );
}

// ── CUIT extraction ───────────────────────────────────────────────────────────

function extractCuits(s: string): string[] {
  const matches = s.match(/\b(\d{2})[-.\s]?(\d{8})[-.\s]?(\d)\b/g) || [];
  return matches.map((m) => m.replace(/[-.\s]/g, ""));
}

// ── Signal scoring ────────────────────────────────────────────────────────────

function scoreAmount(
  txAbsAmount: number,
  inv: MatchInv,
): { score: number; isExact: boolean } {
  const total = inv.totalAmount;
  const net = inv.netAmount;

  // Exact total
  if (Math.abs(txAbsAmount - total) < 0.01) {
    return { score: 1.0, isExact: true };
  }

  // Net (pre-IVA) match — common when bank shows pre-tax amount
  if (net > 0 && net !== total && Math.abs(txAbsAmount - net) < 0.01) {
    return { score: 0.9, isExact: false };
  }

  if (total <= 0) return { score: 0, isExact: false };

  const diff = Math.abs(txAbsAmount - total);
  const pct = diff / total;

  if (pct < 0.001) return { score: 0.97, isExact: true };
  if (pct < 0.01) return { score: 0.85, isExact: false };
  if (pct < 0.05) return { score: 0.55, isExact: false };
  if (pct < 0.10) return { score: 0.30, isExact: false };

  return { score: 0, isExact: false };
}

function scoreDate(tx: MatchTx, inv: MatchInv): number {
  const txTime = tx.transactionDate.getTime();
  const issue = inv.issueDate.getTime();
  const due = inv.dueDate.getTime();
  const day = 86_400_000;

  // Transaction more than 3 days before issue date is suspicious
  if (txTime < issue - 3 * day) return 0.10;

  // Distance to the closer of issue/due windows
  const fromDue = Math.abs(txTime - due) / day;
  const fromIssue = Math.abs(txTime - issue) / day;
  const dist = Math.min(fromDue, fromIssue);

  if (dist <= 3) return 1.0;
  if (dist <= 7) return 0.9;
  if (dist <= 15) return 0.75;
  if (dist <= 30) return 0.55;
  if (dist <= 60) return 0.30;

  return 0.10;
}

function scoreCounterparty(
  txTokens: Set<string>,
  txCuits: string[],
  inv: MatchInv,
): number {
  // CUIT match is the strongest possible signal
  const invCuit = inv.counterpartyCuit.replace(/[-.\s]/g, "");
  if (invCuit.length > 0 && txCuits.includes(invCuit)) return 1.0;

  const invTokens = tokenize(inv.counterpartyName);
  if (invTokens.length === 0 || txTokens.size === 0) return 0;

  let intersection = 0;
  for (let i = 0; i < invTokens.length; i++) {
    if (txTokens.has(invTokens[i])) intersection++;
  }
  const invTokenSize = new Set(invTokens).size;

  // Recall: how much of the invoice's name appears in the tx description
  const recall = invTokenSize > 0 ? intersection / invTokenSize : 0;

  if (recall >= 0.999) return 1.0;
  if (recall >= 0.75) return 0.90;
  if (recall >= 0.50) return 0.65;
  if (recall >= 0.30) return 0.40;
  if (recall > 0) return 0.20;
  return 0;
}

function scoreReference(txDigits: string, inv: MatchInv): number {
  const invDigits = inv.invoiceNumber.replace(/\D/g, "");
  if (invDigits.length < 4 || txDigits.length < 4) return 0;

  // Full digit sequence
  if (txDigits.includes(invDigits)) return 1.0;

  // Last 6 (the proper invoice number, ignoring point of sale)
  if (invDigits.length >= 6) {
    const tail6 = invDigits.slice(-6);
    if (txDigits.includes(tail6)) return 0.85;
  }

  // Last 5
  if (invDigits.length >= 5) {
    const tail5 = invDigits.slice(-5);
    if (txDigits.includes(tail5)) return 0.65;
  }

  // Last 4
  const tail4 = invDigits.slice(-4);
  if (txDigits.includes(tail4)) return 0.40;

  return 0;
}

function scoreDirection(tx: MatchTx, inv: MatchInv): number {
  // Reversal documents can go either way
  if (inv.type === "nota_credito" || inv.type === "nota_debito") return 1.0;

  // Hard expectations by category
  if (tx.aiCategory === "cobro_cliente") {
    return tx.type === "credit" ? 1.0 : 0.35;
  }
  if (tx.aiCategory === "pago_proveedor") {
    return tx.type === "debit" ? 1.0 : 0.35;
  }
  if (tx.aiCategory === "alquiler" || tx.aiCategory === "servicio") {
    return tx.type === "debit" ? 1.0 : 0.50;
  }

  // Lenient for ambiguous categories
  if (tx.aiCategory === "otros") return 0.85;

  return 0.65;
}

// ── Pair scoring ──────────────────────────────────────────────────────────────

function scorePair(
  tx: MatchTx,
  txCtx: { tokens: Set<string>; cuits: string[]; digits: string },
  inv: MatchInv,
): PairScore {
  const amt = scoreAmount(Math.abs(tx.amount), inv);
  const date = scoreDate(tx, inv);
  const cpty = scoreCounterparty(txCtx.tokens, txCtx.cuits, inv);
  const ref = scoreReference(txCtx.digits, inv);
  const dir = scoreDirection(tx, inv);

  const base =
    WEIGHTS.amount * amt.score +
    WEIGHTS.counterparty * cpty +
    WEIGHTS.date * date +
    WEIGHTS.reference * ref;

  const total = Math.min(1, base * dir);

  let matchType: MatchType = "partial";
  if (amt.isExact && (cpty >= 0.5 || ref >= 0.85)) matchType = "exact";
  else if (amt.isExact && date >= 0.75) matchType = "exact";

  return {
    signals: { amount: amt.score, date, counterparty: cpty, reference: ref, direction: dir },
    total,
    matchType,
  };
}

// ── Main entry: generateMatches ───────────────────────────────────────────────

export interface GenerateMatchesOptions {
  statementId: string;
  orgId: string;
  threshold?: number;
}

export interface GenerateMatchesResult {
  suggested: number;
  matchableTxs: number;
  totalCandidates: number;
  invoicesAvailable: number;
}

export async function generateMatches(
  opts: GenerateMatchesOptions,
): Promise<GenerateMatchesResult> {
  const threshold = opts.threshold ?? SUGGESTION_THRESHOLD;

  // 1. Load txs from this statement that aren't already confirmed
  const txs = await db.transaction.findMany({
    where: {
      statementId: opts.statementId,
      matchStatus: { not: "confirmed" },
    },
  });

  const matchableTxs = txs.filter(
    (tx) => !NON_MATCHABLE_CATEGORIES.has(tx.aiCategory),
  );

  if (matchableTxs.length === 0) {
    // Still clear stale suggestions
    await db.reconciliationMatch.deleteMany({
      where: { statementId: opts.statementId, status: "suggested" },
    });
    return { suggested: 0, matchableTxs: 0, totalCandidates: 0, invoicesAvailable: 0 };
  }

  // 2. Load all invoices for the org that aren't fully matched
  const invoices = await db.invoice.findMany({
    where: {
      orgId: opts.orgId,
      status: { in: ["pending", "partially_matched", "overdue"] },
    },
  });

  if (invoices.length === 0) {
    await db.reconciliationMatch.deleteMany({
      where: { statementId: opts.statementId, status: "suggested" },
    });
    return {
      suggested: 0,
      matchableTxs: matchableTxs.length,
      totalCandidates: 0,
      invoicesAvailable: 0,
    };
  }

  // 3. Convert Prisma Decimal → number once, build text contexts once per tx
  const txObjs: MatchTx[] = matchableTxs.map((tx) => ({
    id: tx.id,
    description: tx.description,
    amount: Number(tx.amount),
    type: tx.type,
    transactionDate: tx.transactionDate,
    aiCategory: tx.aiCategory,
  }));

  const invObjs: MatchInv[] = invoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    counterpartyName: inv.counterpartyName,
    counterpartyCuit: inv.counterpartyCuit,
    totalAmount: Number(inv.totalAmount),
    netAmount: Number(inv.netAmount),
    ivaAmount: Number(inv.ivaAmount),
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    type: inv.type,
  }));

  const txContexts = new Map<
    string,
    { tokens: Set<string>; cuits: string[]; digits: string }
  >();
  for (const tx of txObjs) {
    txContexts.set(tx.id, {
      tokens: new Set(tokenize(tx.description)),
      cuits: extractCuits(tx.description),
      digits: tx.description.replace(/\D/g, ""),
    });
  }

  // 4. Score every (tx, invoice) pair above threshold
  type Candidate = { txId: string; invId: string; score: PairScore };
  const candidates: Candidate[] = [];

  for (const tx of txObjs) {
    const ctx = txContexts.get(tx.id)!;
    for (const inv of invObjs) {
      const score = scorePair(tx, ctx, inv);
      if (score.total >= threshold) {
        candidates.push({ txId: tx.id, invId: inv.id, score });
      }
    }
  }

  candidates.sort((a, b) => b.score.total - a.score.total);

  // 5. Greedy bipartite assignment: each tx ↔ at most one invoice
  const usedTxs = new Set<string>();
  const usedInvs = new Set<string>();
  const assigned: Candidate[] = [];

  for (const c of candidates) {
    if (usedTxs.has(c.txId) || usedInvs.has(c.invId)) continue;
    assigned.push(c);
    usedTxs.add(c.txId);
    usedInvs.add(c.invId);
  }

  // 6. Replace existing 'suggested' matches; preserve 'confirmed' ones
  await db.reconciliationMatch.deleteMany({
    where: { statementId: opts.statementId, status: "suggested" },
  });

  if (assigned.length > 0) {
    // Keep only pairs that aren't already confirmed (defensive)
    const confirmedPairs = new Set(
      (
        await db.reconciliationMatch.findMany({
          where: {
            statementId: opts.statementId,
            status: "confirmed",
          },
          select: { transactionId: true, invoiceId: true },
        })
      ).map((m) => `${m.transactionId}:${m.invoiceId}`),
    );

    const toCreate = assigned.filter(
      (c) => !confirmedPairs.has(`${c.txId}:${c.invId}`),
    );

    if (toCreate.length > 0) {
      await db.reconciliationMatch.createMany({
        data: toCreate.map((c) => ({
          transactionId: c.txId,
          invoiceId: c.invId,
          statementId: opts.statementId,
          matchType: c.score.matchType,
          confidenceScore: Number(c.score.total.toFixed(4)),
          status: "suggested" as const,
        })),
        skipDuplicates: true,
      });

      // Flip transaction matchStatus to 'suggested' (only if currently unmatched)
      await db.transaction.updateMany({
        where: {
          id: { in: toCreate.map((c) => c.txId) },
          matchStatus: "unmatched",
        },
        data: { matchStatus: "suggested" },
      });
    }
  }

  // 7. Reset any tx that lost its suggestion back to unmatched
  const stillSuggestedIds = new Set(assigned.map((c) => c.txId));
  await db.transaction.updateMany({
    where: {
      statementId: opts.statementId,
      matchStatus: "suggested",
      id: { notIn: Array.from(stillSuggestedIds) },
    },
    data: { matchStatus: "unmatched" },
  });

  return {
    suggested: assigned.length,
    matchableTxs: matchableTxs.length,
    totalCandidates: candidates.length,
    invoicesAvailable: invoices.length,
  };
}

// Exposed for testing / debugging
export const __internals = {
  tokenize,
  normalizeText,
  extractCuits,
  scoreAmount,
  scoreDate,
  scoreCounterparty,
  scoreReference,
  scoreDirection,
  scorePair,
};
