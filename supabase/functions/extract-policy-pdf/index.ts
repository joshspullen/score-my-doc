import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "google/gemini-2.5-flash";
const MAX_CHARS = 120_000;

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked to avoid call-stack overflow on large PDFs
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as unknown as number[]);
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  let documentId: string | null = null;

  try {
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);
    const userId = userData.user.id;

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden — admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    documentId = body.document_id as string | undefined ?? null;
    if (!documentId) return json({ error: "Missing document_id" }, 400);

    const { data: doc, error: docErr } = await admin
      .from("policy_documents")
      .select("id, storage_path, mime_type, filename")
      .eq("id", documentId)
      .maybeSingle();
    if (docErr || !doc) return json({ error: "Document not found" }, 404);

    // Mark pending
    await admin
      .from("policy_documents")
      .update({ extraction_status: "pending", extraction_error: null })
      .eq("id", documentId);

    // Download the file from storage
    const dl = await admin.storage.from("documents").download(doc.storage_path);
    if (dl.error || !dl.data) throw new Error(`Download failed: ${dl.error?.message ?? "unknown"}`);
    const buf = new Uint8Array(await dl.data.arrayBuffer());
    const base64 = bytesToBase64(buf);

    // Send to Lovable AI Gateway (Gemini supports inline PDF parts)
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a careful document extractor. Return the FULL plain-text content of the attached PDF, preserving section headings and bullet points where possible. Do not summarise. Do not add commentary. Output text only.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Extract the full text from this document: ${doc.filename}` },
              {
                type: "file",
                file: {
                  filename: doc.filename,
                  file_data: `data:${doc.mime_type || "application/pdf"};base64,${base64}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI extraction failed (${res.status}): ${t.slice(0, 500)}`);
    }
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content ?? "";
    const trimmed = text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;

    if (!trimmed.trim()) {
      throw new Error("Empty extraction result");
    }

    const { error: upErr } = await admin
      .from("policy_documents")
      .update({
        extracted_text: trimmed,
        extraction_status: "ready",
        extraction_error: null,
      })
      .eq("id", documentId);
    if (upErr) throw upErr;

    return json({ ok: true, chars: trimmed.length, truncated: text.length > MAX_CHARS });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (documentId) {
      await admin
        .from("policy_documents")
        .update({ extraction_status: "error", extraction_error: msg })
        .eq("id", documentId)
        .catch(() => {});
    }
    return json({ error: msg }, 500);
  }
});