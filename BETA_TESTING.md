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
- Generate a document for each solution area and confirm every output always includes the same required headers: Purpose, Generated Implementation Summary, Process Flow, Business Process, Template Alignment, Solution Area Checklist, Technical Design, Configuration Notes, Code Understanding, Code Snippet, Screenshot Evidence, Screenshot Review And Technical Interpretation, Unit Testing, Integration Testing, Regression Testing And UAT, Deployment And Transport, Monitoring And Support, Risks/Assumptions/Open Items, and Approval And Handover.
- Confirm the Technical Design subsections change dynamically by selected solution area while the required generic headers remain present.
- Confirm the official FAIR CONSULTING GROUP logo appears in the branding preview and downloaded Word documents for both **Create automatically** and **Use my template** modes.
- Upload an optional customer logo image and verify it appears in the downloaded Word document header; remove it and confirm the document still generates with FAIR branding only.
- Choose **Create automatically** and verify the generated automatic template outline is used in Template Alignment.
- Choose **Use my template**, upload PDF, DOC, and DOCX templates. Add template headings/style rules into Template Guidance and verify the downloaded Word spec uses that template guidance in Template Alignment.
- Add multiple screenshot files and verify preview cards, captions, notes, and remove actions.
- Add screenshot type, visible text/object names/status messages, and notes. Click Review image and verify the generated technical interpretation appears in the document text and downloaded Word file.
- Paste or attach ABAP, JSON, XML, JavaScript, Groovy, and CDS snippets and verify generated document text preserves formatting.
- Verify the Code Understanding section identifies relevant patterns such as ABAP logic, OData/service exposure, CAP/CDS, Fiori/UI5, CPI/Groovy, Azure Logic Apps, Commerce, Spartacus, error handling, and possible secrets.
- Verify the Process Flow section infers trigger/input, parse/map, validation, integration, data update, success outcome, exception path, and monitoring/support steps from the supplied code and screenshot evidence.
- Switch between Functional Spec, Technical Spec, Support Runbook, and Handover Pack.
- Use Copy doc and confirm Preview opens, status text appears, and document text is copied to the clipboard.
- Use Download Word and confirm the `.docx` file opens in Microsoft Word and Google Docs with embedded FAIR/customer logos, all required headers, inferred implementation summary, populated technical design sections, process flow, code, screenshot images, template alignment, technical interpretation, unit testing, integration testing, regression/UAT, deployment, monitoring/support, risks, and approval handover included. If the embedded browser blocks downloads, open the app in Chrome or Edge and retry, or use Copy doc as the fallback.
- Refresh the browser and confirm form data is restored from local storage.
- Reset the workspace and confirm screenshots and inputs are cleared.
- Test desktop, tablet, and mobile browser widths for readable layout and no text overlap.

## Known Constraints

- Screenshot files are used locally in the browser session and are not uploaded to a server.
- Generated output downloads as a real `.docx` file for better Word and Google Docs compatibility.
- Screenshot images are embedded into the downloaded Word file when uploaded in the current browser session.
- PDF/DOCX templates are referenced and guided by the Template Guidance field; the frontend does not deeply parse every proprietary template format.
- Screenshot understanding depends on the screenshot type, caption, pasted visible text, and reviewer notes because this frontend-only version does not perform OCR.
- The app currently has no backend, authentication, or shared team storage.

## Developer Notes

- Main app: `src/App.jsx`
- Styling: `src/styles.css`
- Entry point: `src/main.jsx`
- Build output: `dist/` after running `npm run build`
