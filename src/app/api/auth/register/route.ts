import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { fullName, email, password, companyName, cuit } = validation.data;

    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email" },
        { status: 409 }
      );
    }

    const existingOrg = await db.organization.findUnique({ where: { cuit } });
    if (existingOrg) {
      return NextResponse.json(
        { error: "Ya existe una organización con ese CUIT" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const organization = await db.organization.create({
      data: {
        name: companyName,
        cuit,
        fiscalCategory: "Responsable Inscripto",
      },
    });

    const user = await db.user.create({
      data: {
        name: fullName,
        email,
        password: hashedPassword,
        role: "admin",
        orgId: organization.id,
      },
    });

    return NextResponse.json(
      {
        message: "Cuenta creada exitosamente",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          orgId: user.orgId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
