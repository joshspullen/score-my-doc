import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { record_id } = await req.json().catch(() => ({}));
    if (!record_id) return json({ error: "Missing record_id" }, 400);

    const { data: rec } = await admin.from("connector_records").select("*").eq("id", record_id).maybeSingle();
    if (!rec) return json({ error: "Record not found" }, 404);

    const { data: processes } = await admin
      .from("business_processes")
      .select("id, name, category, doc_level")
      .limit(80);

    const { data: decisionCats } = await admin
      .from("decision_traces")
      .select("category")
      .not("category", "is", null);
    const categories = Array.from(new Set((decisionCats ?? []).map((d: any) => d.category).filter(Boolean)));

    let impact: any = { policy_ids: [], decision_categories: [], severity: "medium", rationale: "Heuristic match" };

    if (LOVABLE_API_KEY && processes && processes.length > 0) {
      try {
        const sys = "You map a regulatory item to internal policies and decision categories. Return strict JSON only.";
        const prompt = `Regulatory item:
TITLE: ${rec.title}
SUMMARY: ${rec.summary ?? ""}
SOURCE_PAYLOAD: ${JSON.stringify(rec.payload ?? {}).slice(0, 500)}

Internal policies (id, name, category):
${processes.map((p: any) => `- ${p.id} | ${p.name} | ${p.category ?? ""}`).join("\n")}

Known decision categories: ${categories.join(", ") || "none"}

Return JSON:
{"policy_ids":[ids of up to 5 most-impacted policies],"decision_categories":[matching decision categories],"severity":"low|medium|high","rationale":"one sentence"}`;

        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "system", content: sys }, { role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const content = aiJson.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === "object") {
            impact = {
              policy_ids: Array.isArray(parsed.policy_ids) ? parsed.policy_ids.slice(0, 5) : [],
              decision_categories: Array.isArray(parsed.decision_categories) ? parsed.decision_categories.slice(0, 6) : [],
              severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
              rationale: typeof parsed.rationale === "string" ? parsed.rationale.slice(0, 240) : "",
            };
          }
        } else if (aiRes.status === 429) {
          return json({ error: "Rate limit reached, please retry shortly." }, 429);
        } else if (aiRes.status === 402) {
          return json({ error: "AI credits exhausted." }, 402);
        }
      } catch (e) {
        console.error("AI mapping failed", e);
      }
    }

    // Fallback heuristic if AI returned nothing useful
    if (impact.policy_ids.length === 0 && processes) {
      const hay = `${rec.title} ${rec.summary ?? ""}`.toLowerCase();
      const matches = processes.filter((p: any) => {
        const k = `${p.name} ${p.category ?? ""}`.toLowerCase();
        return k.split(/\s+/).some((w) => w.length > 3 && hay.includes(w));
      }).slice(0, 5);
      impact.policy_ids = matches.map((p: any) => p.id);
    }
    if (impact.decision_categories.length === 0) {
      const hay = `${rec.title} ${rec.summary ?? ""}`.toLowerCase();
      impact.decision_categories = categories.filter((c) => hay.includes(c.toLowerCase()));
    }

    const newPayload = { ...(rec.payload ?? {}), impact };
    await admin.from("connector_records").update({ payload: newPayload }).eq("id", record_id);

    return json({ ok: true, impact });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
