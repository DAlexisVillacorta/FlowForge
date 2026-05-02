import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { generateMatches } from "@/server/services/matcher";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { statementId, threshold } = body as {
      statementId?: string;
      threshold?: number;
    };

    if (!statementId) {
      return NextResponse.json(
        { error: "statementId requerido" },
        { status: 400 },
      );
    }

    // Verify the statement belongs to the user's org
    const statement = await db.bankStatement.findFirst({
      where: {
        id: statementId,
        bankAccount: { orgId: session.user.orgId },
      },
      select: { id: true },
    });

    if (!statement) {
      return NextResponse.json(
        { error: "Extracto no encontrado" },
        { status: 404 },
      );
    }

    const result = await generateMatches({
      statementId,
      orgId: session.user.orgId,
      threshold: typeof threshold === "number" && threshold > 0 && threshold < 1 ? threshold : undefined,
    });

    if (result.suggested > 0) {
      await db.bankStatement.update({
        where: { id: statementId },
        data: { status: "reviewing" },
      });
    }

    return NextResponse.json({
      message: "Matcher ejecutado",
      ...result,
    });
  } catch (error) {
    console.error("[RECONCILIATION_RUN_POST]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
