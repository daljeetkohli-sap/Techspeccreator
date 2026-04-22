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
- Switch between SAP ABAP and SAP BTP Fiori and verify the section list changes. ABAP should show backend-focused sections like ABAP object inventory, data access, performance, error handling, and transport; Fiori should show UI/UX, Fiori Elements annotations, UI5 components, OData/service binding, launchpad, roles, and accessibility.
- Switch through every solution area and verify checklist rows, technical design guidance, testing focus, risks, and support notes are specific to that area rather than generic.
- Generate a document for each solution area and confirm the core populated headers are consistent: Purpose, Generated Implementation Summary, Process Flow when process detail exists, Business Process, Template Alignment, Solution Area Checklist, Technical Design, Configuration Notes, testing, deployment, monitoring/support, risks, and Approval And Handover.
- Confirm Code Understanding, Code Snippet, Screenshot Evidence, and Screenshot Review sections appear only when code or screenshot artifacts are supplied.
- Confirm the Technical Design subsections change dynamically by selected solution area while the required generic headers remain present.
- Confirm the official FAIR CONSULTING GROUP logo appears in the branding preview and downloaded Word documents for both **Create automatically** and **Use my template** modes.
- Upload an optional customer logo image and verify it appears in the downloaded Word document header; remove it and confirm the document still generates with FAIR branding only.
- Choose **Create automatically** and verify the generated automatic template outline is used in Template Alignment.
- Choose **Use my template**, upload PDF, DOC, and DOCX templates. Add template headings/style rules into Template Guidance and verify the downloaded Word spec uses that template guidance in Template Alignment.
- Add multiple screenshot files and verify preview cards, captions, notes, and remove actions.
- Upload a code screenshot, SAP CPI/iFlow screenshot, workflow screenshot, or monitor screenshot. Click Extract text and confirm the visible text field is populated with readable OCR output.
- Correct any OCR mistakes in the visible text field, then confirm generated sections use the extracted text instead of generic screenshot wording.
- Add screenshot type, visible text/object names/status messages, and notes. Click Review image and verify the generated technical interpretation appears in the document text and downloaded Word file.
- Paste or attach ABAP, JSON, XML, JavaScript, Groovy, and CDS snippets and verify generated document text preserves formatting.
- Verify the Code Understanding section identifies relevant patterns such as ABAP logic, OData/service exposure, CAP/CDS, Fiori/UI5, CPI/Groovy, Azure Logic Apps, Commerce, Spartacus, error handling, and possible secrets.
- Verify the Process Flow section infers trigger/input, parse/map, validation, integration, data update, success outcome, exception path, and monitoring/support steps from the supplied code and screenshot evidence.
- Clear the code snippet and screenshots, regenerate the document, and confirm Code Snippet, Code Understanding, Screenshot Evidence, and Screenshot Review sections are skipped instead of saying inputs are missing.
- Confirm Template Alignment and the header table do not expose internal generated template structure, section numbering rules, or generation instructions.
- Confirm Approval And Handover includes concise approval/handover guidance plus sign-off fields rather than pasting the full Business Process text.
- Switch between Functional Spec, Technical Spec, Support Runbook, and Handover Pack.
- Use Copy doc and confirm Preview opens, status text appears, and document text is copied to the clipboard.
- Use Copy for Confluence and paste into a Confluence page. Confirm headings, tables, bullet lists, numbered process flow, and code blocks remain readable. Attach the downloaded Word file to the same Confluence page for audit/reference.
- Use Download Word and confirm the `.docx` file opens in Microsoft Word and Google Docs with embedded FAIR/customer logos, populated document sections, inferred implementation summary, technical design sections, process flow, template alignment, testing, deployment, monitoring/support, risks, and approval handover included. Confirm code and screenshot content appears only when those artifacts are supplied. If the embedded browser blocks downloads, open the app in Chrome or Edge and retry, or use Copy doc as the fallback.
- Refresh the browser and confirm form data is restored from local storage.
- Reset the workspace and confirm screenshots and inputs are cleared.
- Test desktop, tablet, and mobile browser widths for readable layout and no text overlap.

## Known Constraints

- Screenshot files are used locally in the browser session and are not uploaded to a server.
- Generated output downloads as a real `.docx` file for better Word and Google Docs compatibility.
- Screenshot images are embedded into the downloaded Word file when uploaded in the current browser session.
- PDF/DOCX templates are referenced and guided by the Template Guidance field; the frontend does not deeply parse every proprietary template format.
- Screenshot understanding uses screenshot type, caption, OCR-extracted visible text, pasted visible text, and reviewer notes. OCR accuracy depends on image clarity and does not replace full AI vision or manual review.
- Copy for Confluence uses browser clipboard support. If rich clipboard access is blocked, the app falls back to plain generated text.
- The app currently has no backend, authentication, or shared team storage.

## Developer Notes

- Main app: `src/App.jsx`
- Styling: `src/styles.css`
- Entry point: `src/main.jsx`
- Build output: `dist/` after running `npm run build`
