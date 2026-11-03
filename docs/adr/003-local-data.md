# ADR 003: Versioned browser-local state

Status: accepted.

IndexedDB persists one versioned workspace containing workflow graphs, execution snapshots, onboarding, editor preferences, and theme. Each browser origin is isolated. Zod validates load and import boundaries. Schema v1 deliberately migrates to v2; unknown versions fail with visible recovery instead of being interpreted accidentally.

Serial writes preserve ordering. A small versioned synchronous localStorage preference cache handles immediate refreshes, while IndexedDB remains the full workspace store. Schema-invalid transient edits never replace the last valid stored workspace. A short debounce reduces writes while editing. Explicit Save awaits persistence. LocalStorage provides a limited fallback, followed by an in-memory workspace with export guidance if storage is unavailable. Exports/imports are JSON and limited to 5 MB. History retains 500 executions and undo retains 50 graph snapshots.

A backend would enable multi-device collaboration, but would add authentication, operational dependencies, and data privacy responsibilities. None are required for an isolated demo. Browser quotas and clearing data remain real limits; the UI offers export and reset controls and makes no cloud-backup promise.
