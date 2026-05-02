export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { transactionUpdateSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const transaction = await db.transaction.findFirst({
      where: {
        id: params.id,
        statement: { bankAccount: { orgId: session.user.orgId } },
      },
      include: {
        statement: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
            bankAccount: { select: { bankName: true } },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            counterpartyName: true,
            totalAmount: true,
          },
        },
        matches: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                counterpartyName: true,
                totalAmount: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error("[TRANSACTIONS_GET_ID]", error);
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

    const transaction = await db.transaction.findFirst({
      where: {
        id: params.id,
        statement: { bankAccount: { orgId: session.user.orgId } },
      },
      include: {
        _count: { select: { matches: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    await db.reconciliationMatch.deleteMany({
      where: { transactionId: params.id },
    });

    await db.transaction.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Transacción eliminada" });
  } catch (error) {
    console.error("[TRANSACTIONS_DELETE_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await _req.json();
    const validation = transactionUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.updateMany({
      where: {
        id: params.id,
        statement: { bankAccount: { orgId: session.user.orgId } },
      },
      data: validation.data,
    });

    if (transaction.count === 0) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Transacción actualizada" });
  } catch (error) {
    console.error("[TRANSACTIONS_PATCH_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
