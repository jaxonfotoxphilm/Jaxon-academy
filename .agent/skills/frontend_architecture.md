# Skill: React Frontend Standards

Context: Building the user-facing React interface for the homeschooling platform.
Stack: React, Strict TypeScript (TSX).
Rules:
Structure: Functional components with React Hooks only. One primary component per file.

Type Safety: Explicit TypeScript interfaces for all props, state, and Supabase models. No 'any' types.

UX: All database/function calls must include robust error handling, retry logic, and UI loading states.

Separation: Abstract complex business logic or data transformations into custom hooks.
