import { query } from "./db";
import { getServerSession } from "./server-session";

export type AdminUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  username?: string | null;
  role: "admin" | "superadmin";
};

const adminRoles = new Set(["admin", "superadmin"]);

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await getServerSession();
  const sessionUser = session?.user as ({ id?: string; name?: string | null; email?: string | null; username?: string | null; role?: string | null } & Record<string, unknown>) | undefined;

  if (!sessionUser?.id) return null;

  if (sessionUser.role && adminRoles.has(sessionUser.role)) {
    return {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      username: sessionUser.username,
      role: sessionUser.role as AdminUser["role"],
    };
  }

  const result = await query<{ role: string | null }>(`select role from "user" where id = $1`, [sessionUser.id]);
  const role = result.rows[0]?.role;
  if (!role || !adminRoles.has(role)) return null;

  return {
    id: sessionUser.id,
    name: sessionUser.name,
    email: sessionUser.email,
    username: sessionUser.username,
    role: role as AdminUser["role"],
  };
}
