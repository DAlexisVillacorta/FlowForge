export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { reportSchema } from "@/lib/validators";
import { generateReport } from "@/server/services/report-generator";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("reportType");
    const statementId = searchParams.get("statementId");

    const where: Record<string, unknown> = { orgId: session.user.orgId };
    if (reportType) where.reportType = reportType;
    if (statementId) where.statementId = statementId;

    const reports = await db.report.findMany({
      where,
      include: {
        bankStatement: {
          select: {
            periodStart: true,
            periodEnd: true,
            bankAccount: { select: { bankName: true } },
          },
        },
      },
      orderBy: { generatedAt: "desc" },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("[REPORTS_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reportType, period, format } = validation.data;
    const statementId = body.statementId as string | undefined;

    if (!statementId) {
      const latestStatement = await db.bankStatement.findFirst({
        where: { bankAccount: { orgId: session.user.orgId } },
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });

      if (!latestStatement) {
        return NextResponse.json(
          { error: "No hay extractos bancarios disponibles" },
          { status: 400 }
        );
      }

      const report = await db.report.create({
        data: {
          orgId: session.user.orgId,
          statementId: latestStatement.id,
          reportType,
          totalIncome: 0,
          totalExpense: 0,
          matchedTransactions: 0,
          unmatchedTransactions: 0,
          pendingReview: 0,
          generatedBy: session.user.id,
        },
      });

      return NextResponse.json(report, { status: 201 });
    }

    const statement = await db.bankStatement.findFirst({
      where: { id: statementId, bankAccount: { orgId: session.user.orgId } },
      include: {
        transactions: true,
        bankAccount: { select: { bankName: true, currency: true } },
      },
    });

    if (!statement) {
      return NextResponse.json(
        { error: "Extracto bancario no encontrado" },
        { status: 404 }
      );
    }

    const [totalIncome, totalExpense, matchedCount, unmatchedCount, pendingCount] =
      await Promise.all([
        db.transaction
          .aggregate({
            where: {
              statementId,
              type: "credit",
            },
            _sum: { amount: true },
          })
          .then((r) => Math.abs(r._sum.amount?.toNumber() ?? 0)),
        db.transaction
          .aggregate({
            where: {
              statementId,
              type: "debit",
            },
            _sum: { amount: true },
          })
          .then((r) => Math.abs(r._sum.amount?.toNumber() ?? 0)),
        db.transaction.count({
          where: {
            statementId,
            matchStatus: "confirmed",
          },
        }),
        db.transaction.count({
          where: {
            statementId,
            matchStatus: "unmatched",
          },
        }),
        db.transaction.count({
          where: {
            statementId,
            matchStatus: "suggested",
          },
        }),
      ]);

    const { filePath, fileName } = await generateReport({
      orgId: session.user.orgId,
      statementId,
      reportType,
      format,
      period: period || `${statement.periodStart.toISOString().slice(0, 7)}`,
    });

    const report = await db.report.create({
      data: {
        orgId: session.user.orgId,
        statementId,
        reportType,
        filePath,
        totalIncome,
        totalExpense,
        matchedTransactions: matchedCount,
        unmatchedTransactions: unmatchedCount,
        pendingReview: pendingCount,
        generatedBy: session.user.id,
      },
    });

    return NextResponse.json({ ...report, fileName }, { status: 201 });
  } catch (error) {
    console.error("[REPORTS_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
