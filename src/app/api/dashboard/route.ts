import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const orgId = session.user.orgId;

    const [
      totalTransactions,
      matchedTransactions,
      pendingReview,
      totalInvoices,
      totalBankAccounts,
      recentStatements,
      recentActivity,
      monthlyTrends,
      categoryBreakdown,
    ] = await Promise.all([
      db.transaction.count({
        where: { statement: { bankAccount: { orgId } } },
      }),
      db.transaction.count({
        where: {
          matchStatus: "confirmed",
          statement: { bankAccount: { orgId } },
        },
      }),
      db.transaction.count({
        where: {
          matchStatus: "suggested",
          statement: { bankAccount: { orgId } },
        },
      }),
      db.invoice.count({ where: { orgId } }),
      db.bankAccount.count({ where: { orgId } }),
      db.bankStatement.findMany({
        where: { bankAccount: { orgId } },
        include: {
          bankAccount: { select: { bankName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      db.reconciliationMatch.findMany({
        where: { bankStatement: { bankAccount: { orgId } } },
        include: {
          transaction: { select: { description: true } },
          invoice: { select: { counterpartyName: true, totalAmount: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.transaction.groupBy({
        by: ["transactionDate"],
        where: { statement: { bankAccount: { orgId } } },
        _sum: { amount: true },
        _count: true,
        orderBy: { transactionDate: "desc" },
        take: 6,
      }),
      db.transaction.groupBy({
        by: ["aiCategory"],
        where: {
          type: "debit",
          statement: { bankAccount: { orgId } },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const aiAccuracy =
      totalTransactions > 0
        ? Math.round((matchedTransactions / totalTransactions) * 100 * 10) / 10
        : 0;

    return NextResponse.json({
      stats: {
        totalProcessed: totalTransactions,
        aiAccuracy,
        timeSaved: Math.round((totalTransactions * 0.14) * 10) / 10,
        pendingReview,
      },
      summary: {
        totalInvoices,
        totalBankAccounts,
        matchedTransactions,
      },
      recentStatements,
      recentActivity: recentActivity.map((m) => ({
        id: m.id,
        type: m.status === "confirmed" ? "match_confirmed" : "match_suggested",
        description: `${m.invoice.counterpartyName} → ${m.transaction.description.substring(0, 40)}...`,
        timestamp: m.createdAt,
        meta: { amount: m.invoice.totalAmount },
      })),
      monthlyTrends: monthlyTrends.map((t) => ({
        month: t.transactionDate.toISOString().slice(0, 7),
        income: t._sum.amount?.toNumber() ?? 0,
        matched: t._count,
        total: t._count,
      })),
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.aiCategory,
        amount: Math.abs(c._sum.amount?.toNumber() ?? 0),
        count: c._count,
        percentage: 0,
      })),
    });
  } catch (error) {
    console.error("[DASHBOARD_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
