// ─── Shared Types ───────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SimulateRequest {
  lessonId: string;
  request: {
    method: HttpMethod;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
  };
}

export interface TraceStep {
  stage: 'client' | 'server' | 'auth' | 'validation' | 'service' | 'db' | 'response';
  msg: string;
  highlight?: { type: 'header' | 'query' | 'body'; key?: string };
  ok?: boolean;
}

export interface TeachingPayload {
  title: string;
  explanation: string;
  fixSteps: string[];
  commonMistakes: string[];
}

export interface SimulateResponse {
  http: {
    status: number;
    headers: Record<string, string>;
    body: unknown;
    latencyMs: number;
  };
  trace: TraceStep[];
  teaching: TeachingPayload;
}

export interface StepReasoning {
  whyCorrect: string;
  whyNotAlternative: string;
  realWorldNote: string;
}

export interface LessonStep {
  id: string;
  title: string;
  conceptNote?: string;
  instruction: string;
  expected: { status: number; path?: string; method?: HttpMethod };
  expectedQuery?: Record<string, string>;
  hint?: string;
  reasoning?: StepReasoning;
}

export interface SandboxPrompt {
  prompt: string;
  hint: string;
}

export interface TradeoffCard {
  id: string;
  title: string;
  optionA: { label: string; pros: string[]; cons: string[]; };
  optionB: { label: string; pros: string[]; cons: string[]; };
  whenToChoose: { a: string; b: string; };
  failureScenario: string;
}

export interface LessonMeta {
  lessonId: string;
  title: string;
  description: string;
  category: string;
  successCodes: number[];
  objective: string;
  willLearn: string[];
  takeaways: string[];
  interviewNotes: string[];
  interviewExplanation: string;
  steps: LessonStep[];
  tradeoffCards?: TradeoffCard[];
  sandboxPrompts?: SandboxPrompt[];
  allowedMethods?: HttpMethod[];
  defaultRequest: {
    method: HttpMethod;
    path: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
  };
  breakItMistakes: BreakItMistake[];
}

export interface BreakItMistake {
  label: string;
  tooltip: string;
  apply: {
    setHeader?: Record<string, string>;
    removeHeader?: string;
    setBody?: string;
    setQuery?: Record<string, string>;
    setMethod?: HttpMethod;
  };
}

export interface KeyValuePair {
  key: string;
  value: string;
  id: string;
}
