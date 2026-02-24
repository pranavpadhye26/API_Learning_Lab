# API Learning Lab

An interactive web application that teaches API concepts through animated request flows and a hands-on request sandbox.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Monaco Editor** for JSON body editing
- **Zod** for request validation

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/simulate/route.ts   # Scenario engine API endpoint
│   ├── globals.css              # Design tokens + theme
│   ├── layout.tsx               # Root layout with Inter font
│   └── page.tsx                 # Main app page (3-pane layout)
├── components/
│   ├── LessonSidebar.tsx        # Lesson navigation + progress
│   ├── TopBar.tsx               # Title bar + progress dots
│   ├── FlowPanel.tsx            # Animated 7-stage request pipeline
│   ├── RequestBuilder.tsx       # Method/path/headers/query/body builder
│   ├── ResponseViewer.tsx       # Status code + body/headers tabs
│   ├── TeachingDrawer.tsx       # Slide-in explanation panel
│   ├── KeyValueEditor.tsx       # Reusable key-value pair editor
│   └── CodeGenTabs.tsx          # curl/fetch/axios/python code gen
├── hooks/
│   └── useLessonState.ts       # State management + localStorage
└── lib/
    ├── types.ts                 # Shared TypeScript types
    └── lessons/                 # Scenario engine handlers
        ├── get-query-basics.ts
        ├── post-json-validation.ts
        ├── auth-bearer.ts
        ├── pagination-filtering.ts
        └── cors-preflight.ts
public/
└── lessons/                     # Lesson JSON definitions
    ├── get-query-basics.json
    ├── post-json-validation.json
    ├── auth-bearer.json
    ├── pagination-filtering.json
    └── cors-preflight.json
```

## Lessons

| # | Lesson | Concept |
|---|--------|---------|
| 1 | GET Query Basics | Query params, pagination |
| 2 | POST JSON Validation | Body validation, Content-Type |
| 3 | Bearer Token Auth | Authorization header, tokens |
| 4 | Pagination & Filtering | Paginated results, filters |
| 5 | CORS & Preflight | Cross-origin requests, OPTIONS |

## Features

- **Animated Flow Panel** — Watch your request travel through 7 stages (client → server → auth → validate → service → db → response)
- **Interactive Request Builder** — Edit method, path, headers, query params, and JSON body
- **Break-it Mode** — Inject common mistakes to learn from errors
- **Code Generation** — Auto-generated curl, fetch, axios, and Python code
- **Teaching Drawer** — Explains every response with fix steps and common mistakes
- **Progress Tracking** — localStorage-based progress with checkmarks
