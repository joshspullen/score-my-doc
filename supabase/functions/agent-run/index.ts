import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    let triggeredBy = "scheduled";
    if (authHeader && !authHeader.includes(SERVICE_KEY)) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u } = await userClient.auth.getUser();
      if (!u?.user) return json({ error: "Unauthorized" }, 401);
      const { data: role } = await admin.from("user_roles").select("role")
        .eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      if (!role) return json({ error: "Forbidden — admin only" }, 403);
      triggeredBy = "manual";
    }

    const { agent_id } = await req.json().catch(() => ({}));
    if (!agent_id) return json({ error: "Missing agent_id" }, 400);

    const { data: agent } = await admin.from("agents").select("*").eq("id", agent_id).maybeSingle();
    if (!agent) return json({ error: "Agent not found" }, 404);

    // Create a run row
    const { data: run } = await admin.from("agent_runs").insert({
      agent_id, status: "running", triggered_by: triggeredBy,
    }).select().single();

    const logs: any[] = [];
    const log = (msg: string, extra?: any) => {
      logs.push({ t: new Date().toISOString(), msg, ...(extra ?? {}) });
    };

    log(`Agent "${agent.name}" started`, { pattern: agent.pattern });

    let records: any[] = [];
    let errMsg: string | null = null;

    try {
      if (agent.pattern === "collection") {
        const url = agent.config?.scrape_url || agent.config?.url;
        if (!url) throw new Error("No scrape_url in agent.config");
        log(`Fetching ${url}`);
        const res = await fetch(url, { headers: { "User-Agent": "MeridianAgent/1.0", Accept: "application/rss+xml, application/xml, text/html, */*" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        records = parseDocuments(text, agent.config?.keywords ?? []);
        log(`Parsed ${records.length} candidate items`);

        // Persist into connector_records when a connector is linked
        let newCount = 0;
        if (agent.connector_id && records.length > 0) {
          const rows = records.map((r) => ({
            connector_id: agent.connector_id,
            external_id: r.external_id,
            title: r.title,
            summary: r.summary ?? null,
            url: r.url ?? null,
            published_at: r.published_at ?? null,
            record_type: r.record_type ?? "agent_collection",
            payload: { ...r.payload, agent_id, version: r.version ?? null },
            fetched_at: new Date().toISOString(),
          }));
          const { error: upErr, count } = await admin.from("connector_records")
            .upsert(rows, { onConflict: "connector_id,external_id", count: "exact" });
          if (upErr) log("Upsert error", { error: upErr.message });
          newCount = count ?? rows.length;
          log(`Upserted ${newCount} records into connector store`);
        }

        await admin.from("agent_runs").update({
          status: "success", records_collected: records.length, new_records: newCount,
          logs, output: { sample: records.slice(0, 5) }, finished_at: new Date().toISOString(),
        }).eq("id", run!.id);
      } else {
        log(`Pattern "${agent.pattern}" not implemented yet — stub run`);
        await admin.from("agent_runs").update({
          status: "skipped", logs, finished_at: new Date().toISOString(),
        }).eq("id", run!.id);
      }
    } catch (e) {
      errMsg = (e as Error).message;
      log("Error", { error: errMsg });
      await admin.from("agent_runs").update({
        status: "error", error_message: errMsg, logs, finished_at: new Date().toISOString(),
      }).eq("id", run!.id);
    }

    // Update agent's last run summary
    await admin.from("agents").update({
      last_run_at: new Date().toISOString(),
      last_run_status: errMsg ? "error" : "success",
    }).eq("id", agent_id);

    return json({ ok: !errMsg, run_id: run!.id, records: records.length, error: errMsg });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Detects RSS items first, falls back to <a> link extraction with optional keyword filter.
function parseDocuments(text: string, keywords: string[] = []): any[] {
  const items: any[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const matches = text.match(itemRegex) ?? [];

  if (matches.length > 0) {
    for (const item of matches.slice(0, 100)) {
      const title = pick(item, "title");
      const link = pick(item, "link");
      const desc = pick(item, "description");
      const date = pick(item, "pubDate") ?? pick(item, "dc:date");
      const guid = pick(item, "guid") ?? link ?? title;
      if (!title) continue;
      const version = detectVersion(`${title} ${desc ?? ""}`);
      if (keywords.length && !keywords.some((k) => (`${title} ${desc}`).toLowerCase().includes(k.toLowerCase()))) continue;
      items.push({
        external_id: `agent-${hash(guid ?? title)}`,
        title: stripTags(title),
        summary: desc ? stripTags(desc).slice(0, 1000) : null,
        url: link,
        published_at: date ? new Date(date).toISOString() : null,
        record_type: "regulation",
        version,
        payload: { source: "rss", guid },
      });
    }
    return items;
  }

  // HTML link scraping fallback
  const linkRegex = /<a[^>]*href=["']([^"']+\.pdf|[^"']+\.html?|[^"']+\/)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = linkRegex.exec(text)) && i < 100) {
    const href = m[1];
    const label = stripTags(m[2]).trim();
    if (!label || label.length < 6) continue;
    if (keywords.length && !keywords.some((k) => label.toLowerCase().includes(k.toLowerCase()))) continue;
    items.push({
      external_id: `agent-${hash(href)}`,
      title: label,
      url: href,
      record_type: "document",
      version: detectVersion(label),
      payload: { source: "html" },
    });
    i++;
  }
  return items;
}

function detectVersion(s: string): string | null {
  const m = s.match(/v(?:ersion)?\s?([0-9]+(?:\.[0-9]+){0,2})/i)
    ?? s.match(/\b(20\d{2}[-/.](?:0?[1-9]|1[0-2])[-/.](?:0?[1-9]|[12]\d|3[01]))\b/);
  return m ? m[1] : null;
}
function pick(s: string, tag: string): string | null {
  const m = s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return null;
  return m[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
}
function stripTags(s: string) { return s.replace(/<[^>]+>/g, "").trim(); }
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}