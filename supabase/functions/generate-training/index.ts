import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { regulation, documentation, category, team } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are a compliance training designer. Given a regulation/sanction, you produce:
1) a short training module description (2-3 sentences) suitable for the named team and category,
2) a concise multiple-choice quiz (4 to 6 questions, 4 options each, exactly one correct) covering the key obligations and risks.
Return ONLY structured output via the provided tool.`;

    const user = `Regulation / sanction:
Title: ${regulation?.title ?? ""}
Reference: ${regulation?.reference_code ?? "—"}
Severity: ${regulation?.severity ?? "—"}
Category requested: ${category ?? "general"}
Target team: ${team ?? "all staff"}
Description: ${regulation?.description ?? "(none)"}

Linked documentation (use this as authoritative source if provided):
${documentation?.name ? `- ${documentation.name}: ${documentation.description ?? ""}` : "(none)"}
`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_training",
            description: "Emit a training module with quiz",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                duration_minutes: { type: "integer" },
                quiz: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                      correct_index: { type: "integer", minimum: 0, maximum: 3 },
                      explanation: { type: "string" },
                    },
                    required: ["question", "options", "correct_index", "explanation"],
                  },
                  minItems: 4,
                  maxItems: 6,
                },
              },
              required: ["title", "description", "duration_minutes", "quiz"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_training" } },
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit, please retry shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI gateway failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : null;
    if (!parsed) throw new Error("No structured output");

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-training error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});