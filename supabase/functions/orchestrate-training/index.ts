import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  ORCHESTRATION_PROMPT_VERSIONS,
  TRAINING_ORCHESTRATION_SCHEMA_VERSION,
  validateOrchestrationOutputV1,
} from "../_shared/orchestration-contract-v1.ts";
import {
  createTrainingGenerationRun,
  markTrainingGenerationRunError,
  markTrainingGenerationRunFallback,
  markTrainingGenerationRunSuccess,
} from "../_shared/training-generation-runs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL_ORCHESTRATOR = "google/gemini-2.5-flash";
const MODEL_LEGACY = "google/gemini-2.5-flash";
const DEFAULT_MAX_POLICIES = 8;
const POLICY_TOTAL_BUDGET = 90_000;
const SANCTION_BUDGET = 40_000;

type RegulationRow = {
  id: string;
  title: string;
  reference_code: string | null;
  regulator: string | null;
  requirement_type: string | null;
  severity: string | null;
  description: string | null;
  business_process_id: string | null;
  category: string | null;
};

type PolicyRow = {
  id: string;
  code: string | null;
  name: string;
  category: string | null;
  owner: string | null;
  description: string | null;
  doc_level: string;
  linked_sanction: string | null;
  sanction_amount: string | null;
  sanction_year: number | null;
  violation_summary: string | null;
  approved_by: string | null;
  version: string | null;
};

type QuizQuestion = {
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  explanation: string;
};

type LegacyOutput = {
  title: string;
  description: string;
  duration_minutes: number;
  quiz: QuizQuestion[];
};

const AGENTS = [
  {
    name: "Policy Mapper",
    promptVersion: ORCHESTRATION_PROMPT_VERSIONS.policyMapper,
    system:
      "You are the Policy Mapper, a compliance analyst. Read the company's policy/process documents. Produce a structured inventory in clean markdown grouped by theme. For each item include: policy/control name, owner if present, and obligation/risk covered. Be faithful to source and do not invent controls.",
  },
  {
    name: "Sanction Analyst",
    promptVersion: ORCHESTRATION_PROMPT_VERSIONS.sanctionAnalyst,
    system:
      "You are the Sanction Analyst. Analyze the provided sanction/regulation context and output markdown with sections: ## Case summary, ## Root causes, ## Regulatory expectations, ## Breached obligations, ## Lessons.",
  },
  {
    name: "Relevance Mapper",
    promptVersion: ORCHESTRATION_PROMPT_VERSIONS.relevanceMapper,
    system:
      "You are the Relevance Mapper. Compare breached obligations to company policy inventory. Output markdown table: Breached obligation | Matching policy/control (or NONE) | Coverage assessment (Strong/Partial/Weak/Missing) | Recommended action. Then sections: ### Critical gaps, ### Weak coverage, ### Strong coverage.",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  let runId: string | null = null;

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
    const regulationId = body.regulation_id as string | undefined;
    const policyIdsInput = Array.isArray(body.policy_ids) ? (body.policy_ids as string[]) : [];
    const teamId = (body.team_id as string | null | undefined) ?? null;
    const audience = typeof body.audience === "string" ? body.audience.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const useFallback = Boolean(body.use_fallback ?? false);

    if (!regulationId) return json({ error: "Missing regulation_id" }, 400);

    const { data: regulation, error: regErr } = await admin
      .from("compliance_requirements")
      .select("*")
      .eq("id", regulationId)
      .maybeSingle();
    if (regErr || !regulation) return json({ error: "Regulation not found" }, 404);

    const resolvedPolicies = await resolvePolicies(admin, regulation as RegulationRow, policyIdsInput);
    if (resolvedPolicies.length === 0) {
      return json({ error: "No policy context found. Provide policy_ids or add policy records." }, 400);
    }

    const run = await createTrainingGenerationRun(admin, {
      mode: "orchestrated",
      compliance_requirement_id: regulationId,
      triggered_by_user_id: userId,
      policy_ids: resolvedPolicies.map((p) => p.id),
      team_id: teamId,
      business_process_id: regulation.business_process_id,
      schema_version: TRAINING_ORCHESTRATION_SCHEMA_VERSION,
      prompt_versions: {
        policyMapper: ORCHESTRATION_PROMPT_VERSIONS.policyMapper,
        sanctionAnalyst: ORCHESTRATION_PROMPT_VERSIONS.sanctionAnalyst,
        relevanceMapper: ORCHESTRATION_PROMPT_VERSIONS.relevanceMapper,
        trainingScenario: ORCHESTRATION_PROMPT_VERSIONS.trainingScenario,
      },
      model_name: MODEL_ORCHESTRATOR,
      input_snapshot: {
        regulation_id: regulationId,
        policy_ids: resolvedPolicies.map((p) => p.id),
        team_id: teamId,
        audience,
        category,
      },
    });
    runId = run.id;

    const baseContext = buildBaseContext({
      regulation: regulation as RegulationRow,
      policies: resolvedPolicies,
      audience,
      category,
    });

    const stepTimings: Record<string, number> = {};
    const outputs: Array<{ agent: string; content: string }> = [];

    for (const agent of AGENTS) {
      const started = Date.now();
      const prior = outputs.map((o) => `### ${o.agent}\n${o.content}`).join("\n\n");
      const prompt = prior
        ? `${baseContext}\n\nPrior outputs:\n${prior}\n\nNow perform your role.`
        : `${baseContext}\n\nNow perform your role.`;
      const content = await callTextLLM({
        apiKey: LOVABLE_API_KEY,
        model: MODEL_ORCHESTRATOR,
        system: `${agent.system}\nPrompt version: ${agent.promptVersion}`,
        user: prompt,
      });
      outputs.push({ agent: agent.name, content });
      stepTimings[agent.name] = Date.now() - started;
    }

    const startedFinal = Date.now();
    const finalDraft = await callFinalTrainingLLM({
      apiKey: LOVABLE_API_KEY,
      model: MODEL_ORCHESTRATOR,
      baseContext,
      priorOutputs: outputs,
    });
    stepTimings["Training Scenario"] = Date.now() - startedFinal;

    const validated = validateOrchestrationOutputV1(finalDraft);
    if (!validated.ok) {
      if (useFallback || isEnvTrue(Deno.env.get("ORCHESTRATION_ENABLE_LEGACY_FALLBACK"))) {
        const legacy = await callLegacyGenerator({
          apiKey: LOVABLE_API_KEY,
          regulation: regulation as RegulationRow,
          firstPolicy: resolvedPolicies[0] ?? null,
          category: category || "Awareness",
          teamName: await resolveTeamName(admin, teamId),
        });
        const moduleId = await insertTrainingModuleAndAssignments(admin, {
          compliance_requirement_id: regulationId,
          business_process_id: resolvedPolicies[0]?.id ?? regulation.business_process_id ?? null,
          team_id: teamId,
          category: category || "Awareness",
          title: legacy.title,
          description: legacy.description,
          duration_minutes: legacy.duration_minutes,
          quiz: legacy.quiz,
          creator_user_id: userId,
        });
        if (runId) {
          await markTrainingGenerationRunFallback(admin, runId, {
            step_timings_ms: stepTimings,
            warnings: validated.errors,
            output_snapshot: { module_id: moduleId, mode_used: "legacy_fallback" },
            model_name: MODEL_LEGACY,
          });
        }
        return json({
          module_id: moduleId,
          run_id: runId,
          mode_used: "legacy_fallback",
          warnings: validated.errors,
        });
      }
      throw new Error(`Validation failed: ${validated.errors.join(" | ")}`);
    }

    const moduleId = await insertTrainingModuleAndAssignments(admin, {
      compliance_requirement_id: regulationId,
      business_process_id: resolvedPolicies[0]?.id ?? regulation.business_process_id ?? null,
      team_id: teamId,
      category: category || "Awareness",
      title: validated.value.title,
      description: validated.value.description,
      duration_minutes: validated.value.duration_minutes,
      quiz: validated.value.quiz,
      creator_user_id: userId,
    });

    if (runId) {
      await markTrainingGenerationRunSuccess(admin, runId, {
        step_timings_ms: stepTimings,
        output_snapshot: {
          module_id: moduleId,
          mode_used: "orchestrated",
          schema_version: TRAINING_ORCHESTRATION_SCHEMA_VERSION,
        },
        model_name: MODEL_ORCHESTRATOR,
      });
    }

    return json({
      module_id: moduleId,
      run_id: runId,
      mode_used: "orchestrated",
      schema_version: TRAINING_ORCHESTRATION_SCHEMA_VERSION,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    if (runId) {
      await markTrainingGenerationRunError(admin, runId, { error_message: msg }).catch(() => {});
    }
    return json({ error: msg, run_id: runId }, 500);
  }
});

async function resolvePolicies(admin: any, regulation: RegulationRow, policyIdsInput: string[]): Promise<PolicyRow[]> {
  if (policyIdsInput.length > 0) {
    const uniqueIds = Array.from(new Set(policyIdsInput));
    const { data } = await admin
      .from("business_processes")
      .select("*")
      .in("id", uniqueIds)
      .order("name");
    return ((data ?? []) as PolicyRow[]).slice(0, DEFAULT_MAX_POLICIES);
  }

  if (regulation.business_process_id) {
    const { data: primary } = await admin
      .from("business_processes")
      .select("*")
      .eq("id", regulation.business_process_id)
      .maybeSingle();
    if (primary) return [primary as PolicyRow];
  }

  let q = admin.from("business_processes").select("*").order("doc_level").order("name").limit(DEFAULT_MAX_POLICIES);
  if (regulation.category) {
    q = q.eq("category", regulation.category);
  }
  const { data } = await q;
  const filtered = (data ?? []) as PolicyRow[];
  if (filtered.length > 0) return filtered;

  // Final fallback: return any available policies so orchestration can proceed
  const { data: anyPolicies } = await admin
    .from("business_processes")
    .select("*")
    .order("doc_level")
    .order("name")
    .limit(DEFAULT_MAX_POLICIES);
  return (anyPolicies ?? []) as PolicyRow[];
}

function clip(s: string, max: number): { text: string; truncated: boolean } {
  if (!s) return { text: "", truncated: false };
  if (s.length <= max) return { text: s, truncated: false };
  return { text: s.slice(0, max), truncated: true };
}

function buildPolicyBlock(policies: PolicyRow[]): string {
  let remaining = POLICY_TOTAL_BUDGET;
  const parts: string[] = [];

  for (const p of policies) {
    if (remaining <= 0) break;
    const text = [
      `Name: ${p.name}`,
      p.code ? `Code: ${p.code}` : "",
      p.doc_level ? `Level: ${p.doc_level}` : "",
      p.category ? `Category: ${p.category}` : "",
      p.owner ? `Owner: ${p.owner}` : "",
      p.description ? `Description: ${p.description}` : "",
      p.linked_sanction ? `Linked sanction: ${p.linked_sanction}` : "",
      p.violation_summary ? `Violation summary: ${p.violation_summary}` : "",
      p.version ? `Version: ${p.version}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const clipped = clip(text, remaining);
    remaining -= clipped.text.length;
    parts.push(`--- POLICY (${p.id})${clipped.truncated ? " (truncated)" : ""} ---\n${clipped.text}`);
  }

  return parts.join("\n\n");
}

function buildBaseContext(opts: {
  regulation: RegulationRow;
  policies: PolicyRow[];
  audience: string;
  category: string;
}) {
  const { regulation, policies, audience, category } = opts;
  const sanctionText = [
    `Title: ${regulation.title}`,
    regulation.reference_code ? `Reference: ${regulation.reference_code}` : "",
    regulation.regulator ? `Regulator: ${regulation.regulator}` : "",
    regulation.requirement_type ? `Requirement type: ${regulation.requirement_type}` : "",
    regulation.severity ? `Severity: ${regulation.severity}` : "",
    regulation.category ? `Category: ${regulation.category}` : "",
    regulation.description ? `Description: ${regulation.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const clippedSanction = clip(sanctionText, SANCTION_BUDGET);

  return `Target audience / brief: ${audience || "(not specified)"}
Requested training category: ${category || "Awareness"}

=== SANCTION / REGULATION CONTEXT ===
${clippedSanction.text}
=== END SANCTION / REGULATION CONTEXT ===

=== POLICY CONTEXT ===
${buildPolicyBlock(policies)}
=== END POLICY CONTEXT ===`;
}

async function callTextLLM(args: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI text call failed (${res.status}): ${t}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callFinalTrainingLLM(args: {
  apiKey: string;
  model: string;
  baseContext: string;
  priorOutputs: Array<{ agent: string; content: string }>;
}): Promise<unknown> {
  const prior = args.priorOutputs.map((o) => `### ${o.agent}\n${o.content}`).join("\n\n");
  const user = `${args.baseContext}

Prior agent outputs:
${prior}

Now produce final training output and return ONLY via tool call.`;

  const sys = `You are the Training Scenario Designer.
Return strict structured output using the provided function.
Output must follow schema_version="${TRAINING_ORCHESTRATION_SCHEMA_VERSION}".
Generate:
- title
- description
- duration_minutes
- quiz (4-8 questions, 4 options each, one correct index, with explanation)`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "emit_orchestrated_training_v1",
            description: "Emit final orchestrated training payload",
            parameters: {
              type: "object",
              additionalProperties: false,
              properties: {
                schema_version: { type: "string", const: TRAINING_ORCHESTRATION_SCHEMA_VERSION },
                title: { type: "string" },
                description: { type: "string" },
                duration_minutes: { type: "integer", minimum: 5, maximum: 90 },
                quiz: {
                  type: "array",
                  minItems: 4,
                  maxItems: 8,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      question: { type: "string" },
                      options: {
                        type: "array",
                        minItems: 4,
                        maxItems: 4,
                        items: { type: "string" },
                      },
                      correct_index: { type: "integer", minimum: 0, maximum: 3 },
                      explanation: { type: "string" },
                    },
                    required: ["question", "options", "correct_index", "explanation"],
                  },
                },
              },
              required: ["schema_version", "title", "description", "duration_minutes", "quiz"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_orchestrated_training_v1" } },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI final call failed (${res.status}): ${t}`);
  }
  const data = await res.json();
  const argsRaw = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!argsRaw) throw new Error("No structured output from final agent");
  return JSON.parse(argsRaw);
}

async function callLegacyGenerator(args: {
  apiKey: string;
  regulation: RegulationRow;
  firstPolicy: PolicyRow | null;
  category: string;
  teamName: string | null;
}): Promise<LegacyOutput> {
  const sys = `You are a compliance training designer. Given a regulation/sanction, you produce:
1) a short training module description (2-3 sentences) suitable for the named team and category,
2) a concise multiple-choice quiz (4 to 6 questions, 4 options each, exactly one correct) covering key obligations and risks.
Return ONLY structured output via the provided tool.`;

  const user = `Regulation / sanction:
Title: ${args.regulation.title}
Reference: ${args.regulation.reference_code ?? "—"}
Severity: ${args.regulation.severity ?? "—"}
Category requested: ${args.category}
Target team: ${args.teamName ?? "all staff"}
Description: ${args.regulation.description ?? "(none)"}

Linked documentation:
${args.firstPolicy ? `- ${args.firstPolicy.name}: ${args.firstPolicy.description ?? ""}` : "(none)"}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_LEGACY,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      tools: [
        {
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
                  minItems: 4,
                  maxItems: 6,
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
                },
              },
              required: ["title", "description", "duration_minutes", "quiz"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "emit_training" } },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Legacy generation failed (${res.status}): ${t}`);
  }
  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!raw) throw new Error("No structured output from legacy generator");
  const parsed = JSON.parse(raw);
  return {
    title: parsed.title,
    description: parsed.description,
    duration_minutes: parsed.duration_minutes,
    quiz: parsed.quiz,
  };
}

async function insertTrainingModuleAndAssignments(
  admin: any,
  args: {
    compliance_requirement_id: string;
    business_process_id: string | null;
    team_id: string | null;
    category: string | null;
    title: string;
    description: string;
    duration_minutes: number;
    quiz: QuizQuestion[];
    creator_user_id: string;
  }
): Promise<string> {
  const modulePayload = {
    title: args.title,
    description: args.description,
    duration_minutes: args.duration_minutes,
    compliance_requirement_id: args.compliance_requirement_id,
    business_process_id: args.business_process_id,
    team_id: args.team_id,
    category: args.category,
    quiz: args.quiz,
  };

  const { data: ins, error: insErr } = await admin
    .from("training_modules")
    .insert(modulePayload)
    .select("id")
    .single();
  if (insErr) throw insErr;

  const userIds = new Set<string>();
  userIds.add(args.creator_user_id);
  if (args.team_id) {
    const { data: members, error: membersErr } = await admin
      .from("team_members")
      .select("user_id")
      .eq("team_id", args.team_id);
    if (membersErr) throw membersErr;
    (members ?? []).forEach((m: { user_id: string }) => userIds.add(m.user_id));
  }

  const rows = Array.from(userIds).map((uid) => ({
    training_module_id: ins.id,
    user_id: uid,
    status: "assigned",
  }));
  if (rows.length > 0) {
    const { error: aErr } = await admin
      .from("training_assignments")
      .upsert(rows, { onConflict: "training_module_id,user_id", ignoreDuplicates: true });
    if (aErr) throw aErr;
  }

  return ins.id;
}

async function resolveTeamName(admin: any, teamId: string | null): Promise<string | null> {
  if (!teamId) return null;
  const { data } = await admin.from("teams").select("name").eq("id", teamId).maybeSingle();
  return data?.name ?? null;
}

function isEnvTrue(v?: string | null) {
  if (!v) return false;
  return ["1", "true", "yes", "on"].includes(v.toLowerCase());
}

function json(d: unknown, status = 200) {
  return new Response(JSON.stringify(d), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
