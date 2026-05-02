import { db } from "@/lib/db";
import type { TransactionCategory } from "@prisma/client";

const KEYWORD_RULES: Record<string, RegExp> = {
  // Impuestos y retenciones bancarias argentinas — van primero (más específicas)
  "retencion": /ley\s*25[.\s]?413|impuesto\s*(al\s*)?(débito|debito|crédito|credito)|retencion|iva\s*retencion|ganancias\s*retencion|ret\.\s*gan/i,
  "percepcion": /percepci[oó]n\s*iibb|iibb[\s\-]*s\/|percepci[oó]n\s*iva|iibb\s*perc/i,
  "iva": /\bi\.?v\.?a\.?\b|impuesto\s*al\s*valor\s*agregado/i,
  "impuesto": /afip|arba|impuesto(?!\s*(al\s*)?(déb|deb|cré|cre))|ganancia[s]?\s*(impuesto)?|ingresos\s*brutos|\biibb\b(?!\s*[\-\/])/i,

  // Comisiones y gastos bancarios
  "comision_bancaria": /comis\.|comision|mantenimiento\s*de\s*cuenta|costo\s*mantenimiento|cargo\s*bancario|gastos?\s*de\s*cuenta|cargo\s*por/i,

  // Transferencias internas, entre cuentas propias, FCI
  "transferencia_interna": /entre\s*cuentas|transf\.?\s*entre|transferencia\s*interna|trsf\s*propia|suscripci[oó]n.*f\.?c\.?i|debito\s*suscripci[oó]n|rescate.*f\.?c\.?i|credito\s*rescate|mep\s*(recibida|enviada|mismo)/i,

  // Servicios públicos y suscripciones — va ANTES de pago_proveedor para que compra+servicio clasifique como servicio
  "servicio": /luz\b|gas\b|agua\b|telef[oó]nica|internet|edenor|metro[g]?as|aysa|gsuite|google[\s_]*(workspace|cloud|gsuite)|microsoft[\s*_]|spotify|netflix|amazon/i,

  // Pagos a proveedores y tarjetas
  "pago_proveedor": /compra\s*tarjeta|pago\s*tarjeta|debito\s*tarjeta|d[eé]bito\s*autom[aá]tico|pago\s*de\s*servicios|pago\s*a\s*proveedor|compra\b|factura\s*de\s*compra/i,

  // Cobros de clientes
  "cobro_cliente": /cobro\s*cliente|factura\s*de\s*venta|ingreso\s*por\s*venta|cr[eé]dito\s*transf|transferencia\s*cr[eé]dito(?!\s*(interna|entre))/i,

  // Salarios
  "salario": /sueldo|salario|jornal|haberes|liquidaci[oó]n\s*(de\s*)?(sueldo|salario)/i,

  // Alquiler
  "alquiler": /alquiler|renta\b|locaci[oó]n/i,
};

interface ClassificationResult {
  category: TransactionCategory;
  confidence: number;
  source: "rule_match" | "keyword_match" | "default";
}

export async function classifyTransaction(
  description: string,
  amount: number,
  orgId?: string,
  type?: "credit" | "debit"
): Promise<ClassificationResult> {
  if (orgId) {
    const ruleMatch = await matchClassificationRule(description, orgId);
    if (ruleMatch) {
      return ruleMatch;
    }
  }

  const keywordMatch = matchKeywords(description);
  if (keywordMatch) {
    return keywordMatch;
  }

  const defaultCategory: TransactionCategory =
    type === "credit" ? "cobro_cliente" : type === "debit" ? "pago_proveedor" : "otros";

  return {
    category: defaultCategory,
    confidence: 0.3,
    source: "default",
  };
}

async function matchClassificationRule(
  description: string,
  orgId: string
): Promise<ClassificationResult | null> {
  try {
    const rules = await db.classificationRule.findMany({
      where: { orgId },
      orderBy: { timesApplied: "desc" },
    });

    for (const rule of rules) {
      try {
        const regex = new RegExp(rule.pattern, "i");
        if (regex.test(description)) {
          await db.classificationRule.update({
            where: { id: rule.id },
            data: { timesApplied: { increment: 1 } },
          });

          return {
            category: rule.category as TransactionCategory,
            confidence: 0.9,
            source: "rule_match",
          };
        }
      } catch {
        continue;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function matchKeywords(description: string): ClassificationResult | null {
  for (const [category, pattern] of Object.entries(KEYWORD_RULES)) {
    if (pattern.test(description)) {
      return {
        category: category as TransactionCategory,
        confidence: 0.75,
        source: "keyword_match",
      };
    }
  }
  return null;
}

export async function classifyTransactions(
  transactions: Array<{ description: string; amount: number; type?: "credit" | "debit" }>,
  orgId?: string
): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = [];
  for (const tx of transactions) {
    const result = await classifyTransaction(tx.description, tx.amount, orgId, tx.type);
    results.push(result);
  }
  return results;
}

export async function autoGenerateRules(
  transactions: Array<{ description: string; category: string }>,
  orgId: string,
  createdBy: string
): Promise<number> {
  const patterns: Array<{ pattern: string; category: string }> = [];

  const byCategory = new Map<string, string[]>();
  for (const tx of transactions) {
    if (!byCategory.has(tx.category)) {
      byCategory.set(tx.category, []);
    }
    byCategory.get(tx.category)!.push(tx.description);
  }

  for (const [category, descriptions] of Array.from(byCategory.entries())) {
    if (descriptions.length < 2) continue;

    const words = descriptions.flatMap((d: string) => d.toLowerCase().split(/\s+/));
    const frequency = new Map<string, number>();
    for (const word of words) {
      if (word.length > 3) {
        frequency.set(word, (frequency.get(word) || 0) + 1);
      }
    }

    const commonWords = Array.from(frequency.entries())
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    if (commonWords.length > 0) {
      patterns.push({
        pattern: commonWords.join("|"),
        category,
      });
    }
  }

  let created = 0;
  for (const { pattern, category } of patterns) {
    const existing = await db.classificationRule.findFirst({
      where: { orgId, pattern },
    });
    if (!existing) {
      await db.classificationRule.create({
        data: {
          orgId,
          createdBy,
          pattern,
          category: category as TransactionCategory,
          source: "ai_generated",
        },
      });
      created++;
    }
  }

  return created;
}
