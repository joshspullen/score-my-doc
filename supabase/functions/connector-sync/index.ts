import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Record = {
  external_id: string;
  title: string;
  summary?: string;
  url?: string;
  published_at?: string | null;
  record_type?: string;
  payload?: Record | unknown;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: roleRow } = await admin
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return json({ error: "Forbidden — admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const { connector_id } = body;
    if (!connector_id) return json({ error: "Missing connector_id" }, 400);

    const { data: connector } = await admin
      .from("connectors").select("*").eq("id", connector_id).maybeSingle();
    if (!connector) return json({ error: "Connector not found" }, 404);

    let apiKey: string | undefined;
    if (connector.requires_api_key && connector.api_key_secret_name) {
      apiKey = Deno.env.get(connector.api_key_secret_name) ?? undefined;
      if (!apiKey) {
        await admin.from("connectors").update({
          last_sync_status: "error",
          last_sync_error: `Missing secret ${connector.api_key_secret_name}`,
          last_sync_at: new Date().toISOString(),
        }).eq("id", connector_id);
        return json({ error: `Missing secret ${connector.api_key_secret_name}` }, 400);
      }
    }

    let records: any[] = [];
    let syncError: string | null = null;

    try {
      records = await fetchConnector(connector.slug);
    } catch (e) {
      syncError = (e as Error).message;
    }

    if (syncError) {
      await admin.from("connectors").update({
        last_sync_status: "error",
        last_sync_error: syncError,
        last_sync_at: new Date().toISOString(),
      }).eq("id", connector_id);
      return json({ error: syncError }, 502);
    }

    // Upsert records
    if (records.length > 0) {
      const rows = records.map((r) => ({
        connector_id,
        external_id: r.external_id,
        title: r.title,
        summary: r.summary ?? null,
        url: r.url ?? null,
        published_at: r.published_at ?? null,
        record_type: r.record_type ?? null,
        payload: r.payload ?? {},
        fetched_at: new Date().toISOString(),
      }));
      // Insert in batches
      const batchSize = 200;
      for (let i = 0; i < rows.length; i += batchSize) {
        await admin.from("connector_records").upsert(rows.slice(i, i + batchSize), {
          onConflict: "connector_id,external_id",
        });
      }
    }

    const { count } = await admin
      .from("connector_records")
      .select("*", { count: "exact", head: true })
      .eq("connector_id", connector_id);

    await admin.from("connectors").update({
      last_sync_status: "ok",
      last_sync_error: null,
      last_sync_at: new Date().toISOString(),
      records_count: count ?? records.length,
    }).eq("id", connector_id);

    return json({ ok: true, fetched: records.length, total: count ?? records.length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================
// Per-connector fetchers
// ============================================================
async function fetchConnector(slug: string): Promise<any[]> {
  switch (slug) {
    case "acpr": return await fetchACPR();
    case "eba": return await fetchEBA();
    case "esma": return await fetchESMA();
    case "ofac": return await fetchOFAC();
    case "uk_hmt": return await fetchUKHMT();
    case "fatf": return await fetchFATF();
    default: throw new Error(`No fetcher for ${slug}`);
  }
}

// ACPR: scrape sanctions/decisions feed (RSS)
async function fetchACPR(): Promise<any[]> {
  const url = "https://acpr.banque-france.fr/en/rss-acpr";
  const res = await fetch(url, { headers: { "User-Agent": "MeridianBot/1.0" } });
  if (!res.ok) throw new Error(`ACPR HTTP ${res.status}`);
  const xml = await res.text();
  return parseRss(xml, "acpr");
}

// EBA: scrape press releases RSS
async function fetchEBA(): Promise<any[]> {
  const url = "https://www.eba.europa.eu/press-releases-feed.xml";
  const res = await fetch(url, { headers: { "User-Agent": "MeridianBot/1.0" } });
  if (!res.ok) throw new Error(`EBA HTTP ${res.status}`);
  const xml = await res.text();
  return parseRss(xml, "eba");
}

// ESMA: news feed
async function fetchESMA(): Promise<any[]> {
  const url = "https://www.esma.europa.eu/news/rss.xml";
  const res = await fetch(url, { headers: { "User-Agent": "MeridianBot/1.0" } });
  if (!res.ok) throw new Error(`ESMA HTTP ${res.status}`);
  const xml = await res.text();
  return parseRss(xml, "esma");
}

// OFAC SDN: download CSV (subset)
async function fetchOFAC(): Promise<any[]> {
  const url = "https://www.treasury.gov/ofac/downloads/sdn.csv";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OFAC HTTP ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n").slice(0, 500); // cap to 500
  return lines.filter((l) => l.trim()).map((line, i) => {
    const cols = line.split(",");
    const id = cols[0]?.replace(/"/g, "").trim() || String(i);
    const name = cols[1]?.replace(/"/g, "").trim() || "Unknown";
    const programs = cols[3]?.replace(/"/g, "").trim();
    return {
      external_id: `ofac-${id}`,
      title: name,
      summary: programs,
      record_type: "sanction",
      url: "https://sanctionssearch.ofac.treas.gov/",
      payload: { raw: line },
    };
  });
}

// UK HMT consolidated list (JSON)
async function fetchUKHMT(): Promise<any[]> {
  const url = "https://ofsistorage.blob.core.windows.net/publishlive/2022format/ConList.json";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`UK HMT HTTP ${res.status}`);
  const json = await res.json();
  const items = (json?.Designations ?? json ?? []).slice(0, 500);
  return items.map((d: any, i: number) => {
    const id = d?.GroupId ?? d?.UniqueID ?? d?.id ?? String(i);
    const name = d?.Names?.[0]?.Name6 ?? d?.Name6 ?? d?.Name ?? "Unknown";
    return {
      external_id: `ukhmt-${id}`,
      title: String(name),
      summary: d?.RegimeName ?? d?.Regime ?? null,
      record_type: "sanction",
      url: "https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets",
      payload: d,
    };
  });
}

// FATF: scrape jurisdiction listing
async function fetchFATF(): Promise<any[]> {
  // FATF doesn't expose a clean API; use their press releases RSS
  const url = "https://www.fatf-gafi.org/en/publications.rss";
  try {
    const res = await fetch(url);
    if (res.ok) {
      const xml = await res.text();
      const parsed = parseRss(xml, "fatf");
      if (parsed.length > 0) return parsed;
    }
  } catch (_) {}
  // Fallback: well-known black/grey lists snapshot
  const blackList = ["Iran", "Korea, Democratic People's Republic of", "Myanmar"];
  const greyList = [
    "Algeria", "Angola", "Bulgaria", "Burkina Faso", "Cameroon", "Cote d'Ivoire",
    "Croatia", "Democratic Republic of Congo", "Haiti", "Kenya", "Lao PDR",
    "Lebanon", "Mali", "Monaco", "Mozambique", "Namibia", "Nepal", "Nigeria",
    "South Africa", "South Sudan", "Syria", "Tanzania", "Venezuela", "Vietnam", "Yemen",
  ];
  return [
    ...blackList.map((j) => ({
      external_id: `fatf-black-${j}`, title: j, record_type: "high-risk-jurisdiction",
      summary: "FATF call for action (black list)",
      url: "https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions.html",
      payload: { listing: "high-risk" },
    })),
    ...greyList.map((j) => ({
      external_id: `fatf-grey-${j}`, title: j, record_type: "monitored-jurisdiction",
      summary: "FATF increased monitoring (grey list)",
      url: "https://www.fatf-gafi.org/en/publications/High-risk-and-other-monitored-jurisdictions.html",
      payload: { listing: "increased-monitoring" },
    })),
  ];
}

function parseRss(xml: string, prefix: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/g;
  const matches = xml.match(itemRegex) ?? [];
  for (const item of matches.slice(0, 200)) {
    const title = pick(item, "title");
    const link = pick(item, "link");
    const desc = pick(item, "description");
    const date = pick(item, "pubDate") ?? pick(item, "dc:date");
    const guid = pick(item, "guid") ?? link ?? title;
    if (!title) continue;
    items.push({
      external_id: `${prefix}-${hash(guid ?? title)}`,
      title: stripTags(title),
      summary: desc ? stripTags(desc).slice(0, 1000) : null,
      url: link,
      published_at: date ? new Date(date).toISOString() : null,
      record_type: "publication",
      payload: { guid },
    });
  }
  return items;
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