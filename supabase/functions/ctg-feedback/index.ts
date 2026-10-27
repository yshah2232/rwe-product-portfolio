// Visitor activity collection is retired. Older clients receive a no-op response.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  return new Response(JSON.stringify(req.method === "POST" ? { ok: true, retained: false } : { error: "POST only" }), {
    status: req.method === "POST" ? 200 : 405,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
