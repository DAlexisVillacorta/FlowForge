export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { z } from "zod";

const orgUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d$/, "CUIT inválido").optional(),
  fiscalCategory: z.string().min(1).max(50).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const org = await db.organization.findUnique({
      where: { id: session.user.orgId },
      include: {
        _count: {
          select: {
            users: true,
            bankAccounts: true,
            invoices: true,
            rules: true,
          },
        },
      },
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organización no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(org);
  } catch (error) {
    console.error("[ORGANIZATION_GET]", error);
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

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Solo administradores pueden modificar la organización" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = orgUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { cuit, ...updates } = validation.data;

    if (cuit) {
      const existing = await db.organization.findUnique({
        where: { cuit },
      });
      if (existing && existing.id !== session.user.orgId) {
        return NextResponse.json(
          { error: "CUIT ya en uso por otra organización" },
          { status: 409 }
        );
      }
    }

    const dataToUpdate: Record<string, unknown> = { ...updates };
    if (cuit) dataToUpdate.cuit = cuit;

    const updated = await db.organization.update({
      where: { id: session.user.orgId },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ORGANIZATION_PATCH]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
