# API Learning Lab — AI-Powered Sandbox Mode

> **Instructions for the AI agent:** Read this entire document before writing any code. This is a feature addition to an existing Next.js project. Do NOT scaffold a new project. You are adding a new "Sandbox Mode" to an existing deployed app. Understand the existing codebase structure first, then implement exactly as specified.

---

## 1. WHAT YOU'RE BUILDING

You are adding a new **AI-Powered Sandbox Mode** to an existing app called **API Learning Lab** — a browser-based platform for learning REST APIs interactively.

The app currently has:
- **Lesson Mode** — 5 static guided lessons with hardcoded simulators
- **Interview Prep Mode** — 10 timed API design challenges with scoring

You are adding:
- **Sandbox Mode** — a free-form API playground where users can send ANY HTTP request to ANY fake API endpoint, and an LLM (hosted via Ollama) acts as an intelligent API server, returning realistic responses with teaching explanations

This is the killer feature that makes the app dynamic instead of static. Users can experiment freely — there are no guided steps, no fixed paths. The LLM improvises as a realistic API server.

---

## 2. EXISTING TECH STACK (DO NOT CHANGE)

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS + CSS variables from `globals.css` |
| Animations | Framer Motion |
| State | React hooks + localStorage |
| Deployment | Vercel |

### Existing CSS Variables (use these, do NOT invent new colors)
```
--bg, --surface, --surface-hover, --border
--text-primary, --text-secondary, --text-muted
```
Accent colors: Violet/Indigo (primary), Emerald (success/GET), Amber (POST), Rose (interview), Red (errors/DELETE), Blue (PUT)

### Existing Components You MUST Reuse
- `RequestBuilder.tsx` — HTTP request form (method, path, headers, query params, body)
- `ResponseViewer.tsx` — displays response status, headers, body
- `FlowPanel.tsx` — animated request trace visualization
- `TeachingDrawer.tsx` — "What Happened" explanation panel
- `CodeGenTabs.tsx` — cURL / JS / Python code snippets
- `TopBar.tsx` — page header

Study how these components work in the existing lesson page (`src/app/lesson/[lessonId]/page.tsx`) and the existing hook (`src/hooks/useLessonState.ts`) before building anything. Your sandbox page should reuse these components with minimal modifications.

---

## 3. OLLAMA BACKEND CONFIGURATION

The LLM backend is a publicly accessible Ollama instance.

### Environment Variable
```
OLLAMA_BASE_URL=<will be set manually in .env.local>
OLLAMA_MODEL=qwen3.5:cloud
```

Add these to `.env.local` (create `.env.example` with placeholder values). The app must read these server-side only — never expose them to the client.

### Ollama API Format
Ollama exposes an OpenAI-compatible chat endpoint:
```
POST {OLLAMA_BASE_URL}/v1/chat/completions
Content-Type: application/json

{
  "model": "qwen3.5:cloud",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "temperature": 0.3,
  "stream": false
}
```

Response format:
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "..." 
      }
    }
  ]
}
```

The `content` field will contain the JSON string you need to parse.

---

## 4. NEW FILES TO CREATE

### 4.1 — Sandbox Page: `src/app/sandbox/page.tsx`

A new route at `/sandbox`. This is the main sandbox experience.

**Layout (3-column, matching existing lesson layout):**
- **Left sidebar** — Sandbox configuration panel (see 4.3)
- **Center top** — `FlowPanel` (reuse existing)
- **Center** — `RequestBuilder` (reuse existing)
- **Center bottom** — `ResponseViewer` (reuse existing)
- **Right sidebar** — `TeachingDrawer` (reuse existing) + `CodeGenTabs` (reuse existing)

**Key behaviors:**
- No guided steps, no step tracker, no lesson progress — this is free-form
- User constructs any request and hits Send
- Request goes to `/api/sandbox/simulate` (new API route)
- Response renders in ResponseViewer, trace animates in FlowPanel, teaching explanation shows in TeachingDrawer
- The page should feel alive — add a subtle pulsing indicator or "AI-Powered" badge somewhere visible to signal this isn't static

**Header:**
- Reuse `TopBar` with title "API Sandbox" and subtitle "AI-Powered — send any request, get intelligent responses"
- Add a small badge/chip that says "⚡ AI" next to the title

### 4.2 — Sandbox API Route: `src/app/api/sandbox/simulate/route.ts`

**POST endpoint.** Receives the user's request, calls Ollama, returns structured response.

**Request body (from client):**
```ts
{
  method: string;        // GET, POST, PUT, PATCH, DELETE
  path: string;          // e.g. /api/users/123
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string | null;   // JSON string or null
  context: string;       // The selected API context (see 4.3)
}
```

**System prompt to send to Ollama:**
```
You are an intelligent REST API server simulator for an educational platform called API Learning Lab. The user is learning how APIs work by sending HTTP requests to you.

You are simulating a: {context}

The user has sent the following HTTP request:
- Method: {method}
- Path: {path}
- Headers: {headers as formatted string}
- Query Parameters: {query as formatted string}
- Request Body: {body or "None"}

You must respond with ONLY a valid JSON object (no markdown, no backticks, no explanation outside the JSON). Use this exact structure:

{
  "http": {
    "status": <number - appropriate HTTP status code>,
    "statusText": "<string - e.g. OK, Not Found, Created>",
    "headers": {
      "Content-Type": "application/json",
      <other relevant response headers>
    },
    "body": <valid JSON - the actual API response body, make it realistic with fake but believable data>
  },
  "trace": [
    { "stage": "client", "label": "<what happened at client stage>", "durationMs": <number> },
    { "stage": "auth", "label": "<what happened at auth stage>", "durationMs": <number> },
    { "stage": "validation", "label": "<what happened at validation stage>", "durationMs": <number> },
    { "stage": "service", "label": "<what happened at service/business logic stage>", "durationMs": <number> },
    { "stage": "database", "label": "<what happened at database stage>", "durationMs": <number> },
    { "stage": "response", "label": "<what happened at response stage>", "durationMs": <number> }
  ],
  "teaching": {
    "title": "<short title explaining what happened>",
    "explanation": "<2-3 paragraph explanation of what this request did, why the server responded this way, and what the user should learn from it>",
    "tips": ["<practical tip 1>", "<practical tip 2>", "<practical tip 3>"],
    "commonMistakes": ["<mistake 1>", "<mistake 2>"]
  }
}

Rules:
- Always return realistic, believable fake data (names, emails, IDs, timestamps)
- If the request is malformed, return the appropriate 4xx error with a helpful explanation
- If auth headers are missing and the endpoint would normally require auth, return 401
- If the method doesn't match the path (e.g., DELETE /api/users with no ID), return 405 or 400
- Match the trace stages to what actually happened — skip stages that don't apply (e.g., no "database" stage for a 401 auth failure — set label to "Skipped — request rejected before reaching DB")
- The teaching explanation should be educational and specific to what the user did, not generic
- Vary the response data — don't return the same users/items every time
```

**Error handling in the API route:**
- If Ollama is unreachable, return a fallback response with status 503 and a teaching explanation that says "The AI backend is currently unavailable. Try again in a moment."
- If the LLM returns invalid JSON, attempt to extract JSON from the response (look for `{` to `}` matching). If that fails, return a fallback 500 response with teaching explanation about server errors.
- Set a timeout of 30 seconds on the Ollama fetch call.
- Wrap everything in try/catch.

**Response to client:**
Return the parsed JSON directly — it should match the existing `SimulateResponse` type as closely as possible so existing components can render it. If the existing type needs minor extensions, extend it — don't break the existing type.

### 4.3 — Sandbox Config Sidebar: `src/components/SandboxConfig.tsx`

Left sidebar component for the sandbox page. Contains:

**API Context Selector:**
A dropdown or card selector where the user picks what kind of API they're talking to. Options:

| Value | Label | Description |
|---|---|---|
| `ecommerce` | E-Commerce API | Products, carts, orders, users |
| `social` | Social Media API | Posts, comments, likes, followers |
| `banking` | Banking API | Accounts, transactions, transfers |
| `healthcare` | Healthcare API | Patients, appointments, records |
| `saas` | SaaS Platform API | Users, teams, subscriptions, billing |
| `iot` | IoT Device API | Devices, sensors, readings, alerts |
| `custom` | Custom API | Free-form — describe your own API |

When "Custom API" is selected, show a text input where the user can type a description like "A restaurant reservation system with tables, bookings, and waitlists."

**Quick Start Suggestions:**
Below the context selector, show 3-4 clickable suggestion chips that pre-fill the RequestBuilder with interesting requests based on the selected context. For example, if "E-Commerce API" is selected:
- `GET /api/products?category=electronics&limit=5`
- `POST /api/cart/items` (with sample body)
- `GET /api/orders/ORD-2024-001`
- `DELETE /api/cart/items/3`

These should update when the context changes. Store 3–4 suggestions per context as static data in the component.

**Styling:**
- Match the existing `LessonSidebar.tsx` styling — same width, same background, same border treatment
- Use Framer Motion for smooth transitions when switching contexts

### 4.4 — Sandbox Hook: `src/hooks/useSandboxState.ts`

Custom hook that manages all sandbox state. Pattern it after `useLessonState.ts`.

**State:**
```ts
{
  context: string;              // selected API context
  customContext: string;        // user-typed custom description
  request: RequestState;        // method, path, headers, query, body
  response: SimulateResponse | null;
  isLoading: boolean;
  error: string | null;
  history: SandboxHistoryEntry[];  // last 20 requests/responses
}
```

**Key function — `sendRequest()`:**
1. Set `isLoading = true`
2. POST to `/api/sandbox/simulate` with the current request + context
3. Parse response
4. Set response state
5. Add to history
6. Set `isLoading = false`

**History:**
- Store the last 20 request/response pairs in state
- Also persist to `localStorage['api-lab-sandbox-history']`
- Each entry: `{ id, timestamp, method, path, status, context }`

### 4.5 — Sandbox History Panel: `src/components/SandboxHistory.tsx`

A collapsible panel (put it at the bottom of the left sidebar, below SandboxConfig) showing recent requests.

Each entry shows:
- Method badge (colored like existing: green GET, amber POST, blue PUT, red DELETE)
- Path (truncated)
- Status code (colored: green 2xx, amber 3xx, red 4xx/5xx)
- Timestamp (relative: "2 min ago")

Clicking a history entry re-loads that request into the RequestBuilder and shows its response.

### 4.6 — Navigation Updates

**Update the landing page (`src/components/LandingPage.tsx`):**
- Add a third CTA button: "🧪 AI Sandbox" linking to `/sandbox`
- Add a new feature card in the "Why API Learning Lab?" section:
  - Icon: 🤖 or ⚡
  - Title: "AI-Powered Sandbox"
  - Description: "Send any request to any API — powered by AI that generates realistic responses and explains what happened."

**Update the TopBar or navigation:**
- Add "Sandbox" as a nav link alongside the existing lesson/interview links
- On the lesson sidebar, add a link to Sandbox mode

---

## 5. LOADING STATES & UX POLISH

Since Ollama responses take 2-5 seconds (not instant like the static simulator), handle loading gracefully:

**While waiting for response:**
- RequestBuilder "Send" button shows a spinner and says "Thinking..." or "Simulating..."
- FlowPanel shows a slow, animated pulse traveling through the stages (like a request in flight)
- ResponseViewer shows a skeleton/shimmer state
- TeachingDrawer shows "AI is analyzing your request..."

**After response arrives:**
- FlowPanel animates the trace normally (snap each stage in sequence)
- ResponseViewer renders with a fade-in
- TeachingDrawer content fades in

Use Framer Motion for all transitions. The loading → loaded transition should feel smooth, not jarring.

---

## 6. ENVIRONMENT & CONFIGURATION

### `.env.example` (create this file)
```
# Ollama Configuration
OLLAMA_BASE_URL=http://your-ollama-server:11434
OLLAMA_MODEL=qwen3.5:cloud
```

### `.env.local` (do NOT create this — user will create manually)
User will fill in their real Ollama URL.

### `next.config.ts` (or `.js`)
No changes needed — the Ollama call happens server-side in the API route, so no CORS issues.

---

## 7. TYPE EXTENSIONS

If the existing types in `src/lib/types.ts` need extending to support sandbox features, extend them — do NOT break existing lesson/interview functionality.

Add new types in a new file `src/lib/sandbox-types.ts`:

```ts
export interface SandboxRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: string | null;
  context: string;
}

export interface SandboxHistoryEntry {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  status: number;
  context: string;
  request: SandboxRequest;
  response: SimulateResponse;
}

export type APIContext = 
  | 'ecommerce' 
  | 'social' 
  | 'banking' 
  | 'healthcare' 
  | 'saas' 
  | 'iot' 
  | 'custom';
```

---

## 8. CRITICAL RULES

1. **Reuse existing components.** Do NOT rebuild RequestBuilder, ResponseViewer, FlowPanel, TeachingDrawer, or CodeGenTabs. Import and reuse them. If they need minor prop changes to support sandbox mode, make the changes backward-compatible so lesson mode still works.

2. **Do NOT break existing features.** Lesson mode and Interview mode must continue working exactly as before. Run the app and verify both still work after your changes.

3. **Server-side only for Ollama calls.** The Ollama URL and model name must NEVER appear in client-side code. All LLM calls go through the Next.js API route.

4. **Match the existing design language.** Use the same CSS variables, same glassmorphism style, same Framer Motion patterns. The sandbox page should look like it was always part of the app.

5. **Handle Ollama being down gracefully.** The app should not crash or show a blank screen if Ollama is unreachable. Show a friendly error message in the ResponseViewer.

6. **JSON parsing must be bulletproof.** LLMs sometimes return JSON wrapped in markdown backticks, or with trailing text. Strip all that before parsing. Try multiple extraction strategies before giving up.

7. **No new dependencies unless absolutely necessary.** The existing stack (Next.js, Tailwind, Framer Motion, Zod) should be sufficient.

8. **Test with a real Ollama call** after building. The API route should work end-to-end, not just in theory.

---

## 9. IMPLEMENTATION ORDER

Build in this exact order:
1. `src/lib/sandbox-types.ts` — types first
2. `src/app/api/sandbox/simulate/route.ts` — API route + Ollama integration
3. `src/hooks/useSandboxState.ts` — state management hook
4. `src/components/SandboxConfig.tsx` — context selector sidebar
5. `src/components/SandboxHistory.tsx` — request history panel
6. `src/app/sandbox/page.tsx` — main sandbox page (wires everything together)
7. Navigation updates (LandingPage, TopBar, etc.)
8. Final testing — verify lesson mode, interview mode, and sandbox mode all work

---

## 10. SUMMARY

You are adding one major feature: an AI-powered free-form API sandbox. It reuses the existing UI components but replaces the static simulator with a live LLM backend (Ollama). The user picks an API context, builds any request they want, and gets back a realistic response with animated traces and teaching explanations. This is the feature that makes the app go from "a tutorial" to "a tool."