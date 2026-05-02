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

    const report = await db.report.findFirst({
      where: { id: params.id, orgId: session.user.orgId },
    });

    if (!report || !report.filePath) {
      return NextResponse.json(
        { error: "Reporte no encontrado o sin archivo" },
        { status: 404 }
      );
    }

    const filePath = report.filePath;
    let fileBuffer: ArrayBuffer | Uint8Array;

    if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
      // Remote (Vercel Blob) — fetch the public URL
      const res = await fetch(filePath);
      if (!res.ok) {
        return NextResponse.json(
          { error: "No se pudo descargar el archivo remoto" },
          { status: 502 }
        );
      }
      fileBuffer = await res.arrayBuffer();
    } else {
      // Local filesystem
      try {
        fileBuffer = await fs.readFile(filePath);
      } catch {
        return NextResponse.json(
          { error: "Archivo del reporte no encontrado en el servidor" },
          { status: 404 }
        );
      }
    }

    const ext = filePath.split(".").pop()?.toLowerCase();
    const contentType = ext === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    return new NextResponse(fileBuffer as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="FlowForge_${report.reportType}.${ext}"`,
      },
    });
  } catch (error) {
    console.error("[REPORT_DOWNLOAD_GET]", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
