# Techspeccreator

TechDoc Studio is a local React/Vite app for creating technical specifications for SAP developments from implementation notes, screenshots, and code snippets.

## What It Does

- Provides solution-area presets for SAP ABAP, SAP Integration Suite/CPI, SAP BTP Fiori apps, SAP CAP apps, Azure Logic Apps, SAP Spartacus, SAP Commerce Cloud, SAP RAP, SAP BW/Datasphere, and SAP MDG.
- Changes the checklist and technical design sections dynamically by solution area, so ABAP, Fiori, CAP, Integration, Commerce, and other SAP areas get different document sections.
- Generates core technical-spec headers such as purpose, implementation summary, process flow with a flowchart-style technical diagram, business process, template alignment, checklist, technical design, configuration, testing, deployment, monitoring/support, risks, and approval handover.
- Adds code and screenshot sections only when those artifacts are supplied.
- Generates area-specific checklist details, testing strategy, risk controls, support notes, and technical design guidance for every supported solution area.
- Captures document title, owner, landscape, process notes, configuration notes, testing notes, risks, and code snippets.
- Adds the official FAIR CONSULTING GROUP logo to every generated document and supports an optional customer logo upload for the Word export header.
- Asks whether to **Create automatically** or **Use my template** before generating the spec.
- In **Create automatically** mode, generates a tech-spec structure from the selected SAP area, code snippet, screenshots, and notes.
- In **Use my template** mode, uploads a PDF, DOC, or DOCX template and lets users add template headings, style rules, mandatory tables, and approval requirements.
- Uploads screenshot evidence and lets you add captions, visible text, screenshot type, and reviewer notes for each figure.
- Extracts visible text from uploaded screenshot images using in-browser OCR, then uses that text for code, iFlow, workflow, and screenshot interpretation.
- Reviews code snippets for SAP/Azure patterns and adds a generated code-understanding section.
- Reviews screenshot evidence from its type, caption, visible text, and notes, then adds a generated technical interpretation section.
- Generates a structured `.docx` Word file with embedded FAIR/customer logos, dynamic solution-area technical sections, and area-specific validation guidance.
- Skips code and screenshot sections when those artifacts are not supplied, so the final document does not call out missing inputs.
- Copies generated document text to the clipboard and opens Preview so the generated content is visible.
- Copies a Confluence-friendly rich HTML version for pasting into a Confluence page while keeping the Word export available as an attachment/reference.
- Downloads a real `.docx` file using the `TechSpec_<document-title>.docx` naming pattern; if an embedded browser blocks downloads, open the app in Chrome or Edge and try again.
- Saves form inputs locally in the browser with `localStorage`.

## Developer Handoff

- Use `BETA_TESTING.md` for the beta test checklist.
- The app is frontend-only and does not require backend services.
- Screenshot images stay in the active browser session; exported `.docx` documents contain embedded logos, screenshots, figure descriptions, captured visible text, and generated technical interpretation.
- OCR is available for visible text extraction from screenshots, but the app does not yet perform full server-side AI vision or diagram topology understanding. Testers should review and correct OCR output before exporting customer-facing specs.
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
