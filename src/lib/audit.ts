import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

/** Best-effort append-only audit event. Audit failure never rolls back the user's primary action. */
export async function recordAuditEvent(
  action: string,
  entityType: string,
  entityId: string | null,
  summary: string,
  details: Json = {},
): Promise<void> {
  try {
    const { error } = await supabase.rpc("record_sto_audit_event", {
      p_action: action,
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_summary: summary,
      p_details: details,
    });
    if (error) console.warn("Fleet audit log write failed:", error.message);
  } catch (error) {
    console.warn("Fleet audit log write failed:", error);
  }
}
