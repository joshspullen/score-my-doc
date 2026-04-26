export const TRAINING_ORCHESTRATION_SCHEMA_VERSION = "training_orchestration_v1" as const;

export const ORCHESTRATION_PROMPT_VERSIONS = {
  policyMapper: "v1",
  sanctionAnalyst: "v1",
  relevanceMapper: "v1",
  trainingScenario: "v1",
} as const;

export type OrchestrationQuizQuestionV1 = {
  question: string;
  options: [string, string, string, string];
  correct_index: 0 | 1 | 2 | 3;
  explanation: string;
};

export type OrchestrationTrainingOutputV1 = {
  schema_version: typeof TRAINING_ORCHESTRATION_SCHEMA_VERSION;
  title: string;
  description: string;
  duration_minutes: number;
  quiz: OrchestrationQuizQuestionV1[];
};

type ValidationSuccess = {
  ok: true;
  value: OrchestrationTrainingOutputV1;
};

type ValidationFailure = {
  ok: false;
  errors: string[];
};

export function validateOrchestrationOutputV1(input: unknown): ValidationSuccess | ValidationFailure {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { ok: false, errors: ["payload must be an object"] };
  }

  const schema_version = input.schema_version;
  const title = input.title;
  const description = input.description;
  const duration_minutes = input.duration_minutes;
  const quiz = input.quiz;

  if (schema_version !== TRAINING_ORCHESTRATION_SCHEMA_VERSION) {
    errors.push(`schema_version must equal '${TRAINING_ORCHESTRATION_SCHEMA_VERSION}'`);
  }

  if (!isNonEmptyString(title)) {
    errors.push("title must be a non-empty string");
  }

  if (!isNonEmptyString(description)) {
    errors.push("description must be a non-empty string");
  }

  if (!Number.isInteger(duration_minutes) || duration_minutes < 5 || duration_minutes > 90) {
    errors.push("duration_minutes must be an integer between 5 and 90");
  }

  if (!Array.isArray(quiz)) {
    errors.push("quiz must be an array");
  } else {
    if (quiz.length < 4 || quiz.length > 8) {
      errors.push("quiz must contain between 4 and 8 questions");
    }
    quiz.forEach((q, idx) => {
      const prefix = `quiz[${idx}]`;
      if (!isRecord(q)) {
        errors.push(`${prefix} must be an object`);
        return;
      }
      if (!isNonEmptyString(q.question)) {
        errors.push(`${prefix}.question must be a non-empty string`);
      }
      if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => !isNonEmptyString(o))) {
        errors.push(`${prefix}.options must be an array of exactly 4 non-empty strings`);
      }
      if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index > 3) {
        errors.push(`${prefix}.correct_index must be an integer between 0 and 3`);
      }
      if (!isNonEmptyString(q.explanation)) {
        errors.push(`${prefix}.explanation must be a non-empty string`);
      }
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      schema_version: TRAINING_ORCHESTRATION_SCHEMA_VERSION,
      title: title as string,
      description: description as string,
      duration_minutes: duration_minutes as number,
      quiz: (quiz as OrchestrationQuizQuestionV1[]).map((q) => ({
        question: q.question,
        options: q.options,
        correct_index: q.correct_index,
        explanation: q.explanation,
      })),
    },
  };
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
