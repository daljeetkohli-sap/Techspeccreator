# Beta Testing Handoff

## App

TechDoc Studio is a local React/Vite app for generating SAP and enterprise technical documentation from implementation notes, screenshots, and code snippets.

## Setup

```bash
npm install
npm run dev
```

Open the localhost URL shown by Vite.

## Production Build Check

```bash
npm run build
```

## Suggested Beta Test Areas

- Confirm all solution area presets render correctly: SAP ABAP, SAP Integration Suite/CPI, SAP BTP Fiori, SAP CAP, Azure Logic Apps, SAP Spartacus, SAP Commerce Cloud, SAP RAP, SAP BW/Datasphere, and SAP MDG.
- Add multiple screenshot files and verify preview cards, captions, notes, and remove actions.
- Paste ABAP, JSON, XML, JavaScript, Groovy, and CDS snippets and verify generated Markdown preserves formatting.
- Switch between Functional Spec, Technical Spec, Support Runbook, and Handover Pack.
- Use Copy doc and confirm Markdown is copied to the clipboard.
- Use Export .md and confirm the downloaded filename and document content.
- Refresh the browser and confirm form data is restored from local storage.
- Reset the workspace and confirm screenshots and inputs are cleared.
- Test desktop, tablet, and mobile browser widths for readable layout and no text overlap.

## Known Constraints

- Screenshot files are used locally in the browser session and are not uploaded to a server.
- Generated output is Markdown text; screenshot image binaries are referenced as figure descriptions, not embedded in the exported Markdown.
- The app currently has no backend, authentication, or shared team storage.

## Developer Notes

- Main app: `src/App.jsx`
- Styling: `src/styles.css`
- Entry point: `src/main.jsx`
- Build output: `dist/` after running `npm run build`
