import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { invoiceUpdateSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const invoice = await db.invoice.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
      include: {
        _count: { select: { transactions: true } },
        transactions: {
          select: {
            id: true,
            description: true,
            amount: true,
            transactionDate: true,
            matchStatus: true,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("[INVOICES_GET_ID]", error);
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

    const invoice = await db.invoice.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
      include: {
        _count: { select: { transactions: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    if (invoice._count.transactions > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una factura con transacciones asociadas" },
        { status: 400 }
      );
    }

    await db.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Factura eliminada" });
  } catch (error) {
    console.error("[INVOICES_DELETE_ID]", error);
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
    const validation = invoiceUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const invoice = await db.invoice.updateMany({
      where: { id: params.id, orgId: session.user.orgId },
      data: validation.data,
    });

    if (invoice.count === 0) {
      return NextResponse.json(
        { error: "Factura no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Factura actualizada" });
  } catch (error) {
    console.error("[INVOICES_PATCH_ID]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
