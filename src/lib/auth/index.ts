import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const { db } = await import("@/lib/db");

  return await db.user.findUnique({
    where: { id: session.user.id as string },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      orgId: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
}

export { authOptions };
