export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            cuit: true,
            fiscalCategory: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const validation = profileUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { name, avatarUrl, currentPassword, newPassword } = validation.data;
    const updates: Record<string, unknown> = {};

    if (name) updates.name = name;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    if (currentPassword && newPassword) {
      const user = await db.user.findUnique({
        where: { id: session.user.id },
      });

      if (!user || !user.password) {
        return NextResponse.json(
          { error: "No se puede cambiar la contraseña sin contraseña actual" },
          { status: 400 }
        );
      }

      const isCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!isCorrect) {
        return NextResponse.json(
          { error: "Contraseña actual incorrecta" },
          { status: 400 }
        );
      }

      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await db.user.update({
      where: { id: session.user.id },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
