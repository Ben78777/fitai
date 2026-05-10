# FitAI – Claude Instructions

## Project Overview
FitAI is a personal fitness and nutrition tracking web app.
Users log their meals (breakfast, lunch, dinner, snack) and see their daily macros (calories, protein, carbs, fat) in real time.
Food data (nutrients) comes from the Open Food Facts public API.
See SPECS.md for the full feature breakdown, data models, and API contract.

## Tech Stack
- **Frontend:** React + Vite + TypeScript + TailwindCSS
- **Backend:** Java + Spring Boot
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (handled client-side; backend validates the Supabase JWT)
- **Food Data:** Open Food Facts API (called from the backend only)

---

## Code Style & Preferences

### General
- Add short, meaningful inline comments — explain *why*, not *what*
- All comments must be in **English only**
- Keep code clean and readable; prefer clarity over cleverness

### Java / Spring Boot
- Follow Spring Boot best practices strictly
- Use **constructor injection** — never field injection (`@Autowired` on fields)
- Always use **DTOs** for request and response bodies — never expose entities directly
- Use `@Valid` and validation annotations on all DTOs
- Keep controllers thin — business logic belongs in the service layer
- Use proper HTTP status codes (`201 Created`, `400 Bad Request`, `404 Not Found`, etc.)
- REST endpoints follow the pattern: `/api/v1/...`
- Supabase JWT validation: extract and verify the Bearer token on every protected endpoint

### Frontend (React)
- Use functional components with hooks only — no class components
- Keep components small and focused (single responsibility)
- Store global state only when necessary
- Supabase Auth client handles login/register/session; pass the session JWT in `Authorization: Bearer` headers to the Spring Boot backend

---

## Project Structure

Be flexible — if a better structure makes sense, suggest it with a short explanation before implementing.
Don't create new folders or major structural changes silently.

### Frontend (`/frontend/src`)
```
/components
  Auth.tsx              ← login + register forms (Supabase Auth)
  Dashboard.tsx         ← main layout
  DailyLog.tsx          ← today's meals list + add/remove controls
  MacroSummary.tsx      ← calories / protein / carbs / fat totals
  FoodSearch.tsx        ← search bar → Open Food Facts results → add to log
/lib
  api.ts                ← Axios wrappers for all Spring Boot REST calls
  supabase.ts           ← Supabase client init
/types
  index.ts              ← shared TypeScript interfaces
App.tsx
main.tsx
```

### Backend (`/backend/src/main/java/com/fitai`)
```
/controller
  LogController.java        ← add / remove / list meal entries for a day
  FoodSearchController.java ← proxy to Open Food Facts
/service
  LogService.java
  FoodSearchService.java    ← all Open Food Facts API logic lives here
/dto
  /request
  /response
/model                      ← JPA entities (never exposed directly in responses)
  MealEntry.java
/repository
  MealEntryRepository.java
/security
  SupabaseJwtFilter.java    ← validates Supabase JWT on every request
/config
```

---

## Testing
- Write tests for **everything** — no exceptions
- Backend: JUnit 5 + Mockito for all service-layer logic
- Frontend: cover key user flows and components
- Tests live alongside the code they test

---

## Git
- Use simple, short commit messages (e.g. `add meal log endpoint`, `fix macro calc bug`)
- No need for conventional commit prefixes

---

## What NOT to Do
- Don't use `@Autowired` on fields
- Don't expose database entities directly in API responses
- Don't put business logic inside controllers
- Don't call Open Food Facts from the frontend — always proxy through the backend
- Don't create files or folders in new locations without a quick note explaining why
- Don't skip writing tests
- Don't store the Supabase service role key in the frontend — backend only
