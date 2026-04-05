# Storage Layer

This folder owns persistence implementations.

The rest of the app should depend on repository interfaces, not directly on IndexedDB details.

Planned implementations:

- local: IndexedDB
- later: hosted API-backed repository
