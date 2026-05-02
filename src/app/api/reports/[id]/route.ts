export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const report = await db.report.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
      include: {
        bankStatement: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            closingBalance: true,
            transactionCount: true,
            matchedCount: true,
            bankAccount: { select: { bankName: true, currency: true } },
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Reporte no encontrado" }, { status: 404 });
    }

    // Load all transactions for this statement
    const transactions = await db.transaction.findMany({
      where: { statementId: report.statementId },
      orderBy: { transactionDate: "asc" },
      include: {
        invoice: {
          select: { invoiceNumber: true, counterpartyName: true, totalAmount: true },
        },
      },
    });

    // Reconciliation matches with related invoice info — used for observations
    const matches = await db.reconciliationMatch.findMany({
      where: { statementId: report.statementId },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            counterpartyName: true,
            totalAmount: true,
            type: true,
            status: true,
            dueDate: true,
          },
        },
        transaction: {
          select: { id: true, amount: true, description: true },
        },
      },
    });

    // Overdue / unapplied invoices in the org (for observations panel)
    const overdueInvoices = await db.invoice.findMany({
      where: {
        orgId: session.user.orgId,
        status: "overdue",
      },
      select: {
        id: true,
        invoiceNumber: true,
        counterpartyName: true,
        totalAmount: true,
        dueDate: true,
        type: true,
        status: true,
      },
    });

    return NextResponse.json({
      report: {
        id: report.id,
        reportType: report.reportType,
        filePath: report.filePath,
        generatedAt: report.generatedAt,
        totals: {
          totalIncome: Number(report.totalIncome),
          totalExpense: Number(report.totalExpense),
          matched: report.matchedTransactions,
          unmatched: report.unmatchedTransactions,
          pendingReview: report.pendingReview,
        },
      },
      statement: report.bankStatement
        ? {
            id: report.bankStatement.id,
            periodStart: report.bankStatement.periodStart,
            periodEnd: report.bankStatement.periodEnd,
            closingBalance: Number(report.bankStatement.closingBalance),
            transactionCount: report.bankStatement.transactionCount,
            matchedCount: report.bankStatement.matchedCount,
            bankName: report.bankStatement.bankAccount?.bankName ?? "",
            currency: report.bankStatement.bankAccount?.currency ?? "ARS",
          }
        : null,
      transactions: transactions.map((tx) => ({
        id: tx.id,
        transactionDate: tx.transactionDate,
        description: tx.description,
        amount: Number(tx.amount),
        type: tx.type,
        aiCategory: tx.aiCategory,
        userCategory: tx.userCategory,
        aiConfidence: tx.aiConfidence,
        matchStatus: tx.matchStatus,
        matchedInvoiceId: tx.matchedInvoiceId,
        invoice: tx.invoice
          ? {
              invoiceNumber: tx.invoice.invoiceNumber,
              counterpartyName: tx.invoice.counterpartyName,
              totalAmount: Number(tx.invoice.totalAmount),
            }
          : null,
      })),
      matches: matches.map((m) => ({
        id: m.id,
        transactionId: m.transactionId,
        invoiceId: m.invoiceId,
        confidenceScore: m.confidenceScore,
        matchType: m.matchType,
        status: m.status,
        invoice: m.invoice
          ? {
              ...m.invoice,
              totalAmount: Number(m.invoice.totalAmount),
            }
          : null,
        transaction: m.transaction
          ? {
              ...m.transaction,
              amount: Number(m.transaction.amount),
            }
          : null,
      })),
      overdueInvoices: overdueInvoices.map((inv) => ({
        ...inv,
        totalAmount: Number(inv.totalAmount),
      })),
    });
  } catch (error) {
    console.error("[REPORTS_GET_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const report = await db.report.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    await db.report.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Reporte eliminado" });
  } catch (error) {
    console.error("[REPORTS_DELETE_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
