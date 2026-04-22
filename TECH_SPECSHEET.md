# TechDoc Studio Specsheet

## Product Summary

TechDoc Studio is a browser-based documentation accelerator for creating SAP and enterprise delivery documents from real implementation evidence. The app is designed to generate useful first-draft technical specifications, functional specs, support runbooks, and handover packs from either a code snippet/file or screenshot evidence.

The current product direction is evidence-first: before users can generate, copy, export, or publish a document, they must choose the solution area and provide one active evidence source. The generated document name, business process, process flow, technical sections, testing focus, monitoring notes, and handover content should be derived from the supplied code or screenshot wherever possible. Manual fields remain available mainly for governance details, optional notes, versioning, ownership, customer-specific context, and approvals.

## Problem It Solves

Technical documentation is often produced late, inconsistently, or from scattered evidence. Delivery teams usually have screenshots, iFlow diagrams, ABAP snippets, Fiori screens, CAP services, Azure workflows, Commerce configuration, testing evidence, and notes, but turning that into a readable handover document takes time.

TechDoc Studio standardizes that evidence capture process and generates structured `.docx` and Confluence-ready documentation that developers, functional consultants, QA teams, support teams, and approvers can review.

## Validated User Requirements

The app has been checked against the requested beta behavior:

| Requirement | Current Status |
| --- | --- |
| User must choose the solution area before taking actions | Implemented. Area selection is mandatory before evidence upload, template upload, branding upload, preview/export actions, and code/screenshot intake. |
| User must provide either code or screenshot evidence | Implemented. Copy, Confluence copy, and Word export are blocked until a solution area and evidence source exist. |
| Code and screenshot evidence should not mix from cache | Implemented. Adding screenshots clears code evidence. Pasting/uploading code clears screenshots. Changing solution area clears current evidence. |
| Document name should be derived from evidence | Implemented. The app derives title from code filename, detected code object, CPI/iFlow name, or screenshot caption/evidence before falling back. |
| Most content should come from code/screenshot | Implemented and improved. Process flow, technical design, screenshot interpretation, code understanding, and testing focus are evidence-driven. Manual notes are supporting context. |
| No hardcoded sample content in beta flow | Implemented. Active sample defaults were removed and migrated away from saved local state. |
| CPI/iFlow screenshot should be understood | Improved. The app now has iFlow screenshot type, OCR preprocessing, and CPI-specific extraction for iFlow name, adapters, source/target, mapping, auth, logging, and exception subprocesses. |
| Blank or missing input sections should be skipped | Implemented. Code and screenshot sections are only included when evidence exists. Missing inputs are not called out in the generated document. |
| Word export should be real `.docx` | Implemented. The app exports a real Word document with embedded generated logo, optional customer logo, screenshots, and technical flow diagram. |
| Confluence-ready option should exist | Implemented. The app can copy Confluence-friendly HTML with headings, tables, lists, code blocks, and rendered flow diagram. |
| Document formats should support Technical, Functional, Support Runbook, and Handover Pack | Implemented at structural level. Each format now produces different section emphasis, but deeper format-specific intelligence is still a roadmap item. |

## Current Capabilities

### Evidence-First Intake

The app now guides users in this order:

1. Choose solution area.
2. Choose document format.
3. Provide one active evidence source:
   - paste/upload code, or
   - upload screenshots and extract/paste visible text.
4. Add optional supporting notes, owner, version, system, template, risks, testing notes, and logos.
5. Preview, copy for Confluence, or download Word.

The app displays readiness checks when required inputs are missing. Example checks include:

- Solution area must be selected.
- Provide exactly one active evidence path.
- Screenshot evidence should have OCR text or reviewer notes.
- CPI/iFlow screenshots need visible step labels, adapters, systems, or iFlow name for strong extraction.
- Document name could not be confidently derived from evidence.

### Solution Area Coverage

The app currently supports:

- SAP ABAP
- SAP Integration Suite / CPI
- SAP BTP Fiori App
- SAP CAP App
- Azure Logic Apps
- SAP Spartacus
- SAP Commerce Cloud
- SAP RAP / Fiori Elements
- SAP BW / Datasphere
- SAP MDG

Each area has its own checklist, technical design sections, testing focus, risk prompts, support notes, and document guidance.

### Document Formats

The app supports these formats:

- Technical Spec
- Functional Spec
- Support Runbook
- Handover Pack

The selected format changes the generated section structure and content emphasis. Technical Spec remains the strongest and most mature output. Functional Spec, Runbook, and Handover Pack are usable for beta testing but should continue to be improved with real examples.

### Evidence Inputs

Users can provide:

- Code snippet pasted into the app
- Code file upload
- Screenshot upload
- Screenshot type
- Screenshot caption
- OCR-extracted visible text
- Reviewer notes and technical interpretation
- Optional template file/guidance
- Optional customer logo
- Optional owner/team
- Optional system/landscape if not visible in evidence
- Optional document version
- Optional revision summary
- Optional testing notes
- Optional risks and open items

The active evidence source is intentionally singular. This prevents a cached old screenshot from contaminating a new code-based spec, or an old code snippet from contaminating a screenshot-based spec.

### Branding

Generated documents include:

- Generic ABC Consulting logo
- ABC Consulting document branding
- Optional customer logo

The app no longer depends on a FAIR Consulting Group logo. Word exports use embedded image parts so logos render reliably in Microsoft Word and Google Docs.

Downloaded Word files use:

`TechSpec_<derived-document-name>_v<version>.docx`

### Template Handling

The app supports:

- Create automatically: uses the standard TechDoc Studio structure for the selected solution area and document format.
- Use my template: accepts PDF, DOC, or DOCX templates and lets users provide extracted or pasted template guidance.

DOCX and basic PDF text extraction exist in-browser, but deep layout reproduction is not yet implemented. The generated reader-facing document hides internal generation rules and only includes useful template alignment content.

### Generated Sections

Depending on format and evidence, the app can generate:

- Purpose
- Generated Implementation Summary
- Revision History
- Process Flow
- Technical Flow Diagram
- Business Process
- Template Alignment
- Document Type Focus
- Solution Area Checklist
- Technical Design
- Configuration Notes
- Code Understanding
- Code Snippet
- Screenshot Evidence
- Screenshot Review And Technical Interpretation
- Unit Testing
- Integration Testing
- Regression Testing And UAT
- Deployment And Transport
- Monitoring And Support
- Risks, Assumptions, And Open Items
- Approval And Handover

Code sections are skipped when code is not supplied. Screenshot sections are skipped when screenshots are not supplied.

## SAP Integration Suite / CPI Understanding

The latest CPI/iFlow work improves screenshot-based document generation for SAP Integration Suite.

For iFlow screenshots, the app can now infer:

- iFlow name, for example `Consignment_create_SAPECC_to_FarEye`
- Package/environment when visible
- Deployment status and runtime status when visible
- Source system, such as SAP ECC
- Target system, such as FarEye
- Sender and receiver adapters, such as AMQP and HTTP
- Main process steps, such as setting headers, logging payload, mapping, authorization, log attachment, and receiver post
- Authorization subprocess steps, such as client ID/secret, Base64 auth, access token, and auth header/property
- Mapping subprocess steps, such as JSON-to-XML, message mapping, application ID, XML-to-JSON, normalization, and persist data
- Exception subprocess/error logging

The app uses OCR preprocessing to improve small iFlow label recognition by enlarging and increasing screenshot contrast before browser OCR runs.

Important beta note: CPI/iFlow extraction is still OCR and rules based. It is improved, but not full AI vision. Screenshot quality and visible text matter.

## Code Understanding

The app detects patterns in supplied snippets, including:

- ABAP object and data access indicators
- CDS/RAP/service exposure signals
- OData/service binding patterns
- UI5/Fiori patterns
- SAP Integration Suite/CPI/Groovy patterns
- Azure Logic Apps workflow JSON
- SAP Commerce and Spartacus implementation signals
- Security-sensitive token patterns
- Error and exception handling
- Payload mapping/transformation behavior

The app should avoid overstating certainty. Code understanding is based on patterns and should be validated by the developer or consultant.

## Screenshot Understanding

The app performs browser-side OCR on screenshots and uses screenshot type, caption, extracted visible text, and reviewer notes to interpret what the image proves.

Supported screenshot categories include:

- SAP GUI / ABAP Workbench
- SAP Fiori / UI5 screen
- SAP BTP cockpit
- SAP Integration Suite monitor
- SAP Integration Suite iFlow design
- Azure Logic Apps run
- SAP Commerce Backoffice / HAC
- Code review / IDE
- Architecture or flow diagram
- Test evidence

The app now flags screenshots as a readiness gap when no OCR text or reviewer note is present, because a screenshot without readable context cannot reliably produce a strong technical specification.

## Process Flow And Technical Diagram

Process flow generation is now evidence-first.

The app derives flow from:

- CPI/iFlow steps and subprocesses when visible
- Code operations and detected implementation patterns
- Screenshot OCR text and reviewer notes
- Optional business/process notes if evidence does not provide enough detail

The Process Flow section includes:

- Written numbered process steps
- A compact green-and-black technical flow diagram
- Segregated technical steps rather than only high-level summaries

The diagram is included in preview, Word export, and Confluence copy.

## Word Export

The app exports a real `.docx` file using the `docx` package.

Word output includes:

- ABC Consulting branding
- Optional customer logo
- Metadata table
- Generated sections
- Process flow
- Technical flow diagram
- Code blocks when code is supplied
- Screenshot evidence and embedded screenshot images when screenshots are supplied
- Approval and handover table

Target compatibility:

- Microsoft Word
- Google Drive upload
- Google Docs conversion

## Confluence Publishing

The app includes a Copy for Confluence action that converts generated Markdown-style preview into clipboard HTML.

The Confluence copy supports:

- Headings
- Tables
- Bullet lists
- Numbered process steps
- Code blocks
- Rendered technical flow diagrams

Recommended beta usage:

1. Generate the document in the app.
2. Copy for Confluence.
3. Paste into the project/spec page.
4. Attach the exported Word file for audit/reference.
5. Use Confluence comments for developer and beta review.

Direct Confluence page create/update via Atlassian API is not implemented yet.

## Current Architecture

### Frontend

- React
- Vite
- Static GitHub Pages-ready deployment
- Browser-only runtime
- Local browser state using `localStorage`
- No backend dependency

### Document Export

- Uses `docx` for Word document generation.
- Uses generated SVG/PNG assets for logos and technical flow diagrams.
- Uses browser APIs for file download and clipboard copy.

### OCR

- Uses browser-side Tesseract OCR.
- Current OCR language selection supports English and several English-plus-European-language options.
- OCR is not SAP-screen-tuned yet.

### Data Handling

- Inputs are held in browser state.
- Form fields are saved locally in `localStorage`.
- Uploaded screenshots and logos stay in the browser session.
- No files are uploaded to a server.

## Known Constraints And Gaps

These are the remaining gaps after the latest validation:

- Full AI vision is not implemented. Screenshot understanding is OCR plus rules.
- CPI/iFlow topology extraction is improved but still depends on readable labels.
- OCR may miss small labels, dense diagrams, or low-resolution screenshots.
- PDF/DOCX template parsing is text-oriented and does not deeply preserve layout.
- No backend API exists yet.
- No user login, team workspace, or persistent document library exists yet.
- No direct Confluence API publishing yet.
- No live SAP, Azure, BTP, GitHub, Azure DevOps, Jira, or transport connectivity yet.
- Document quality still depends on the quality of evidence and beta feedback.
- Functional Spec, Support Runbook, and Handover Pack need more real-project examples to become as strong as Technical Spec.
- Code understanding remains pattern-based and can misclassify ambiguous snippets.
- The app does not yet create redacted screenshots or highlight screenshot regions.

## Beta Testing Goals

Beta testing should validate:

- Users understand they must choose solution area first.
- Users understand the one-active-evidence-source rule.
- Document title is correctly derived from real evidence.
- CPI/iFlow screenshots produce meaningful integration specs.
- Code snippets produce meaningful object/process/technical sections.
- Missing input sections are skipped instead of called out.
- Readiness checks are useful and not annoying.
- Word export opens correctly in Word and Google Docs.
- Confluence copy pastes cleanly.
- Technical flow diagram is useful and not overconfident.
- Dynamic solution-area sections are useful for ABAP, CPI, Fiori, CAP, Azure Logic Apps, Spartacus, Commerce, RAP, BW/Datasphere, and MDG.
- Approval and handover fields are usable for real governance.

## Target Users

- SAP developers
- Integration developers
- Fiori/UI5 developers
- CAP developers
- SAP Commerce/Spartacus developers
- Technical architects
- Functional consultants preparing handover packs
- QA and beta testing teams
- Support teams receiving project handover
- Delivery managers needing standardized documentation

## Roadmap

### Phase 1: Strong Beta-Ready Local Tool

Goal: make the current app reliable enough for controlled beta testing.

Completed or mostly completed:

- Mandatory solution area selection.
- Evidence required before export.
- Code-vs-screenshot cache clearing.
- Dynamic document name from evidence.
- CPI/iFlow screenshot extraction improvements.
- Real Word export.
- Confluence-ready copy.
- Generic ABC Consulting branding and optional customer logo.
- Readiness/gap checks before export.

Next improvements:

- Add a visible quality score before export.
- Add evidence confidence labels, such as Confirmed, Inferred, Needs Review.
- Improve wording for each solution area using real beta examples.
- Improve document preview so it looks closer to the final Word document.
- Add export quality checks for missing title, weak OCR, missing process flow, missing testing, missing deployment notes, missing monitoring notes, and incomplete approval fields.
- Add screenshot annotation and redaction support.
- Add better differentiated output for Functional Spec, Support Runbook, and Handover Pack.

### Phase 2: Smarter Evidence Understanding

Goal: reduce manual effort when using screenshots, code, and templates.

Planned capabilities:

- Higher-accuracy OCR tuned for SAP GUI, CPI/iFlow, Azure Logic Apps, ABAP editor, and IDE screenshots.
- AI-assisted screenshot interpretation.
- AI-assisted code explanation.
- AI-assisted process flow extraction.
- Better iFlow topology extraction from screenshots and, where available, exported iFlow XML/artifacts.
- Automatic field/object extraction from ABAP, CDS, XML, JSON, JavaScript, Groovy, and workflow definitions.
- Automatic test scenario generation from code and screenshots.
- Spec freshness detection against new code, screenshots, or repository changes.
- Better parsing of uploaded Word/PDF templates.

### Phase 3: Team Collaboration

Goal: move from single-user local tool to team-ready workspace.

Potential enhancements:

- User login and roles.
- Shared document workspace.
- Document version history and restore.
- Reviewer comments and section-level status.
- Draft, review, approved, and archived statuses.
- Approval workflow.
- Customer-specific template library.
- Centralized logo and branding management.
- Beta feedback dashboard.

### Phase 4: Enterprise Integrations

Goal: connect documentation to delivery systems.

Potential integrations:

- GitHub and Azure DevOps repositories.
- Pull-request-to-spec generation.
- Documentation freshness checks against merged changes.
- SAP transport references.
- SAP BTP cockpit metadata.
- SAP Integration Suite artifact import.
- Azure Logic Apps workflow JSON import.
- Jira / Azure Boards work item linking.
- Confluence / SharePoint publishing.
- Google Drive / Microsoft OneDrive document storage.

### Phase 5: Delivery Intelligence Platform

Goal: become a reusable consulting accelerator for documentation and support readiness.

Long-term capabilities:

- Generate technical specs, functional specs, support runbooks, test packs, release notes, and handover packs from the same evidence.
- Compare current specs against previous versions.
- Identify missing delivery evidence before release.
- Recommend test coverage by solution area.
- Generate support runbooks from technical specs.
- Generate architecture and process diagrams.
- Maintain a reusable knowledge base of solution patterns.
- Ask-this-spec chat across generated documents, screenshots, OCR text, and code snippets.
- AI-ready exports such as Markdown bundles, `llms.txt`, and reusable spec knowledge packs.

## Success Criteria

The app should be considered successful when:

- Developers can generate a useful first-draft specification in minutes.
- Beta testers can understand what was built without chasing scattered screenshots and code.
- Support teams receive enough information to monitor, troubleshoot, and own the solution.
- Customer documents follow consistent structure and branding.
- The generated `.docx` opens and edits reliably in Word and Google Docs.
- Confluence-ready content can be pasted cleanly.
- Delivery teams can reuse the tool across multiple SAP and enterprise technology areas.

## Recommended Next Decisions

- Select 3 to 5 real beta examples across CPI, ABAP, Fiori/CAP, and Commerce.
- Define the minimum acceptable quality score before customer handover.
- Decide whether screenshot understanding should move to backend AI vision.
- Decide whether next milestone should prioritize hosted deployment, Confluence API publishing, or deeper SAP Integration Suite artifact parsing.
- Confirm which document format should be hardened next after Technical Spec.
