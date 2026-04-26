import { createClient } from "@/lib/supabase/server";

interface AuditEntry {
  userId: string;
  userEmail?: string;
  action: "read" | "create" | "update" | "delete" | "login" | "logout";
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

export async function audit(entry: AuditEntry) {
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      user_email: entry.userEmail,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resourceId,
      details: entry.details,
      ip_address: entry.ip,
    });
  } catch {
    // audit failure should never break the app
  }
}
