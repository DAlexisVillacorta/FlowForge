import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import fs from "fs/promises";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const statement = await db.bankStatement.findFirst({
      where: {
        id: params.id,
        bankAccount: { orgId: session.user.orgId },
      },
      include: {
        bankAccount: {
          select: { bankName: true, currency: true, accountNumber: true },
        },
        transactions: {
          orderBy: { transactionDate: "desc" },
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
        _count: { select: { transactions: true, matches: true } },
      },
    });

    if (!statement) {
      return NextResponse.json(
        { error: "Extracto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(statement);
  } catch (error) {
    console.error("[STATEMENTS_GET_ID]", error);
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
    const { status, closingBalance } = body;

    const validStatuses = ["processing", "classified", "reviewing", "reconciled", "completed"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (closingBalance !== undefined) updates.closingBalance = closingBalance;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No hay datos para actualizar" },
        { status: 400 }
      );
    }

    const statement = await db.bankStatement.updateMany({
      where: {
        id: params.id,
        bankAccount: { orgId: session.user.orgId },
      },
      data: updates,
    });

    if (statement.count === 0) {
      return NextResponse.json(
        { error: "Extracto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Extracto actualizado" });
  } catch (error) {
    console.error("[STATEMENTS_PATCH_ID]", error);
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

    const statement = await db.bankStatement.findFirst({
      where: {
        id: params.id,
        bankAccount: { orgId: session.user.orgId },
      },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!statement) {
      return NextResponse.json(
        { error: "Extracto no encontrado" },
        { status: 404 }
      );
    }

    await db.transaction.deleteMany({
      where: { statementId: params.id },
    });

    await db.reconciliationMatch.deleteMany({
      where: { statementId: params.id },
    });

    await db.report.deleteMany({
      where: { statementId: params.id },
    });

    const filePath = statement.filePath;

    await db.bankStatement.delete({
      where: { id: params.id },
    });

    if (filePath) {
      await fs.unlink(filePath).catch(() => {});
    }

    return NextResponse.json({ message: "Extracto eliminado" });
  } catch (error) {
    console.error("[STATEMENTS_DELETE_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
