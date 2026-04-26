export type TrainingGenerationRunMode = "legacy" | "orchestrated" | "legacy_fallback";
export type TrainingGenerationRunStatus = "running" | "success" | "error" | "fallback";

type JsonLike = Record<string, unknown> | unknown[] | string | number | boolean | null;

export type CreateTrainingGenerationRunInput = {
  mode: TrainingGenerationRunMode;
  compliance_requirement_id: string;
  triggered_by_user_id: string;
  policy_ids?: string[];
  team_id?: string | null;
  business_process_id?: string | null;
  schema_version?: string | null;
  prompt_versions?: Record<string, string>;
  model_name?: string | null;
  input_snapshot?: JsonLike;
};

export type UpdateTrainingGenerationRunInput = {
  status: TrainingGenerationRunStatus;
  finished_at?: string;
  step_timings_ms?: JsonLike;
  output_snapshot?: JsonLike;
  warnings?: JsonLike;
  error_message?: string | null;
  model_name?: string | null;
};

export async function createTrainingGenerationRun(
  admin: any,
  input: CreateTrainingGenerationRunInput
) {
  const payload = {
    mode: input.mode,
    status: "running" as const,
    compliance_requirement_id: input.compliance_requirement_id,
    triggered_by_user_id: input.triggered_by_user_id,
    policy_ids: input.policy_ids ?? [],
    team_id: input.team_id ?? null,
    business_process_id: input.business_process_id ?? null,
    schema_version: input.schema_version ?? null,
    prompt_versions: input.prompt_versions ?? {},
    model_name: input.model_name ?? null,
    input_snapshot: input.input_snapshot ?? {},
  };

  const { data, error } = await admin
    .from("training_generation_runs")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrainingGenerationRun(
  admin: any,
  runId: string,
  input: UpdateTrainingGenerationRunInput
) {
  const payload = {
    status: input.status,
    finished_at: input.finished_at ?? new Date().toISOString(),
    step_timings_ms: input.step_timings_ms ?? {},
    output_snapshot: input.output_snapshot ?? {},
    warnings: input.warnings ?? [],
    error_message: input.error_message ?? null,
    model_name: input.model_name ?? null,
  };

  const { data, error } = await admin
    .from("training_generation_runs")
    .update(payload)
    .eq("id", runId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function markTrainingGenerationRunSuccess(
  admin: any,
  runId: string,
  args?: {
    step_timings_ms?: JsonLike;
    output_snapshot?: JsonLike;
    warnings?: JsonLike;
    model_name?: string | null;
  }
) {
  return updateTrainingGenerationRun(admin, runId, {
    status: "success",
    step_timings_ms: args?.step_timings_ms,
    output_snapshot: args?.output_snapshot,
    warnings: args?.warnings,
    model_name: args?.model_name ?? null,
  });
}

export async function markTrainingGenerationRunFallback(
  admin: any,
  runId: string,
  args?: {
    step_timings_ms?: JsonLike;
    output_snapshot?: JsonLike;
    warnings?: JsonLike;
    model_name?: string | null;
  }
) {
  return updateTrainingGenerationRun(admin, runId, {
    status: "fallback",
    step_timings_ms: args?.step_timings_ms,
    output_snapshot: args?.output_snapshot,
    warnings: args?.warnings,
    model_name: args?.model_name ?? null,
  });
}

export async function markTrainingGenerationRunError(
  admin: any,
  runId: string,
  args: {
    error_message: string;
    step_timings_ms?: JsonLike;
    output_snapshot?: JsonLike;
    warnings?: JsonLike;
    model_name?: string | null;
  }
) {
  return updateTrainingGenerationRun(admin, runId, {
    status: "error",
    error_message: args.error_message,
    step_timings_ms: args.step_timings_ms,
    output_snapshot: args.output_snapshot,
    warnings: args.warnings,
    model_name: args.model_name ?? null,
  });
}
