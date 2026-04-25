import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are an expert compliance analyst specializing in KYC (Know Your Customer) documents and council/regulatory filings. You evaluate documents on:

1. **Completeness** (0-100): Are all required fields present? Signatures, dates, identifiers, supporting info?
2. **Clarity** (0-100): Is the language clear and unambiguous? Are terms defined?
3. **Regulatory Alignment** (0-100): Does it align with relevant regulations (GDPR, AML, KYC standards, council bylaws)?
4. **Risk Flags** (0-100, higher = lower risk): Are there red flags? Expired dates, missing signatures, vague terms, suspicious patterns?

The overall_score should be a weighted average reflecting overall compliance readiness. Be rigorous but fair. Provide concrete, actionable feedback.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { document_id } = await req.json();
    if (!document_id || typeof document_id !== "string") {
      return new Response(JSON.stringify({ error: "document_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch document
    const { data: doc, error: docErr } = await admin
      .from("documents").select("*").eq("id", document_id).eq("user_id", user.id).single();
    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file
    const { data: fileBlob, error: dlErr } = await admin.storage
      .from("documents").download(doc.storage_path);
    if (dlErr || !fileBlob) throw new Error("Could not download file");

    const arrayBuf = await fileBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuf)));
    const dataUrl = `data:${doc.mime_type};base64,${base64}`;

    // Build user message — use multimodal for images & PDFs
    const isImage = doc.mime_type.startsWith("image/");
    const isPdf = doc.mime_type === "application/pdf";

    const userContent: any[] = [
      { type: "text", text: `Analyze this document (filename: ${doc.filename}). Use the score_document tool to return your analysis.` },
    ];
    if (isImage || isPdf) {
      userContent.push({ type: "image_url", image_url: { url: dataUrl } });
    } else {
      // For DOCX/text, include as text (best effort — decode as utf-8)
      const textContent = new TextDecoder().decode(arrayBuf).slice(0, 50000);
      userContent[0].text += `\n\nDocument content:\n${textContent}`;
    }

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "score_document",
            description: "Return structured compliance scoring for the document.",
            parameters: {
              type: "object",
              properties: {
                document_type: { type: "string", description: "Brief identifier of the document type, e.g. 'KYC Identity Form', 'Council Planning Regulation'." },
                summary: { type: "string", description: "2-4 sentence plain-English summary of what the document is and its purpose." },
                overall_score: { type: "integer", minimum: 0, maximum: 100 },
                sub_scores: {
                  type: "object",
                  properties: {
                    completeness: { type: "integer", minimum: 0, maximum: 100 },
                    clarity: { type: "integer", minimum: 0, maximum: 100 },
                    regulatory_alignment: { type: "integer", minimum: 0, maximum: 100 },
                    risk_flags: { type: "integer", minimum: 0, maximum: 100 },
                  },
                  required: ["completeness", "clarity", "regulatory_alignment", "risk_flags"],
                  additionalProperties: false,
                },
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      severity: { type: "string", enum: ["low", "medium", "high"] },
                      title: { type: "string" },
                      detail: { type: "string" },
                    },
                    required: ["severity", "title", "detail"],
                    additionalProperties: false,
                  },
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["document_type", "summary", "overall_score", "sub_scores", "issues", "recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "score_document" } },
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        await admin.from("documents").update({ status: "failed", error_message: "Rate limit exceeded. Please try again shortly." }).eq("id", document_id);
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        await admin.from("documents").update({ status: "failed", error_message: "AI credits exhausted." }).eq("id", document_id);
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to your Lovable AI workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error("AI gateway error");
    }

    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");
    const args = JSON.parse(toolCall.function.arguments);

    // Insert analysis
    const { data: analysis, error: insertErr } = await admin.from("analyses").insert({
      document_id,
      user_id: user.id,
      overall_score: args.overall_score,
      sub_scores: args.sub_scores,
      summary: args.summary,
      document_type: args.document_type,
      issues: args.issues,
      recommendations: args.recommendations,
    }).select().single();
    if (insertErr) throw insertErr;

    await admin.from("documents").update({ status: "complete" }).eq("id", document_id);

    return new Response(JSON.stringify({ analysis_id: analysis.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-document error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});