export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { statementSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const bankAccountId = searchParams.get("bankAccountId");

    const where: Record<string, unknown> = {
      bankAccount: { orgId: session.user.orgId },
    };

    if (status) where.status = status;
    if (bankAccountId) where.bankAccountId = bankAccountId;

    const statements = await db.bankStatement.findMany({
      where,
      include: {
        bankAccount: { select: { bankName: true, currency: true } },
        _count: { select: { transactions: true } },
      },
      orderBy: { periodEnd: "desc" },
    });

    return NextResponse.json(statements);
  } catch (error) {
    console.error("[STATEMENTS_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validation = statementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { bankAccountId, periodStart, periodEnd, fileType } = validation.data;

    const bankAccount = await db.bankAccount.findFirst({
      where: { id: bankAccountId, orgId: session.user.orgId },
    });

    if (!bankAccount) {
      return NextResponse.json(
        { error: "Cuenta bancaria no encontrada" },
        { status: 404 }
      );
    }

    const statement = await db.bankStatement.create({
      data: {
        bankAccountId,
        uploadedBy: session.user.id,
        periodStart,
        periodEnd,
        fileType,
        status: "processing",
        closingBalance: 0,
        transactionCount: 0,
        matchedCount: 0,
      },
    });

    return NextResponse.json(statement, { status: 201 });
  } catch (error) {
    console.error("[STATEMENTS_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
