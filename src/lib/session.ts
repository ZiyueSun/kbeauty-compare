import { cookies } from "next/headers";

export const SESSION_COOKIE = "kb_sid";

/** Reads the anonymous session id set by proxy.ts. Server Components only. */
export async function getSessionId(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}
