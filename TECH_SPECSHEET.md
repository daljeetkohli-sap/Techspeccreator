# TechDoc Studio Specsheet

## Product Summary

TechDoc Studio is a browser-based documentation accelerator for creating SAP and enterprise delivery documents from real implementation evidence. The app is designed to generate useful first-draft technical specifications, functional specs, support runbooks, and handover packs from either a code snippet/file or screenshot evidence.

The current product direction is evidence-first: before users can generate, copy, export, or publish a document, they must choose the solution area and provide implementation evidence. Code and screenshots can be used together when consultants need both code-level detail and visual proof. The generated document name, business process, process flow, technical sections, testing focus, monitoring notes, and handover content should be derived from the supplied code or screenshot wherever possible. Manual fields remain available mainly for governance details, optional notes, versioning, ownership, customer-specific context, and approvals.

## Problem It Solves

Technical documentation is often produced late, inconsistently, or from scattered evidence. Delivery teams usually have screenshots, iFlow diagrams, ABAP snippets, Fiori screens, CAP services, Azure workflows, Commerce configuration, testing evidence, and notes, but turning that into a readable handover document takes time.

TechDoc Studio standardizes that evidence capture process and generates structured `.docx` and Confluence-ready documentation that developers, functional consultants, QA teams, support teams, and approvers can review.

## Validated User Requirements

The app has been checked against the requested beta behavior:

| Requirement | Current Status |
| --- | --- |
| User must choose the solution area before taking actions | Implemented. Area selection is mandatory before evidence upload, template upload, branding upload, preview/export actions, and code/screenshot intake. |
| User must provide implementation evidence | Implemented. Copy, Confluence copy, and Word export are blocked until a solution area and evidence source exist. Code and screenshots can now be used together when the consultant needs both implementation detail and visual proof. |
| Code and screenshot evidence should work together safely | Implemented. The app now supports combined code plus screenshot evidence and still clears evidence when the solution area changes. |
| Document name should be derived from evidence | Implemented. The app derives title from code filename, detected code object, CPI/iFlow name, or screenshot caption/evidence before falling back. |
| Most content should come from code/screenshot | Implemented and improved. Process flow, technical design, screenshot interpretation, code understanding, and testing focus are evidence-driven. Manual notes are supporting context. |
| Generated specs should use wider project context | Implemented for MVP. The app accepts manual context and can optionally import Jira Cloud issue context through a local read-only backend, then includes Jira/work item context, design/HLD notes, architecture references, meeting decisions, and API/mapping details in generated summaries and a Project Context section. |
| End users should be guided through the flow | Implemented. The app includes a Walk Me Through panel with step-by-step guidance and completion indicators for area selection, format, context, evidence, screenshot review, governance details, preview, and export. |
| SAP Commerce specs should not contain unrelated ABAP/CAP references | Improved. Commerce generation now prioritizes OCC/API entry points, facade/service paths, Commerce model access, DTO mapping, null checks, exception paths, impex/type-system, Backoffice/HAC, and system-update context. |
| No hardcoded sample content in beta flow | Implemented. Active sample defaults were removed and migrated away from saved local state. |
| Screenshots from any supported area should be understood | Improved. The app now treats OCR text, screenshot captions, and reviewer notes as implementation evidence across ABAP, CPI, Fiori/UI5, CAP/Node.js, Azure Logic Apps, Spartacus, SAP Commerce, RAP, BW/Datasphere, and MDG. CPI/iFlow has an additional specialized extractor. |
| Blank or missing input sections should be skipped | Implemented. Code and screenshot sections are only included when evidence exists. Missing inputs are not called out in the generated document. |
| Word export should be real `.docx` | Implemented. The app exports a real Word document with embedded generated logo, optional customer logo, screenshots, and technical flow diagram. |
| Confluence-ready option should exist | Implemented. The app can copy Confluence-friendly HTML with headings, tables, lists, code blocks, and rendered flow diagram. |
| Document formats should support Technical, Functional, Support Runbook, and Handover Pack | Implemented at structural level. Each format now produces different section emphasis, but deeper format-specific intelligence is still a roadmap item. |
| SAP Integration/CPI specs should capture mapping sheet references | Implemented. CPI documents now include a Mapping Sheet section and metadata placeholder for an Excel file, SharePoint link, Google Drive link, or repository reference. |

## Current Capabilities

### Living Specsheet

This file is the product tech specsheet for TechDoc Studio. It should be updated with every meaningful feature commit so developers and beta testers can see what the app can do now, what changed recently, and what is planned next.

Recent feature commits:

| Commit | Feature update |
| --- | --- |
| 939f57c | Added optional Jira Cloud context import through a local read-only backend. |
| 21e5812 | Added context-driven generation fields and Project Context output. |
| bf7767a | Fixed SAP Commerce evidence handling, combined code plus screenshots, and Commerce-specific code understanding. |
| fa3d7e9 | Improved consultant-ready spec generation, including CPI mapping sheet references and less overconfident evidence wording. |
| 543bb54 | Grouped iFlow technical diagram steps for clearer CPI flow diagrams. |
| d93d01e | Cleaned iFlow evidence derivation and reduced unclear/generic generated text. |
| d0f7b0c | Generalized screenshot evidence understanding across non-CPI solution areas. |
| 811d269 | Required evidence-driven document intake and improved generation gating. |

### Evidence-First Intake

The app now guides users in this order:

1. Choose solution area.
2. Choose document format.
3. Provide implementation evidence:
   - paste/upload code,
   - upload screenshots and extract/paste visible text, or
   - provide both code and screenshots when both implementation detail and visual proof are required.
4. Add optional supporting notes, owner, version, system, template, risks, testing notes, and logos.
5. Add project context such as Jira stories, HLD/design notes, architecture references, meeting decisions, and API/mapping details.
6. Preview, copy for Confluence, or download Word.

The app displays a Walk Me Through checklist so end users can follow the intended sequence without separate training material. It also displays readiness checks when required inputs are missing. Example checks include:

- Solution area must be selected.
- Provide code, screenshot evidence, or both.
- Screenshot evidence should have OCR text or reviewer notes.
- Screenshots need visible text or reviewer notes, such as object names, service/entity names, code snippets, UI labels, error text, workflow actions, adapters, systems, or file names, for strong extraction.
- SAP Integration/CPI specs should include a mapping sheet reference before final handover.
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
- Optional SAP Integration/CPI mapping sheet reference for source-to-target validation
- Optional Jira / work item context
- Optional Jira Cloud issue import through local backend
- Optional design document or HLD context
- Optional architecture or diagram reference
- Optional meeting notes and decisions
- Optional integration mapping, API, OpenAPI/Swagger, or source-to-target details

Code and screenshot evidence can be combined for beta usage. Changing the solution area still clears the current evidence so content from one area does not contaminate another.

### Context-Driven Generation

The app now supports a dedicated Project Context layer. Consultants can paste or reference:

- Jira epics, stories, defects, acceptance criteria, and release scope
- Design documents or HLD notes
- Architecture diagrams, sequence/data-flow notes, and source/target system context
- Meeting notes, decisions, open questions, and sign-off comments
- Integration mappings, API endpoint details, payload contracts, OpenAPI/Swagger links, and mapping sheet references

This context is used alongside code snippets and screenshot evidence. Generated documents include a Project Context section and use the context to improve the implementation summary, process alignment, testing scope, support handover, and review narrative.

The first Jira integration is read-only and local-demo focused. A small Node context server reads Jira credentials from `server/.env`, calls Jira Cloud REST APIs, and returns normalized story context to the browser. This avoids putting Jira API tokens in frontend code.

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
- Project Context
- Template Alignment
- Mapping Sheet for SAP Integration/CPI
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

## Dynamic Screenshot Understanding

Screenshot understanding is not limited to CPI/iFlow diagrams. The app now uses screenshot OCR text, captions, screenshot type, and reviewer notes as active implementation evidence for every supported solution area.

From screenshots, the app can infer or contribute to:

- Document name from visible file names, object names, service names, components, workflows, extensions, or screenshot captions.
- Business process and process flow from visible code, workflow steps, UI labels, error messages, actions, or notes.
- Technical design sections using the selected solution area's checklist and the evidence visible in the screenshot.
- Technical flow diagram steps from detected trigger/input, persistence, mapping, validation, API/service calls, UI behavior, security, exception handling, monitoring, and support signals.
- Testing and monitoring focus from visible logs, message IDs, run history, error text, application logs, screenshots, or reviewer notes.

Examples of supported screenshot evidence:

- ABAP program/class/report screenshots from SE38, SE80, ADT, or code review tools.
- CAP/Node.js screenshots showing `service.cds`, entities, handlers, Express routes, package files, API handlers, or service bindings.
- Fiori/UI5 screenshots showing `manifest.json`, controller, component, annotations, app UI, launchpad intent, or OData calls.
- SAP Commerce screenshots showing extensions, `items.xml`, impex, facades, populators, cronjobs, OCC, Backoffice, or HAC evidence.
- Spartacus screenshots showing Angular modules, routes, CMS mappings, guards/resolvers, facades, OCC calls, or storefront behavior.
- Azure Logic Apps screenshots showing triggers, connectors, run history, workflow JSON, action outputs, and retry/failure behavior.
- BW/Datasphere screenshots showing providers, transformations, queries, reconciliation, scheduling, or data quality evidence.
- MDG screenshots showing change request type, workflow, BRF+ validation/derivation, UI, replication, or audit trail evidence.

The app still depends on readable evidence. If OCR cannot capture the important text, users should paste visible text or add reviewer notes.

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
- Mapping sheet reference for source-to-target validation, including Excel file name, SharePoint link, Google Drive link, or controlled repository URL

The app uses OCR preprocessing to improve small iFlow label recognition by enlarging and increasing screenshot contrast before browser OCR runs.

Important beta note: CPI/iFlow extraction is still OCR and rules based. It is improved, but not full AI vision. Screenshot quality and visible text matter. The same principle applies to every other screenshot type.

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
- ABAP, CAP/Node.js, Fiori/UI5, Commerce, Spartacus, Azure, BW, MDG, and generic architecture/code screenshot signals when visible
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
- No backend dependency for document generation
- Optional local Node context server for Jira issue import

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

- Full AI vision is not implemented. Screenshot understanding is OCR plus cross-area rules.
- CPI/iFlow topology extraction is improved but still depends on readable labels.
- Non-CPI screenshots are interpreted from visible OCR text, screenshot type, caption, and notes; screenshots without readable text still need human notes.
- OCR may miss small labels, dense diagrams, or low-resolution screenshots.
- PDF/DOCX template parsing is text-oriented and does not deeply preserve layout.
- No hosted backend API exists yet; Jira import currently uses a local backend for MVP/demo usage.
- No user login, team workspace, or persistent document library exists yet.
- No direct Confluence API publishing yet.
- No live SAP, Azure, BTP, GitHub, Azure DevOps, or transport connectivity yet. Jira Cloud has an MVP read-only local import path.
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
- ABAP, CAP/Node.js, Fiori/UI5, Commerce, Spartacus, Azure Logic Apps, BW/Datasphere, and MDG screenshots produce meaningful area-specific specs when visible text or notes are supplied.
- Code snippets produce meaningful object/process/technical sections.
- Missing input sections are skipped instead of called out.
- Readiness checks are useful and not annoying.
- Walk Me Through gives clear end-user steps and updates completion indicators as users progress.
- Word export opens correctly in Word and Google Docs.
- Confluence copy pastes cleanly.
- Project context from Jira/story notes, design/HLD references, architecture notes, decisions, mappings, and API details appears in the generated document without overriding stronger code or screenshot evidence.
- Jira import retrieves story context through the local backend without exposing the API token in browser code.
- Technical flow diagram is useful and not overconfident.
- CPI mapping sheet reference appears in metadata, generated sections, Word export, and Confluence-ready copy.
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

### Planned Release Themes

| Release theme | Planned capabilities |
| --- | --- |
| Beta UX hardening | Richer Walk Me Through actions, section jump links, contextual examples by solution area, export quality score, and confidence labels. |
| Context integrations | Jira import hardening, Azure Boards import, Confluence page import, SharePoint/Google Drive design document links, and mapping/API reference import. |
| Evidence intelligence | Better OCR, AI-assisted screenshot interpretation, code explanation, process flow extraction, screenshot annotation, and redaction. |
| Artifact import | CPI iFlow XML import, Logic App JSON import, CAP project files, UI5 manifests, Commerce extension/config imports, and ABAP object metadata import. |
| Team workspace | User roles, shared document library, version history, review comments, approval workflow, and customer template library. |
| Publishing and governance | Direct Confluence publishing, SharePoint/Drive storage, spec freshness checks, release evidence checklist, and audit-ready handover packs. |

### Phase 1: Strong Beta-Ready Local Tool

Goal: make the current app reliable enough for controlled beta testing.

Completed or mostly completed:

- Mandatory solution area selection.
- Evidence required before export.
- Code-vs-screenshot cache clearing.
- Dynamic document name from evidence.
- Cross-area screenshot evidence extraction for ABAP, CPI, Fiori/UI5, CAP/Node.js, Azure Logic Apps, Spartacus, Commerce, RAP, BW/Datasphere, and MDG.
- Real Word export.
- Confluence-ready copy.
- Generic ABC Consulting branding and optional customer logo.
- Readiness/gap checks before export.
- Walk Me Through end-user checklist.

Next improvements:

- Add a visible quality score before export.
- Add richer walkthrough actions such as jumping to the relevant section and showing contextual examples by solution area.
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
- Better topology extraction from screenshots and, where available, exported artifacts such as iFlow XML, CAP project files, ABAP objects, UI5 manifests, Logic App JSON, Commerce extensions, and workflow/configuration exports.
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
