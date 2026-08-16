# Plan 21.2 Summary

- **Deployment Exclusions**: Created `.netlifyignore` at the root of the project.
- **Ignored Directories**: Added `scripts/`, `.gsd/`, `tests/`, and `node_modules/` to ensure they are excluded from the Netlify production build process, saving bandwidth and preventing accidental deployment of migration and automation logic.
