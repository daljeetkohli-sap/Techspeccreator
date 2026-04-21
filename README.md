# Techspeccreator

TechDoc Studio is a local React/Vite app for creating technical specifications for SAP developments from implementation notes, screenshots, and code snippets.

## What It Does

- Provides solution-area presets for SAP ABAP, SAP Integration Suite/CPI, SAP BTP Fiori apps, SAP CAP apps, Azure Logic Apps, SAP Spartacus, SAP Commerce Cloud, SAP RAP, SAP BW/Datasphere, and SAP MDG.
- Captures document title, owner, landscape, process notes, configuration notes, testing notes, risks, and code snippets.
- Uploads screenshot evidence and lets you add captions, visible text, screenshot type, and reviewer notes for each figure.
- Reviews code snippets for SAP/Azure patterns and adds a generated code-understanding section.
- Reviews screenshot evidence from its type, caption, visible text, and notes, then adds a generated technical interpretation section.
- Generates a structured Markdown document with purpose, process, technical design, configuration, code analysis, evidence review, testing, risks, and support notes.
- Copies generated Markdown to the clipboard or downloads it as a `.md` file.
- Saves form inputs locally in the browser with `localStorage`.

## Developer Handoff

- Use `BETA_TESTING.md` for the beta test checklist.
- The app is frontend-only and does not require backend services.
- Screenshot images stay in the active browser session; exported Markdown contains figure descriptions, captured visible text, and generated technical interpretation.
- The app does not perform OCR or server-side AI vision. For best screenshot understanding, testers should paste key visible text, object names, status messages, or errors into each screenshot card.
- Keep `node_modules/` and `dist/` out of Git. They are ignored by `.gitignore`.

## Run Locally

```bash
npm install
npm run dev
```

Open the localhost URL shown by Vite.

## Build

```bash
npm run build
```
