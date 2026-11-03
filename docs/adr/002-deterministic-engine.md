# ADR 002: Framework-independent, deterministic execution

Status: accepted.

The engine must be inspectable, reproducible, and usable outside React. Typed contracts and safe structured operators replace expression evaluation. The single-path DAG traversal is explicit: one trigger, ordinary next edges, true/false condition paths, and End nodes. Cycles and parallel fan-out are rejected rather than guessed.

Each run has an input, seed, virtual start time, and workflow snapshot. Logical results do not use wall-clock time or randomness. HTTP uses an allowlisted fixture enum, notifications append records, delays advance virtual time, and classification uses keyword rules. Bounded retry fixtures exercise recovery without external calls. Cancellation is cooperative between steps.

A generic plugin-execution system or arbitrary JavaScript interpreter would create security and correctness costs unrelated to this local product. Parallel scheduling and loops would require concurrency semantics, join rules, and termination controls; they are intentionally unsupported.

`CopilotAdapter` isolates assistance. The current adapter matches documented intents, selects templates, and introspects actual graph/trace data. A future provider adapter could share the UI contract, but would require explicit privacy, credentials, and network design. The present product does not imply an LLM exists.
