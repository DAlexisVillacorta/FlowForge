import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { ruleSchema } from "@/lib/validators";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const rules = await db.classificationRule.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { timesApplied: "desc" },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error("[RULES_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validation = ruleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const rule = await db.classificationRule.create({
      data: {
        ...validation.data,
        orgId: session.user.orgId,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error("[RULES_POST]", error);
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

    const rule = await db.classificationRule.updateMany({
      where: { id, orgId: session.user.orgId },
      data: updates,
    });

    if (rule.count === 0) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Regla actualizada" });
  } catch (error) {
    console.error("[RULES_PATCH]", error);
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

    const rule = await db.classificationRule.deleteMany({
      where: { id: params.id, orgId: session.user.orgId },
    });

    if (rule.count === 0) {
      return NextResponse.json(
        { error: "Regla no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Regla eliminada" });
  } catch (error) {
    console.error("[RULES_DELETE]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
