import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { bankAccountSchema } from "@/lib/validators";

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
    const validation = bankAccountSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const account = await db.bankAccount.updateMany({
      where: { id: params.id, orgId: session.user.orgId },
      data: validation.data,
    });

    if (account.count === 0) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    const updated = await db.bankAccount.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[BANK_ACCOUNTS_PATCH_ID]", error);
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

    const account = await db.bankAccount.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
      include: {
        _count: { select: { statements: true } },
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Cuenta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error("[BANK_ACCOUNTS_GET_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
