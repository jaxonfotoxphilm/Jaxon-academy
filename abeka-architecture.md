# Project Context: Abeka Scholar (The Christian Homeschool Academy)
**Lead Architect:** EternaL Beatx
**Current Phase:** Phase 4 Completed (Level 2 Mechanics, Trivia Engine, & Top-Down Arcade Engine)

## 1. Project Overview
Abeka Scholar is an interactive, gamified homeschooling application. It replaces traditional study modules with fully playable 2D games (using HTML5 Canvas) to teach subjects like Bible history and Language Arts. The app tracks student progress and automatically syncs "Excellence Scores" to a cloud database, which parents can monitor via the "Principal's Desk" dashboard.

## 2. Tech Stack
* **Frontend:** React (Vite setup), TypeScript, Tailwind CSS
* **Backend/Database:** Supabase
* **Game Engine:** Native HTML5 Canvas (`requestAnimationFrame` loops)

## 3. Database Schema (Supabase)
The project connects to a Supabase instance using environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`). 
Row Level Security (RLS) is enabled for the `anon` role (both `SELECT` and `INSERT` policies are set to `true`).

**Table: `student_progress`**
* `id` (int8, primary key)
* `student_name` (text)
* `subject` (text)
* `score` (int4) - Represents the "Excellence Score" (0-100)
* `level_reached` (int4)

## 4. Current File Structure & Component Roles
* `src/App.tsx`: The main router. Manages global state (`currentUser`, `currentView`). Handles navigation between the Login screen, the Game view, and the Dashboard.
* `src/supabaseClient.ts`: Initializes the Supabase client using Vite environment variables.
* `src/components/Login.tsx`: Simple auth gateway. Sets the `playerName` which is passed down to other components.
* `src/components/ParentDashboard.tsx` (Principal's Desk): Fetches the top 20 records from `student_progress` and displays them in a Tailwind-styled data table.
* `src/components/VirtualJoystick.tsx`: Provides mobile/tablet touch controls mapped to keyboard events for game inputs.
* `src/components/AdventureGame.tsx`: The core game engine. 

## 5. Current Game Engine State: "Biblical Adventures"
The `AdventureGame.tsx` component currently contains a fully functioning 2D side-scroller ("Path to the Ark" - Level 1).
* **Physics:** Includes gravity, jumping (`JumpPower`), ground collision, and lateral movement (WASD/Arrows + Touch).
* **Collectibles:** The player collects "Scripture Scrolls" (gold circles) which dynamically increase the Excellence Score state.
* **Win State:** Hitting the goal ("The Ark" bounding box) triggers a 'Level Complete' screen.
* **Auto-Save:** Upon game over/win, a `useEffect` automatically pushes the calculated Excellence Score to the Supabase `student_progress` table for the current `playerName`.

## 6. Next Immediate Steps (Phase 5)
* **App Routing & Polish:** Integrate `AdventureGameLevel2` and `GrammarGuardian` into the main `App.tsx` menu.
* **Dynamic Trivia:** Connect `ProfessorGraceTrivia` to a Supabase table or JSON array to fetch randomized subject-specific questions.