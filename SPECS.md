# FitAI — Project Specifications

## Overview

FitAI is a meal tracking web app. Users log what they eat each day (breakfast, lunch, dinner, snack), and the app calculates their daily intake — calories, protein, carbs, and fat — in real time.

Food data (nutrients per 100g, serving sizes, etc.) is fetched from the **Open Food Facts** public API, so no manual food database is needed.

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Frontend     | React + Vite + TypeScript + TailwindCSS         |
| Backend      | Java + Spring Boot                              |
| Database     | Supabase (PostgreSQL)                           |
| Auth         | Supabase Auth                                   |
| Food Data    | Open Food Facts API (via backend proxy)         |
| Deployment   | Frontend: Netlify — Backend: TBD                |

---

## Authentication

- Supabase Auth handles register and login entirely on the frontend using the Supabase JS client.
- After login, the Supabase session JWT is stored by the Supabase client automatically.
- Every request to the Spring Boot backend includes `Authorization: Bearer <supabase_jwt>`.
- The backend validates the JWT using the Supabase JWT secret (`SUPABASE_JWT_SECRET` env var) — no custom JWT logic needed.
- The `userId` extracted from the JWT is used to scope all database queries.

---

## Screens

### Screen 1 — Auth (login / register)

Shown when no active Supabase session exists.

- Simple two-tab form: "Login" / "Register"
- Register: email + password (Supabase handles everything)
- Login: email + password
- On success: navigate to the Daily Log screen

### Screen 2 — Daily Log (main screen)

The only screen after login. Shows everything for the current day.

#### Layout

```
[ Header: date + logout button                        ]
[ MacroSummary: calories / protein / carbs / fat bars ]
[ Meal sections: Breakfast | Lunch | Dinner | Snack   ]
[ Each meal: list of logged foods + remove button     ]
[ "Add food" button per meal → opens FoodSearch       ]
```

#### MacroSummary
- Shows total calories, protein (g), carbs (g), fat (g) for the day
- Calculated by summing all logged meal entries
- Updates immediately when a food is added or removed

#### Meal Sections
- Four fixed sections: Breakfast, Lunch, Dinner, Snack
- Each section lists all foods logged under it for today
- Each food row shows: food name, quantity (g), calories, protein, carbs, fat
- "Remove" button on each row deletes the entry immediately

#### Add Food Flow
1. User clicks "Add food" under a meal section
2. FoodSearch modal opens — user types a food name
3. App calls `GET /api/v1/food/search?q=...` (backend proxies to Open Food Facts)
4. Results list appears — each result shows product name + macro preview per 100g
5. User selects a result, enters quantity in grams
6. App calls `POST /api/v1/log` to save the entry
7. Modal closes, entry appears in the meal section, MacroSummary updates

---

## Open Food Facts Integration

### How it works
- Open Food Facts is a free, open food database with no API key required
- Base URL: `https://world.openfoodfacts.org/cgi/search.pl`
- Example search: `?search_terms=banana&search_simple=1&action=process&json=1`
- Returns product list with `nutriments` object containing `energy-kcal_100g`, `proteins_100g`, `carbohydrates_100g`, `fat_100g`

### Backend proxy (`FoodSearchService.java`)
- The frontend never calls Open Food Facts directly
- `GET /api/v1/food/search?q={query}` → backend calls Open Food Facts → returns a cleaned list to frontend
- Response DTO per result:
  ```json
  {
    "productName": "Banana",
    "caloriesPer100g": 89,
    "proteinPer100g": 1.1,
    "carbsPer100g": 23.0,
    "fatPer100g": 0.3
  }
  ```
- Filter out results that are missing any macro field
- Limit results to 10 per search

### Macro calculation (frontend)
When the user enters a quantity in grams:
```
calories = (caloriesPer100g / 100) * quantity
protein  = (proteinPer100g  / 100) * quantity
carbs    = (carbsPer100g    / 100) * quantity
fat      = (fatPer100g      / 100) * quantity
```
Round all values to 1 decimal place before saving and displaying.

---

## Data Model (Supabase / PostgreSQL)

### `meal_entries` table

| Column       | Type      | Notes                              |
|--------------|-----------|------------------------------------|
| id           | uuid (PK) | auto-generated                     |
| user_id      | text      | from Supabase Auth JWT             |
| date         | date      | e.g. `2026-05-10`                  |
| meal_type    | text      | `breakfast`, `lunch`, `dinner`, `snack` |
| food_name    | text      |                                    |
| quantity_g   | numeric   | grams entered by user              |
| calories     | numeric   | calculated at save time            |
| protein_g    | numeric   |                                    |
| carbs_g      | numeric   |                                    |
| fat_g        | numeric   |                                    |
| created_at   | timestamp | auto-generated                     |

> No other tables needed for this MVP.

---

## REST API Endpoints

| Method | Path                        | Auth required | Description                              |
|--------|-----------------------------|---------------|------------------------------------------|
| GET    | `/api/v1/food/search?q=...` | Yes           | Proxy search to Open Food Facts          |
| GET    | `/api/v1/log?date=YYYY-MM-DD` | Yes         | Get all meal entries for a given day     |
| POST   | `/api/v1/log`               | Yes           | Add a new meal entry                     |
| DELETE | `/api/v1/log/{id}`          | Yes           | Remove a meal entry                      |

### POST `/api/v1/log` — Request body
```json
{
  "date": "2026-05-10",
  "mealType": "breakfast",
  "foodName": "Banana",
  "quantityG": 120,
  "calories": 106.8,
  "proteinG": 1.3,
  "carbsG": 27.6,
  "fatG": 0.4
}
```

### GET `/api/v1/log` — Response body
```json
[
  {
    "id": "uuid",
    "mealType": "breakfast",
    "foodName": "Banana",
    "quantityG": 120,
    "calories": 106.8,
    "proteinG": 1.3,
    "carbsG": 27.6,
    "fatG": 0.4
  }
]
```

All protected endpoints require `Authorization: Bearer <supabase_jwt>`. The backend extracts `user_id` from the token — it is never sent by the client directly.

---

## Environment Variables

### Backend (`application.properties` / env)
```
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here
SUPABASE_URL=https://your-project.supabase.co
DATABASE_URL=jdbc:postgresql://db.your-project.supabase.co:5432/postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_supabase_db_password
```

### Frontend (`.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=http://localhost:8080
```

---

## Build Order

### Backend (start here)
1. Spring Boot project setup — dependencies: Web, Spring Data JPA, PostgreSQL driver, Validation, Security
2. `SupabaseJwtFilter.java` — validate Bearer token on every request, extract userId
3. `model/MealEntry.java` — JPA entity
4. `repository/MealEntryRepository.java` — Spring Data JPA interface
5. `dto/` — request + response DTOs with `@Valid` annotations
6. `service/FoodSearchService.java` — Open Food Facts proxy logic
7. `service/LogService.java` — CRUD for meal entries (scoped by userId)
8. `controller/FoodSearchController.java` + `controller/LogController.java` — thin controllers

### Frontend (after backend is ready)
1. `src/lib/supabase.ts` — Supabase client init
2. `src/types/index.ts` — shared TypeScript interfaces
3. `src/lib/api.ts` — Axios wrappers that attach the Supabase JWT
4. `src/components/Auth.tsx` — login / register
5. `src/components/FoodSearch.tsx` — search modal
6. `src/components/DailyLog.tsx` — meal sections + food rows
7. `src/components/MacroSummary.tsx` — daily totals bar
8. `src/components/Dashboard.tsx` — layout wrapper
9. `src/App.tsx` — routing (auth vs dashboard)

---

## Design Guidelines

- **Color scheme:** Clean, modern. White background, green accents (fitness feel).
- **Font:** System font stack or Inter.
- **Styling:** TailwindCSS utility classes only — no external UI component libraries.
- **Language:** English UI.
- **Responsive:** Works on desktop and mobile.
- **No animations required** for MVP — keep it simple and functional.

---

## Features — Priority Order

### Must have (MVP)
- [ ] Register / login via Supabase Auth
- [ ] Daily log view: add and remove foods per meal type
- [ ] MacroSummary: total calories, protein, carbs, fat for the day
- [ ] Food search via Open Food Facts (backend proxy)
- [ ] Quantity input in grams → auto-calculated macros

### Nice to have (v2)
- [ ] Weekly history view — past days' logs
- [ ] Weight tracking + chart
- [ ] Vitamin/micronutrient display (if available from Open Food Facts)
- [ ] Barcode scanner for food lookup

---

*Built by Ben Abraham — FitAI meal tracker*
