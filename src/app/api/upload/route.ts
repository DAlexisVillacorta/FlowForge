export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import path from "path";
import fs from "fs/promises";
import { parseStatement } from "@/server/services/statement-parser";
import { classifyTransactions, autoGenerateRules } from "@/server/services/classifier";
import { generateMatches } from "@/server/services/matcher";

const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || "10");
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";
const ALLOWED_EXTENSIONS = [".pdf", ".csv"];

async function saveFileLocally(buffer: Buffer, relativePath: string): Promise<string> {
  const absolutePath = path.resolve(process.cwd(), UPLOAD_DIR, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, buffer);
  return absolutePath;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bankAccountId = formData.get("bankAccountId") as string;
    const periodStart = formData.get("periodStart") as string;
    const periodEnd = formData.get("periodEnd") as string;

    if (!file || !bankAccountId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: file, bankAccountId, periodStart, periodEnd" },
        { status: 400 }
      );
    }

    const fileName = file.name;
    const extension = path.extname(fileName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const fileType: "pdf" | "csv" = extension === ".pdf" ? "pdf" : "csv";

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Archivo demasiado grande. Máximo: ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const bankAccount = await db.bankAccount.findFirst({
      where: { id: bankAccountId, orgId: session.user.orgId },
      include: { organization: true },
    });

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }

    const safeFileName = `${Date.now()}_${session.user.id}_${path.basename(fileName)}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const localPath = await saveFileLocally(fileBuffer, `statements/${safeFileName}`);

    const statement = await db.bankStatement.create({
      data: {
        bankAccountId,
        uploadedBy: session.user.id,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        filePath: localPath,
        fileType,
        status: "processing",
        closingBalance: 0,
        transactionCount: 0,
        matchedCount: 0,
      },
    });

    try {
      const parsed = await parseStatement(localPath, fileType, bankAccount.bankName);
      console.log(`[UPLOAD PARSE OK] bankName="${bankAccount.bankName}" transactions=${parsed.transactions.length} first=${JSON.stringify(parsed.transactions[0])}`);

      const classifications = await classifyTransactions(
        parsed.transactions.map((t) => ({ description: t.description, amount: t.amount, type: t.type })),
        session.user.orgId
      );

      const createdTransactions = await Promise.all(
        parsed.transactions.map(async (tx, i) => {
          const classification = classifications[i];
          return db.transaction.create({
            data: {
              statementId: statement.id,
              transactionDate: tx.date,
              description: tx.description,
              amount: tx.amount,
              type: tx.type,
              aiCategory: classification.category,
              aiConfidence: classification.confidence,
              matchStatus: "unmatched",
            },
          });
        })
      );

      await db.bankStatement.update({
        where: { id: statement.id },
        data: {
          status: "classified",
          closingBalance: parsed.closingBalance,
          transactionCount: createdTransactions.length,
          periodStart: parsed.periodStart,
          periodEnd: parsed.periodEnd,
        },
      });

      await autoGenerateRules(
        createdTransactions.map((tx) => ({
          description: tx.description,
          category: tx.aiCategory,
        })),
        session.user.orgId,
        session.user.id
      );

      // Run AI reconciliation matcher — pairs transactions ↔ pending invoices
      let matcherResult = { suggested: 0, matchableTxs: 0, totalCandidates: 0, invoicesAvailable: 0 };
      try {
        matcherResult = await generateMatches({
          statementId: statement.id,
          orgId: session.user.orgId,
        });
        if (matcherResult.suggested > 0) {
          await db.bankStatement.update({
            where: { id: statement.id },
            data: { status: "reviewing" },
          });
        }
      } catch (matcherError) {
        console.error("[UPLOAD MATCHER ERROR]", matcherError);
      }

      return NextResponse.json({
        message: "Extracto procesado exitosamente",
        statement: {
          id: statement.id,
          transactionCount: createdTransactions.length,
          status: matcherResult.suggested > 0 ? "reviewing" : "classified",
        },
        transactions: createdTransactions.length,
        rulesGenerated: Math.min(createdTransactions.length, 10),
        matchesSuggested: matcherResult.suggested,
        invoicesAvailable: matcherResult.invoicesAvailable,
      });
    } catch (parseError) {
      console.error("[UPLOAD PARSE ERROR]", parseError);

      await db.bankStatement.update({
        where: { id: statement.id },
        data: { status: "processing" },
      });

      return NextResponse.json(
        {
          error: "Error al procesar el archivo. El extracto fue guardado para procesamiento manual.",
          statementId: statement.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[UPLOAD_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
