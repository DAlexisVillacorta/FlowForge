export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { transactionBulkUpdateSchema, transactionUpdateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statementId = searchParams.get("statementId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {
      statement: { bankAccount: { orgId: session.user.orgId } },
    };

    if (statementId) where.statementId = statementId;
    if (status) where.matchStatus = status;
    if (category) {
      where.OR = [
        { aiCategory: category },
        { userCategory: category },
      ];
    }
    if (search) {
      where.description = { contains: search, mode: "insensitive" };
    }

    // When fetching a specific statement load all its transactions (no pagination needed)
    const isPaginatedRequest = !statementId;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          invoice: { select: { invoiceNumber: true, counterpartyName: true, totalAmount: true } },
        },
        orderBy: { transactionDate: "desc" },
        ...(isPaginatedRequest ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[TRANSACTIONS_GET]", error);
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

    if (body.ids && Array.isArray(body.ids)) {
      const validation = transactionBulkUpdateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Datos inválidos", details: validation.error.issues },
          { status: 400 }
        );
      }

      await db.transaction.updateMany({
        where: {
          id: { in: body.ids },
          statement: { bankAccount: { orgId: session.user.orgId } },
        },
        data: body.updates,
      });

      return NextResponse.json({ message: "Transacciones actualizadas" });
    }

    const { id, ...updates } = body;
    const validation = transactionUpdateSchema.safeParse(updates);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const transaction = await db.transaction.updateMany({
      where: {
        id,
        statement: { bankAccount: { orgId: session.user.orgId } },
      },
      data: updates,
    });

    if (transaction.count === 0) {
      return NextResponse.json(
        { error: "Transacción no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Transacción actualizada" });
  } catch (error) {
    console.error("[TRANSACTIONS_PATCH]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
