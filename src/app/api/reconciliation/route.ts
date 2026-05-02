export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { matchSchema, matchUpdateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const statementId = searchParams.get("statementId");

    const where: Record<string, unknown> = {
      bankStatement: { bankAccount: { orgId: session.user.orgId } },
    };

    if (status) where.status = status;
    if (statementId) where.statementId = statementId;

    const matches = await db.reconciliationMatch.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            description: true,
            amount: true,
            transactionDate: true,
            aiConfidence: true,
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
      orderBy: { createdAt: "desc" },
    });

    const summary = await db.reconciliationMatch.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    return NextResponse.json({ matches, summary });
  } catch (error) {
    console.error("[RECONCILIATION_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validation = matchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { transactionId, invoiceId, matchType } = validation.data;

    const transaction = await db.transaction.findFirst({
      where: {
        id: transactionId,
        statement: { bankAccount: { orgId: session.user.orgId } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    const match = await db.reconciliationMatch.create({
      data: {
        transactionId,
        invoiceId,
        matchType,
        statementId: transaction.statementId,
        confidenceScore: 0.8,
        status: "suggested",
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("[RECONCILIATION_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;
    const validation = matchUpdateSchema.safeParse(updates);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const match = await db.reconciliationMatch.updateMany({
      where: {
        id,
        bankStatement: { bankAccount: { orgId: session.user.orgId } },
      },
      data: {
        ...updates,
        ...(updates.status === "confirmed" && { confirmedById: session.user.id }),
      },
    });

    if (match.count === 0) {
      return NextResponse.json(
        { error: "Match no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Match actualizado" });
  } catch (error) {
    console.error("[RECONCILIATION_PATCH]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
