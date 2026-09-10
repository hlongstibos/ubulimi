# Release notes

`Ubulimi-V1-Release-Notes.docx` is generated from `gen.js` (uses the [`docx`](https://www.npmjs.com/package/docx) library — no Word required).

## Regenerate

```bash
cd docs/release-notes
npm install
npm run build      # writes Ubulimi-V1-Release-Notes.docx
```

## Updating for a new commit

Edit the content arrays in `gen.js` — the header line, the release-summary
table, the feature sections (§3.x), the routes table (§4), the migrations
table (§5), the commit-history table (§10) and the verification section
(§11) — then rebuild and commit both `gen.js` and the `.docx`.
