import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { matchUpdateSchema } from "@/lib/validators";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validation = matchUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const match = await db.reconciliationMatch.findFirst({
      where: {
        id: params.id,
        bankStatement: { bankAccount: { orgId: session.user.orgId } },
      },
      include: {
        invoice: { select: { totalAmount: true } },
        transaction: { select: { amount: true } },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match no encontrado" },
        { status: 404 }
      );
    }

    const newStatus = validation.data.status;

    await db.reconciliationMatch.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...(newStatus === "confirmed" && { confirmedById: session.user.id }),
      },
    });

    // Cascade: keep transaction.matchStatus and invoice.status in sync
    if (newStatus === "confirmed") {
      await db.transaction.update({
        where: { id: match.transactionId },
        data: {
          matchStatus: "confirmed",
          matchedInvoiceId: match.invoiceId,
        },
      });

      const txAbs = Math.abs(Number(match.transaction.amount));
      const invTotal = Number(match.invoice.totalAmount);
      const invStatus = Math.abs(txAbs - invTotal) < 0.01 ? "matched" : "partially_matched";

      await db.invoice.update({
        where: { id: match.invoiceId },
        data: { status: invStatus },
      });

      // Bump statement.matchedCount based on confirmed matches
      const confirmedCount = await db.reconciliationMatch.count({
        where: { statementId: match.statementId, status: "confirmed" },
      });
      await db.bankStatement.update({
        where: { id: match.statementId },
        data: { matchedCount: confirmedCount },
      });
    } else if (newStatus === "rejected") {
      // Free the tx so the user can pick another invoice
      await db.transaction.update({
        where: { id: match.transactionId },
        data: { matchStatus: "unmatched", matchedInvoiceId: null },
      });
    }

    return NextResponse.json({ message: "Match actualizado", id: params.id, status: newStatus });
  } catch (error) {
    console.error("[RECONCILIATION_PATCH_ID]", error);
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

    const match = await db.reconciliationMatch.findFirst({
      where: {
        id: params.id,
        bankStatement: { bankAccount: { orgId: session.user.orgId } },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match no encontrado" },
        { status: 404 }
      );
    }

    const wasConfirmed = match.status === "confirmed";

    await db.reconciliationMatch.delete({
      where: { id: params.id },
    });

    if (match.transactionId) {
      await db.transaction.updateMany({
        where: { id: match.transactionId },
        data: { matchStatus: "unmatched", matchedInvoiceId: null },
      });
    }

    if (wasConfirmed) {
      // Revert invoice status if no other confirmed matches remain
      const remainingConfirmed = await db.reconciliationMatch.count({
        where: { invoiceId: match.invoiceId, status: "confirmed" },
      });
      if (remainingConfirmed === 0) {
        await db.invoice.update({
          where: { id: match.invoiceId },
          data: { status: "pending" },
        });
      }

      // Recompute statement.matchedCount
      const confirmedCount = await db.reconciliationMatch.count({
        where: { statementId: match.statementId, status: "confirmed" },
      });
      await db.bankStatement.update({
        where: { id: match.statementId },
        data: { matchedCount: confirmedCount },
      });
    }

    return NextResponse.json({ message: "Match eliminado" });
  } catch (error) {
    console.error("[RECONCILIATION_DELETE_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const match = await db.reconciliationMatch.findFirst({
      where: {
        id: params.id,
        bankStatement: { bankAccount: { orgId: session.user.orgId } },
      },
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            transactionDate: true,
            aiCategory: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            counterpartyName: true,
            totalAmount: true,
            dueDate: true,
          },
        },
        confirmedBy: { select: { name: true } },
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: "Match no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(match);
  } catch (error) {
    console.error("[RECONCILIATION_GET_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
