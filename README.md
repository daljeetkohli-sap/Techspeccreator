# Techspeccreator

TechDoc Studio is a local React/Vite app for creating technical specifications for SAP developments from implementation notes, screenshots, and code snippets.

## What It Does

- Provides solution-area presets for SAP ABAP, SAP Integration Suite/CPI, SAP BTP Fiori apps, SAP CAP apps, Azure Logic Apps, SAP Spartacus, SAP Commerce Cloud, SAP RAP, SAP BW/Datasphere, and SAP MDG.
- Changes the checklist and technical design sections dynamically by solution area, so ABAP, Fiori, CAP, Integration, Commerce, and other SAP areas get different document sections.
- Always includes the core technical-spec headers: purpose, implementation summary, process flow, business process, template alignment, checklist, technical design, configuration, code understanding, screenshot evidence/review, unit testing, integration testing, regression/UAT, deployment, monitoring/support, risks, and approval handover.
- Generates area-specific checklist details, testing strategy, risk controls, support notes, and technical design guidance for every supported solution area.
- Captures document title, owner, landscape, process notes, configuration notes, testing notes, risks, and code snippets.
- Adds FAIR CONSULTING GROUP branding to every generated document and supports an optional customer logo upload for the Word export header.
- Asks whether to **Create automatically** or **Use my template** before generating the spec.
- In **Create automatically** mode, generates a tech-spec structure from the selected SAP area, code snippet, screenshots, and notes.
- In **Use my template** mode, uploads a PDF, DOC, or DOCX template and lets users add template headings, style rules, mandatory tables, and approval requirements.
- Uploads screenshot evidence and lets you add captions, visible text, screenshot type, and reviewer notes for each figure.
- Reviews code snippets for SAP/Azure patterns and adds a generated code-understanding section.
- Reviews screenshot evidence from its type, caption, visible text, and notes, then adds a generated technical interpretation section.
- Generates a structured Word-compatible `.doc` file with the required generic headers plus dynamic solution-area technical sections and area-specific validation guidance.
- Copies generated document text to the clipboard and opens Preview so the generated content is visible.
- Downloads a Word-compatible `.doc` file; if an embedded browser blocks downloads, open the app in Chrome or Edge and try again.
- Saves form inputs locally in the browser with `localStorage`.

## Developer Handoff

- Use `BETA_TESTING.md` for the beta test checklist.
- The app is frontend-only and does not require backend services.
- Screenshot images stay in the active browser session; exported Word documents contain embedded screenshots, figure descriptions, captured visible text, and generated technical interpretation.
- The app does not perform OCR or server-side AI vision. It creates the best technical spec when testers paste key visible screenshot text, object names, status messages, errors, message IDs, or transaction details into each screenshot card.
- The app can read plain text from some uploaded template files, but it does not deeply parse every PDF/DOCX layout in-browser. For best template alignment, testers should paste the required headings, section order, and style rules into Template Guidance after uploading the template.
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
