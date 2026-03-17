# Web Prototype (Intent Router UI)

This folder contains a prototype page for the routing flow:

`GDT Main Chat -> Detect User Intention -> Specialist Thread`

## Files

- `app/page.tsx`: flow layout and route lanes
- `app/globals.css`: tokenized visual style inspired by the provided design

## Notes

- The implementation follows the provided flow and model labels.
- Exact visual parity depends on authenticated Figma MCP or API token export.
- Once Figma MCP is available, replace placeholder style values with canonical design tokens from `packages/ui`.

## Preview Locally

Run from `apps/web`:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.
