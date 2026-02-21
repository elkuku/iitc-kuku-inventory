# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn build          # Build development version
yarn build:dev      # Build development version explicitly
yarn build:prod     # Build production version
yarn start          # Start file server for local development
yarn autobuild      # Watch and rebuild on changes
```

There is no test suite. Linting is via ESLint (`eslint.config.js`) — run it with `npx eslint src/`.

## Architecture

This is an **IITC (Ingress Intel Total Conversion) plugin** that displays an agent's Ingress inventory. It is built with the [IITC Plugin Kit](https://github.com/IITC-CE/iitcpluginkit) and TypeScript.

### Data Flow

```
Ingress API → InventoryFetcher → InventoryParser → InventoryHelper → UI components
```

1. **`InventoryFetcher`** — fetches inventory via IITC's `postAjax` wrapper; caches to `localStorage` with 10-minute expiration to avoid rate limiting.
2. **`InventoryParser`** — converts the raw Ingress API response into typed `Inventory.Items` objects.
3. **`InventoryHelper`** — aggregates parsed data into `Map<string, KeyInfo>` (keyed by portal GUID), tracking keys in-hand vs. per-capsule.
4. **UI layer** (`DialogHelper`, `LayerHelper`, `SidebarHelper`) — consumes `KeyInfo` to render the dialog (Handlebars templates + jQuery tabs), map markers, and portal sidebar injection.

### Key Files

| File | Role |
|---|---|
| `src/Main.ts` | Plugin entry point; implements `Plugin.Class`; wires all helpers and IITC hooks |
| `src/DialogHelper.ts` | Main dialog UI; renders Handlebars templates; manages jQuery UI tabs |
| `src/InventoryFetcher.ts` | API calls + localStorage caching |
| `src/InventoryParser.ts` | Raw API → typed structures |
| `src/InventoryHelper.ts` | Aggregates parsed data into `KeyInfo` map |
| `src/LayerHelper.ts` | Map markers for portals with keys |
| `src/SidebarHelper.ts` | Injects key counts into IITC's portal sidebar |
| `src/StorageHelper.ts` | Persists capsule name mappings; integrates with optional sync plugin |
| `types/Types.ts` | Core type definitions (`KeyInfo`, etc.) |
| `types/IngressAPI.ts` / `types/IngressInventory.ts` | Ingress API response types |
| `templates/*.hbs` | Handlebars templates for dialog rendering |
| `plugin.json` | IITC plugin metadata (name, id, entry point, download URL) |

### IITC Hooks Used

- `portalAdded` / `portalRemoved` — maintain map markers
- `portalSelected` — update marker detail on selection
- `portalDetailsUpdated` — inject key info into sidebar

### Code Style

- Semicolon-free TypeScript (enforced by ESLint)
- Arrow functions preferred over `function` declarations
- Strict TypeScript: `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`
- Filenames must be PascalCase (enforced by `eslint-plugin-unicorn`)
- Target: ES2023, module: ES6, output to `dist/`