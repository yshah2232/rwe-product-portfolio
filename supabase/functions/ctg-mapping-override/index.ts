// Accepts user-proposed canonicalization corrections and stores them
// in the mapping_overrides table for later review. No auth — anyone
// can suggest a correction; service role inserts on their behalf.

import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return json({ error: "POST only" }, 405);
    }
    const body = await req.json();
    const fieldType = String(body.fieldType ?? "").toLowerCase();
    const rawValue = String(body.rawValue ?? "").trim().slice(0, 300);
    const suggestedClean = String(body.suggestedClean ?? "").trim().slice(0, 200);
    const note = body.note ? String(body.note).trim().slice(0, 500) : null;
    const sessionId = body.sessionId ? String(body.sessionId).slice(0, 64) : null;

    if (!["sponsor", "indication", "asset"].includes(fieldType)) {
      return json({ error: "fieldType must be sponsor|indication|asset" }, 400);
    }
    if (!rawValue || !suggestedClean) {
      return json({ error: "rawValue and suggestedClean are required" }, 400);
    }
    if (suggestedClean.length < 2) {
      return json({ error: "suggestedClean too short" }, 400);
    }

    // Bump vote_count if the same suggestion already exists, else insert.
    const { data: existing } = await sb
      .from("mapping_overrides")
      .select("id, vote_count")
      .eq("field_type", fieldType)
      .eq("raw_value", rawValue)
      .eq("suggested_clean", suggestedClean)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      const { error } = await sb
        .from("mapping_overrides")
        .update({ vote_count: existing.vote_count + 1 })
        .eq("id", existing.id);
      if (error) throw error;
      return json({ ok: true, deduped: true, voteCount: existing.vote_count + 1 });
    }

    const { error } = await sb.from("mapping_overrides").insert({
      field_type: fieldType,
      raw_value: rawValue,
      suggested_clean: suggestedClean,
      note,
      session_id: sessionId,
    });
    if (error) throw error;

    return json({ ok: true, deduped: false });
  } catch (e) {
    console.error("ctg-mapping-override", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
