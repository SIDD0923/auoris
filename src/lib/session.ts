import { auth } from "./auth";
import { headers } from "next/headers";

/** Get the current session on the server side (App Router) */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}
