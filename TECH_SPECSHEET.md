# TechDoc Studio Specsheet

## Product Summary

TechDoc Studio is a local web app for creating SAP and enterprise technical specification documents from structured inputs, implementation notes, code snippets, screenshots, and optional customer templates.

The app is designed for delivery teams who need to turn development evidence into a readable technical specification quickly, especially across SAP ABAP, SAP Integration Suite, SAP BTP Fiori, SAP CAP, SAP Commerce, SAP Spartacus, SAP RAP, SAP BW/Datasphere, SAP MDG, and Azure Logic Apps.

## Problem It Solves

Technical documentation is often created late, inconsistently, or from scattered delivery evidence. Developers, functional consultants, support teams, and customers may all need slightly different details, but the source material is usually the same: process notes, code snippets, screenshots, configuration notes, testing evidence, risks, and handover decisions.

TechDoc Studio standardizes that capture process and generates a structured `.docx` technical specification that can be reviewed, edited, shared, and used for beta testing or support handover.

## Current Capabilities

### Solution Area Coverage

The app currently supports the following solution areas:

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

### Document Inputs

Users can provide:

- Document title
- Owner/team
- Systems and landscape
- Solution area
- Document format type
- Purpose of the generated technical specification
- Business process
- Configuration notes
- Testing notes
- Risks and open items
- Code snippet or attached code file
- Screenshots with type, caption, visible text, and reviewer notes
- Optional customer template guidance
- Optional customer logo

### Branding

Generated documents include:

- Official FAIR CONSULTING GROUP logo
- FAIR Consulting Group document branding
- Optional customer logo

The app exports real `.docx` files with embedded logo and screenshot images, improving compatibility with Microsoft Word and Google Docs.

Downloaded Word files use the `TechSpec_<document-title>.docx` naming pattern so exported specifications are easier to identify in shared folders, Confluence attachments, and review packs.

### Template Handling

The app supports two template modes:

- Create automatically: uses the FAIR standard technical specification structure for the selected solution area.
- Use my template: allows upload of PDF, DOC, or DOCX templates and lets users provide template headings, mandatory tables, approval fields, or style guidance.

The generated reader-facing document hides internal template generation rules and presents only useful template alignment information.

### Generated Document Sections

The app can generate sections such as:

- Purpose
- Generated Implementation Summary
- Process Flow
- Business Process
- Template Alignment
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

Code and screenshot sections are skipped when those artifacts are not supplied, so the final document does not call out missing inputs.

### Code Understanding

The app detects common patterns in pasted or uploaded snippets, including:

- ABAP logic and exception handling
- CDS and RAP service exposure
- OData and service binding patterns
- UI5/Fiori component patterns
- SAP Integration Suite/CPI/Groovy patterns
- Azure Logic Apps workflow structure
- SAP Commerce and Spartacus implementation signals
- Security-sensitive token patterns

### Screenshot Understanding

The app performs in-browser OCR on uploaded screenshot images so visible text from code screenshots, SAP CPI/iFlow screenshots, workflow screens, monitor screens, and error evidence can be captured into the specification.

The OCR result is editable. Users should review and correct it before final export, because screenshot quality, zoom level, fonts, and diagram layout can affect accuracy.

The app uses the screenshot type, caption, OCR-extracted text, pasted visible text, and reviewer notes to infer what the evidence represents.

It can identify whether a screenshot appears related to:

- SAP GUI / ABAP Workbench
- Fiori / UI5 screen
- SAP BTP cockpit
- SAP Integration Suite monitor
- Azure Logic Apps run
- SAP Commerce Backoffice / HAC
- Code review / IDE
- Architecture or flow diagram
- Test evidence

### Process Flow Generation

The app prioritizes the user's Business Process description when creating Process Flow. If the user provides a real process narrative, the app converts that into process steps rather than generating a generic flow.

The Process Flow section also includes a Technical Flow Diagram generated from the same steps. Preview, Confluence copy, and Word export include a proper green-and-black flowchart so reviewers can see how the technical process runs end to end.

When code or evidence is supplied, it can also infer steps around:

- Trigger/input
- Payload parsing or mapping
- Validation
- Authorization or connection
- Integration/API/service handoff
- Data read/update
- Business logic
- Success outcome
- Exception path
- Monitoring/support

### Word Export

The app exports a real `.docx` file using embedded image parts for:

- FAIR logo
- Customer logo
- Uploaded screenshots

The `.docx` output is intended to work in:

- Microsoft Word
- Google Drive upload
- Google Docs conversion

### Confluence Publishing

The app includes a Copy for Confluence action that converts the generated Markdown-style preview into clipboard HTML for pasting into a Confluence page. The copied content is optimized for headings, tables, bullet lists, numbered process steps, rendered technical flow diagrams, and implementation code blocks.

For beta use, the recommended publishing model is:

- Paste the copied Confluence version into a project/spec page.
- Attach the generated Word file to the same page for audit/reference.
- Use Confluence comments for developer review and beta feedback.
- Keep approvals and handover sign-off fields visible in the page.

## Current Architecture

### Frontend

- React
- Vite
- Browser-only runtime
- Local browser state using `localStorage`
- No backend dependency

### Document Export

- Uses the `docx` package to generate real Word documents.
- The previous HTML-as-`.doc` approach was replaced because embedded images were unreliable in Word and Google Docs.

### Local Data Handling

- Inputs are held in browser state.
- Form fields are saved locally in `localStorage`.
- Uploaded screenshots and logos stay in the browser session.
- No files are uploaded to a server.

## Known Constraints

- OCR is available in-browser for visible screenshot text, but full AI vision, diagram topology understanding, and server-side evidence analysis are not yet implemented.
- PDF/DOCX template files are not deeply parsed for layout.
- Template guidance works best when users paste required headings or rules into the Template Guidance field.
- Screenshot interpretation depends on screenshot type, OCR quality, corrected visible text, and reviewer notes.
- Confluence export uses browser clipboard support and does not yet create or update Confluence pages through the Atlassian REST API.
- No authentication, shared team workspace, approval workflow, or persistent document library yet.
- No live SAP, Azure, or BTP system connectivity.
- No automatic repository scanning yet.

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

## Beta Testing Goals

Beta testing should validate:

- Document quality by solution area
- Whether generated sections are useful to developers
- Whether irrelevant or missing-input sections are skipped correctly
- Whether screenshots and code snippets are represented accurately
- Whether `.docx` output works in Word and Google Docs
- Whether the FAIR and customer logos render correctly
- Whether approval and handover sections are usable for real delivery governance
- Whether beta users can complete a spec without training

## Where We Want To Reach

### Phase 1: Strong Beta-Ready Local Tool

Goal: Make the current local app reliable enough for controlled team beta testing.

Planned improvements:

- Improve document wording for each solution area based on beta feedback.
- Add more solution areas if required by FAIR delivery teams.
- Add stronger validation so users know which inputs improve document quality.
- Add a richer document preview that looks closer to the final Word output.
- Add optional sample data/examples for each solution area.
- Add export quality checks before download.
- Make the document format dropdown produce clearly different outputs for Technical Spec, Functional Spec, Support Runbook, and Handover Pack instead of only changing the document label.

### Future Document Format Expansion

The current app exposes these document formats in the UI:

- Technical Spec
- Functional Spec
- Support Runbook
- Handover Pack

Technical Spec is the primary beta-ready output today. The remaining formats should become dedicated document generators in future releases:

- Functional Spec: focus on business process, actors, user stories, functional requirements, acceptance criteria, business rules, dependencies, reporting needs, exceptions, and sign-off.
- Support Runbook: focus on operational ownership, monitoring points, alert handling, common failures, retry/reprocess steps, access requirements, escalation paths, SLAs, and support contacts.
- Handover Pack: focus on delivery summary, implemented scope, evidence index, deployment/transport details, open items, known risks, training notes, operational readiness, approval status, and customer/developer handover checklist.

Each format should still reuse the same evidence capture model: solution area, code snippets, screenshots/OCR, process notes, template guidance, testing notes, risks, FAIR branding, optional customer logo, Word export, and Confluence copy.

### Phase 2: Smarter Evidence Understanding

Goal: Reduce manual effort when using screenshots, code, and templates.

Potential enhancements:

- Higher-accuracy OCR tuned for SAP GUI, CPI/iFlow, Azure Logic Apps, ABAP editor, and IDE screenshots.
- AI-assisted screenshot interpretation.
- AI-assisted code explanation.
- AI-assisted process flow extraction.
- Automatic field/object extraction from ABAP, CDS, XML, JSON, JavaScript, Groovy, and workflow definitions.
- Automatic test scenario generation from code and screenshots.
- Better parsing of uploaded Word/PDF templates.

### Phase 3: Team Collaboration

Goal: Move from a single-user local tool to a team-ready documentation workspace.

Potential enhancements:

- User login and roles.
- Shared document workspace.
- Direct Confluence page create/update using Atlassian space key, parent page, and page ID.
- Draft, review, approved, and archived statuses.
- Reviewer comments and change history.
- Document versioning.
- Approval workflow.
- Customer-specific template library.
- Centralized logo and branding management.

### Phase 4: Enterprise Integrations

Goal: Connect the documentation process to delivery systems.

Potential integrations:

- GitHub / Azure DevOps repositories
- SAP transport references
- SAP BTP cockpit metadata
- SAP Integration Suite artifacts
- Azure Logic Apps workflow JSON
- Jira / Azure Boards work items
- Confluence / SharePoint publishing
- Google Drive / Microsoft OneDrive document storage

### Phase 5: Delivery Intelligence Platform

Goal: Make the app a reusable FAIR Consulting Group accelerator for delivery documentation and support readiness.

Long-term capabilities:

- Generate technical specs, functional specs, support runbooks, test packs, and release notes from the same evidence.
- Compare current specs against previous versions.
- Identify missing delivery evidence before release.
- Recommend test coverage by solution area.
- Generate support runbooks from technical specs.
- Generate architecture/process diagrams.
- Maintain a reusable knowledge base of solution patterns.
- Provide customer-ready export packs with consistent FAIR branding.

## Success Criteria

The app should be considered successful when:

- Developers can generate a useful first-draft technical spec in minutes.
- Beta testers can understand what was built without chasing scattered screenshots and code.
- Support teams receive enough information to monitor, troubleshoot, and own the solution.
- Customer documents follow a consistent structure and branding standard.
- The generated `.docx` can be opened and edited reliably in Word and Google Docs.
- FAIR delivery teams can reuse the tool across multiple SAP and enterprise technology areas.

## Recommended Next Decisions

- Confirm the priority solution areas for beta testing.
- Decide whether the next milestone should focus on document quality, OCR/AI, or team collaboration.
- Select 3 to 5 real project examples for beta validation.
- Define the minimum acceptable tech-spec quality standard for customer handover.
- Decide whether this should remain a local tool or move toward a hosted team application.
