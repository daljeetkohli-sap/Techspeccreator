import React, { useEffect, useMemo, useState } from 'react';
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from 'docx';
import JSZip from 'jszip';
import { createWorker } from 'tesseract.js';

const contextApiBase = import.meta.env.VITE_CONTEXT_API_BASE || 'http://localhost:8787';

const capabilityAreas = [
  {
    id: 'sap-abap',
    name: 'SAP ABAP',
    tag: 'Backend',
    sections: ['ABAP object inventory', 'Selection and business logic', 'Data access and CDS model', 'Enhancements and exits', 'Performance and locking', 'Error handling and application log', 'Transport and deployment'],
    prompts: ['Program/class/function module', 'Package and transport request', 'Tables/CDS views', 'BAPI/FM/classes', 'Selection-screen inputs', 'Authorization objects', 'Application log/message class']
  },
  {
    id: 'sap-integration',
    name: 'SAP Integration Suite / CPI',
    tag: 'Integration',
    sections: ['Integration scenario', 'Sender and receiver adapters', 'Message mapping and transformation', 'Security material', 'Exception subprocess and retry', 'Monitoring and reprocessing'],
    prompts: ['Sender/receiver systems', 'iFlow name', 'Adapters/protocols', 'Message mapping/script', 'Mapping sheet reference', 'Credential alias/certificate', 'Monitoring view', 'Retry/reprocess rule']
  },
  {
    id: 'sap-btp-fiori',
    name: 'SAP BTP Fiori App',
    tag: 'Frontend',
    sections: ['Fiori app intent and navigation', 'UI/UX behavior', 'Fiori Elements annotations', 'UI5 components and extensions', 'OData and service binding', 'Launchpad content and deployment', 'Roles and authorizations', 'Accessibility and responsive behavior'],
    prompts: ['App ID', 'Semantic object/action', 'Floorplan/page type', 'Fiori Elements annotations', 'UI5 extension points', 'OData service endpoint', 'Role collection/catalog/space/page', 'UX states and validation messages']
  },
  {
    id: 'sap-cap',
    name: 'SAP CAP App',
    tag: 'Cloud',
    sections: ['Domain model and entities', 'Service API contract', 'Event handlers and validations', 'Persistence and data model', 'Authentication and authorization', 'Deployment and service bindings', 'Testing and mock data'],
    prompts: ['Entities', 'Service definitions', 'Event handlers', 'MTA/Cloud Foundry target', 'Service bindings', 'XSUAA roles', 'Test data']
  },
  {
    id: 'azure-logic-apps',
    name: 'Azure Logic Apps',
    tag: 'Azure',
    sections: ['Workflow trigger', 'Action sequence', 'Connectors and identities', 'Data operations and expressions', 'Retry and exception policy', 'Run history and diagnostics', 'Environment configuration'],
    prompts: ['Workflow name', 'Trigger type', 'Connectors', 'Managed identity/connection', 'Key expressions', 'Retry policy', 'Run history evidence']
  },
  {
    id: 'sap-spartacus',
    name: 'SAP Spartacus',
    tag: 'Commerce UI',
    sections: ['Feature module and routing', 'CMS component mapping', 'OCC API integration', 'Storefront UI/UX behavior', 'State management and guards', 'Responsive and accessibility behavior', 'Testing and regression scope'],
    prompts: ['Component/module', 'CMS slot', 'OCC endpoint', 'Route/config', 'Guards/resolvers', 'NgRx/facade usage', 'E2E tests']
  },
  {
    id: 'sap-commerce',
    name: 'SAP Commerce Cloud',
    tag: 'Commerce',
    sections: ['Extension and module changes', 'Items XML and type system', 'Service/facade/populator logic', 'Impex and sample data', 'Cronjobs and tasks', 'Backoffice and HAC validation', 'Deployment and system update'],
    prompts: ['Extension', 'Item types', 'Impex files', 'Cronjob/facade/service', 'Spring beans', 'Backoffice config', 'System update impact']
  },
  {
    id: 'sap-rap',
    name: 'SAP RAP / Fiori Elements',
    tag: 'S/4HANA',
    sections: ['RAP data model', 'Behavior definition and implementation', 'Projection and service exposure', 'Fiori Elements annotations', 'Draft and locking behavior', 'Authorization and feature control', 'Service binding and publication'],
    prompts: ['Root entity', 'Behavior pool', 'Annotations', 'Service binding', 'Draft enabled', 'Authorization master', 'Projection view']
  },
  {
    id: 'sap-bw',
    name: 'SAP BW / Datasphere',
    tag: 'Analytics',
    sections: ['Source system and extraction', 'Data model/provider', 'Transformations and business rules', 'Queries and consumption model', 'Scheduling and dependencies', 'Reconciliation and data quality', 'Authorization and transport'],
    prompts: ['Provider/model', 'Transformation logic', 'Query name', 'Load schedule', 'Source system', 'Reconciliation checks', 'Analysis authorizations']
  },
  {
    id: 'sap-mdg',
    name: 'SAP MDG',
    tag: 'Master Data',
    sections: ['Master data object and scope', 'Change request type', 'MDG data model and UI', 'Workflow and approvals', 'Validations and derivations', 'Replication and key mapping', 'Governance roles and audit trail'],
    prompts: ['Entity type', 'CR type', 'BRF+ rules', 'Replication target', 'Workflow path', 'UI configuration', 'Governance roles']
  }
];

const docFormats = [
  { id: 'functional', name: 'Functional Spec', description: 'Business process, scope, rules, and expected behavior.' },
  { id: 'technical', name: 'Technical Spec', description: 'Objects, services, logic, configuration, and deployment notes.' },
  { id: 'runbook', name: 'Support Runbook', description: 'Monitoring, troubleshooting, recovery, and ownership.' },
  { id: 'handover', name: 'Handover Pack', description: 'Implementation summary, evidence, risks, and next steps.' }
];

const ocrLanguages = [
  { id: 'eng', name: 'English' },
  { id: 'eng+deu', name: 'English + German' },
  { id: 'eng+fra', name: 'English + French' },
  { id: 'eng+spa', name: 'English + Spanish' },
  { id: 'eng+ita', name: 'English + Italian' }
];

const brandName = 'ABC Consulting';
const brandLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="150" viewBox="0 0 520 150">
  <rect width="520" height="150" rx="18" fill="#ffffff"/>
  <rect x="12" y="12" width="126" height="126" rx="16" fill="#101820"/>
  <path d="M48 104 L74 43 L101 104" fill="none" stroke="#7fe0c5" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M59 83 H90" stroke="#7fe0c5" stroke-width="10" stroke-linecap="round"/>
  <text x="162" y="76" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800" fill="#101820">ABC</text>
  <text x="162" y="112" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" fill="#167a5b">CONSULTING</text>
</svg>`;
const brandLogoDataUrl = svgToDataUrl(brandLogoSvg);

const sampleDefaults = {
  title: 'Customer Account Update Interface',
  owner: 'SAP Delivery Team',
  system: 'S/4HANA, SAP BTP, Azure',
  overview:
    'This technical specification is created to define the purpose, design, configuration, testing, deployment, and support approach for the delivered customer account update interface. It provides developers, testers, approvers, and support teams with a shared reference for how the solution works and how it should be validated and handed over.',
  businessProcess:
    'A source application sends customer account updates to SAP. The solution validates the payload, maps the relevant fields, updates the SAP target object, and records processing status for support traceability.',
  codeSnippet:
    "DATA(ls_customer) = VALUE zcustomer_update( ).\n\n/io/cl_json=>deserialize(\n  EXPORTING json = iv_payload\n  CHANGING  data = ls_customer\n).\n\nIF ls_customer-account_id IS INITIAL.\n  RAISE EXCEPTION TYPE zcx_integration_error\n    EXPORTING textid = zcx_integration_error=>missing_account.\nENDIF.",
  configNotes:
    'Maintain destination credentials in the target landscape. Validate role collections, communication arrangements, and transport dependencies before release.',
  testingNotes:
    'Run happy path, missing mandatory field, duplicate message, and authorization failure scenarios. Attach run history, payload samples, and SAP application logs as evidence.',
  risks:
    'Confirm production credential rotation process. Align retry handling with business tolerance for duplicate updates.',
  revisionSummary:
    'Initial draft generated for developer and beta review.'
};


const requiredDocumentHeaders = [
  'Purpose',
  'Generated Implementation Summary',
  'Revision History',
  'Process Flow',
  'Business Process',
  'Template Alignment',
  'Solution Area Checklist',
  'Technical Design',
  'Configuration Notes',
  'Code Understanding',
  'Code Snippet',
  'Screenshot Evidence',
  'Screenshot Review And Technical Interpretation',
  'Unit Testing',
  'Integration Testing',
  'Regression Testing And UAT',
  'Deployment And Transport',
  'Monitoring And Support',
  'Risks, Assumptions, And Open Items',
  'Approval And Handover'
];

const screenshotTypes = [
  'SAP GUI / ABAP Workbench',
  'SAP Fiori / UI5 screen',
  'SAP BTP cockpit',
  'SAP Integration Suite monitor',
  'SAP Integration Suite iFlow design',
  'Azure Logic Apps run',
  'SAP Commerce Backoffice / HAC',
  'Code review / IDE',
  'Architecture or flow diagram',
  'Test evidence'
];

const areaDocumentProfiles = {
  'sap-abap': {
    checklistDetails: {
      'Program/class/function module': 'Identify report, class, interface, function module, include, form, or RAP object delivered.',
      'Package and transport request': 'Capture package, transport number, owner, dependencies, and import sequence.',
      'Tables/CDS views': 'List transparent tables, CDS views, structures, keys, joins, read/update behavior, and data volume assumptions.',
      'BAPI/FM/classes': 'Document called APIs/classes, importing/exporting parameters, exceptions, and side effects.',
      'Selection-screen inputs': 'Describe parameters, select-options, defaults, validation, and user authorization dependencies.',
      'Authorization objects': 'Document AUTHORITY-CHECK/PFCG role impacts and sensitive data access.',
      'Application log/message class': 'Capture message class, SLG1 object/subobject, error texts, and support recovery path.'
    },
    testing: ['Unit test ABAP methods or report branches where possible.', 'Validate selection variants, mandatory-field failures, authorization failures, and high-volume data.', 'Run performance checks for SELECTs, locks, update tasks, and commit behavior.', 'Confirm transport import, activation, and post-import smoke test.'],
    risks: ['Expensive SELECTs or missing indexes may affect production runtime.', 'Unclear locking/commit behavior can cause duplicate updates or data inconsistency.', 'Missing authorization checks can expose sensitive SAP data.', 'Transport dependencies must be imported in the correct sequence.'],
    support: ['Monitor SLG1/application logs, ST22 dumps, SM13 update failures, and job logs if scheduled.', 'Support should know the report/class/FM name, variant, transport, message class, and reprocess steps.']
  },
  'sap-integration': {
    checklistDetails: {
      'Sender/receiver systems': 'Identify all source/target systems, business owners, connectivity route, and data direction.',
      'iFlow name': 'Capture package, iFlow ID, version, deployed artifact, and environment.',
      'Adapters/protocols': 'Document sender/receiver adapters, endpoints, QoS, timeout, polling, and authentication.',
      'Message mapping/script': 'Describe graphical mapping, Groovy scripts, value mappings, content modifiers, and field defaults.',
      'Mapping sheet reference': 'Provide the mapping sheet Excel file name, SharePoint link, Google Drive link, or controlled repository reference used to validate source-to-target field mapping.',
      'Credential alias/certificate': 'Capture security material, OAuth/certificate/basic auth, destinations, and rotation owner.',
      'Monitoring view': 'Document message monitor, MPL properties, correlation ID, payload visibility, and alerting.',
      'Retry/reprocess rule': 'Define retry count, idempotency, duplicate handling, manual reprocess, and failure ownership.'
    },
    testing: ['Test happy path, invalid payload, receiver downtime, mapping failure, credential failure, and duplicate message.', 'Capture message IDs, MPL traces, payload before/after mapping, and retry/reprocess evidence.', 'Validate alerting and monitoring visibility for support users.'],
    risks: ['Receiver downtime or throttling can create backlog.', 'Mapping changes may break downstream mandatory fields.', 'Credential/certificate expiry can stop processing.', 'Poor idempotency can duplicate postings.'],
    support: ['Monitor Integration Suite message monitor, MPL logs, alert notifications, and receiver-side acknowledgements.', 'Support needs iFlow name, package, correlation/message ID, reprocess rule, and credential owner.']
  },
  'sap-btp-fiori': {
    checklistDetails: {
      'App ID': 'Capture UI5 app ID, component namespace, repository/app content entry, and deployment target.',
      'Semantic object/action': 'Document intent, inbound/outbound navigation, target mapping, and parameters.',
      'Floorplan/page type': 'Identify List Report, Object Page, Overview Page, freestyle UI5, Worklist, or custom floorplan.',
      'Fiori Elements annotations': 'Capture line items, facets, identification, field groups, actions, side effects, value helps, and presentation variants.',
      'UI5 extension points': 'Document controller extensions, fragments, manifest changes, formatter/model usage, and custom controls.',
      'OData service endpoint': 'Document OData version, service URL, entity sets, draft support, actions/functions, and backend owner.',
      'Role collection/catalog/space/page': 'Capture BTP role collection, launchpad content, catalog/group/space/page, and PFCG/backend role dependencies.',
      'UX states and validation messages': 'Document loading, empty, error, success, mandatory-field, and value-help behavior.'
    },
    testing: ['Test navigation intent, role access, value helps, field validation, draft/save/cancel behavior, and error messages.', 'Validate desktop/tablet/mobile layout, keyboard navigation, and accessibility labels.', 'Confirm OData calls, side effects, and launchpad cache/content refresh after deployment.'],
    risks: ['Role collection or catalog mismatch can hide the app.', 'Annotation/service changes can alter UI behavior unexpectedly.', 'Poor responsive/accessibility handling can block users on smaller devices.', 'Cached launchpad content may show stale app metadata.'],
    support: ['Monitor browser console/network traces, BTP HTML5 app deployment, launchpad content manager, OData backend logs, and authorization failures.', 'Support needs app ID, semantic object/action, service endpoint, role collection, and deployment space.']
  },
  'sap-cap': {
    checklistDetails: {
      Entities: 'List CDS entities, compositions, associations, keys, constraints, and ownership.',
      'Service definitions': 'Document services, exposed entities, actions/functions, events, and API paths.',
      'Event handlers': 'Capture before/on/after handlers, validations, side effects, and transaction boundaries.',
      'MTA/Cloud Foundry target': 'Document org/space, MTA modules, deployment target, and pipeline.',
      'Service bindings': 'Capture HANA/HDI, XSUAA, destinations, connectivity, messaging, and external services.',
      'XSUAA roles': 'Document scopes, role templates, restrictions, role collections, and tenant assumptions.',
      'Test data': 'Capture seed data, mock services, API test cases, and smoke tests.'
    },
    testing: ['Run CAP unit/integration tests, OData/API tests, authorization tests, and deployment smoke tests.', 'Validate service handlers, transaction rollback, mock data, and database migration behavior.'],
    risks: ['Handler side effects may break transaction consistency.', 'Role/restriction gaps can expose data.', 'HDI/schema or service binding mismatch can fail deployment.', 'API changes can break consumers.'],
    support: ['Monitor Cloud Foundry logs, app routes, service bindings, HANA/HDI artifacts, destination/connectivity logs, and API error responses.', 'Support needs app route, service name, org/space, MTA version, and role collection.']
  },
  'azure-logic-apps': {
    checklistDetails: {
      'Workflow name': 'Capture workflow name, resource group, subscription, environment, and region.',
      'Trigger type': 'Document HTTP, recurrence, event, queue, SAP connector, or other trigger behavior.',
      Connectors: 'List SAP/Azure/HTTP connectors, connection names, permissions, and endpoint owners.',
      'Managed identity/connection': 'Document managed identity, connection account, Key Vault references, and access policies.',
      'Key expressions': 'Capture expressions, compose/parse JSON steps, variables, conditions, and transformations.',
      'Retry policy': 'Document retries, timeout, scopes, runAfter conditions, and idempotency.',
      'Run history evidence': 'Capture run IDs, failed/success actions, payload samples, and correlation identifiers.'
    },
    testing: ['Test trigger, connector auth failure, invalid payload, timeout/retry, success path, and failed scoped action.', 'Validate run history details, diagnostics, and alert rules.'],
    risks: ['Connector permission changes can stop runs.', 'Retry/idempotency gaps can duplicate SAP calls.', 'Expression changes can silently map wrong values.', 'Run history may expose sensitive payload data.'],
    support: ['Monitor run history, action outputs, diagnostics, alerts, connector health, and Key Vault/managed identity access.', 'Support needs workflow name, resource group, run ID, connector name, and retry policy.']
  },
  'sap-spartacus': {
    checklistDetails: {
      'Component/module': 'Capture Angular component, feature module, lazy loading setup, and owning library.',
      'CMS slot': 'Document CMS component type, slot, page template, and content setup.',
      'OCC endpoint': 'Document OCC endpoint, request/response models, facade/adapter/converter, and error mapping.',
      'Route/config': 'Capture route config, guards, resolvers, feature flags, and base-site assumptions.',
      'Guards/resolvers': 'Document auth guards, checkout/cart/customer guards, and resolver data dependencies.',
      'NgRx/facade usage': 'Capture state, facade, effects, selectors, and cache invalidation.',
      'E2E tests': 'Document Cypress/e2e scope, mocked OCC responses, and browser/device coverage.'
    },
    testing: ['Test CMS placement, routing, OCC success/error states, loading/empty states, and responsive behavior.', 'Run unit tests, e2e journeys, regression tests around cart/customer/session state, and accessibility checks.'],
    risks: ['CMS mapping mismatch can hide components.', 'OCC model changes can break storefront rendering.', 'State/cache issues can show stale data.', 'Responsive or accessibility gaps can affect customer journeys.'],
    support: ['Monitor browser console/network, OCC responses, CMS content setup, SSR/build logs if relevant, and storefront route errors.', 'Support needs component/module, CMS slot, OCC endpoint, and route.']
  },
  'sap-commerce': {
    checklistDetails: {
      Extension: 'Capture custom extension, addon/module, dependencies, and ownership.',
      'Item types': 'Document items.xml types, attributes, relations, indexes, and deployment/update behavior.',
      'Impex files': 'List impex files, sample data, environment-specific values, and rollback.',
      'Cronjob/facade/service': 'Document service/facade/populator/converter/cronjob classes and execution path.',
      'Spring beans': 'Capture spring XML/java config, overrides, interceptors, validators, and converters.',
      'Backoffice config': 'Document Backoffice cockpit config, editor area/list view, permissions, and validation.',
      'System update impact': 'Capture update running system, initialization risks, cloud deployment, and rollback.'
    },
    testing: ['Run unit/integration tests, system update validation, impex import, Backoffice/HAC checks, and storefront/API regression.', 'Validate cronjob schedule, failure handling, and data migration behavior.'],
    risks: ['Type-system changes can require careful system update.', 'Impex can overwrite environment-specific data.', 'Cronjobs can affect performance or duplicate processing.', 'Spring overrides can change standard behavior.'],
    support: ['Monitor Backoffice, HAC/FlexibleSearch, cronjob history, application logs, and deployment pipeline logs.', 'Support needs extension, item type, impex, cronjob/service, and rollback approach.']
  },
  'sap-rap': {
    checklistDetails: {
      'Root entity': 'Capture interface/projection CDS, root entity, composition tree, and keys.',
      'Behavior pool': 'Document behavior pool class, validations, determinations, actions, and save sequence.',
      Annotations: 'Capture UI annotations, facets, line items, field groups, value helps, and side effects.',
      'Service binding': 'Document service definition, binding type, publication status, and preview URL.',
      'Draft enabled': 'Document draft table, lock behavior, ETags, activation, and discard/save flow.',
      'Authorization master': 'Capture authorization master, instance checks, feature control, and role dependencies.',
      'Projection view': 'Document projection behavior, exposed fields/actions, and consumption restrictions.'
    },
    testing: ['Test create/edit/delete, draft save/activate/discard, actions, validations, side effects, authorization, and service publication.', 'Validate Fiori Elements rendering and OData calls.'],
    risks: ['Draft/lock handling can block concurrent users.', 'Projection mismatch can expose or hide fields/actions.', 'Authorization/feature control gaps can expose operations.', 'Annotation changes can alter UI behavior.'],
    support: ['Monitor service binding, ADT activation, Gateway/OData errors, application logs, and authorization failures.', 'Support needs root entity, behavior pool, service binding, and published URL.']
  },
  'sap-bw': {
    checklistDetails: {
      'Provider/model': 'Capture InfoProvider/Datasphere model, semantic usage, and ownership.',
      'Transformation logic': 'Document transformation, routines, calculated fields, currency/unit handling, and filters.',
      'Query name': 'Capture query/view, variables, restricted/calculated key figures, and consuming reports.',
      'Load schedule': 'Document process chain/task chain, dependency, frequency, SLA, and restart point.',
      'Source system': 'Capture source system, connection, extractor, delta method, and dependency.',
      'Reconciliation checks': 'Define row counts, totals, duplicate checks, exception reports, and acceptance thresholds.',
      'Analysis authorizations': 'Document roles, spaces, analytic privileges, and sensitive data restrictions.'
    },
    testing: ['Validate extraction/load, transformations, query output, reconciliation totals, scheduling, and authorization.', 'Compare source/target record counts and key figures.'],
    risks: ['Delta handling can miss or duplicate records.', 'Transformation/routine changes can alter reported KPIs.', 'Schedule dependencies can delay business reporting.', 'Authorization gaps can expose analytics data.'],
    support: ['Monitor process chains/task chains, load logs, failed requests, reconciliation reports, and query performance.', 'Support needs model/provider, source, schedule, query, and reconciliation procedure.']
  },
  'sap-mdg': {
    checklistDetails: {
      'Entity type': 'Capture master data domain, entity type, attributes, and key fields.',
      'CR type': 'Document change request type, steps, statuses, priorities, and UI process.',
      'BRF+ rules': 'Capture validation, derivation, duplicate check, and decision-table logic.',
      'Replication target': 'Document target systems, DRF model, key mapping, outbound status, and reprocess.',
      'Workflow path': 'Capture approval steps, agent determination, rejection/rework, escalation, and SLAs.',
      'UI configuration': 'Document MDG UI, field properties, feeder classes, and user interaction.',
      'Governance roles': 'Document requester/approver/steward roles, authorizations, and audit needs.'
    },
    testing: ['Test create/change CR, workflow approval/rejection, validation/derivation rules, duplicate checks, replication, and audit trail.', 'Validate role-based UI and governance responsibilities.'],
    risks: ['Incorrect BRF+ rules can block or corrupt master data.', 'Workflow agent determination can route to wrong approver.', 'Replication/key mapping failures can desync target systems.', 'Governance role gaps can break compliance.'],
    support: ['Monitor change request status, workflow logs, DRF/outbound replication, key mapping, and validation errors.', 'Support needs CR type, entity type, workflow path, replication target, and responsible steward.']
  }
};

const areaValidationProfiles = {
  'sap-abap': {
    unit: ['Create ABAP Unit coverage for reusable methods, validations, calculations, and exception branches.', 'Validate selection-screen defaults, mandatory checks, message handling, and authorization branches with isolated test data.', 'Mock or isolate BAPI/function module/class dependencies where direct calls would update business data.'],
    integration: ['Execute end-to-end tests in the SAP landscape using the target transaction/report/class and realistic business data.', 'Confirm called BAPIs, function modules, CDS views, locks, update tasks, commits, and application logs behave as designed.', 'Attach ST22/SLG1/job log or ADT activation evidence for success and failure scenarios.'],
    regression: ['Retest impacted reports, enhancements, variants, interfaces, and batch jobs that share the changed tables, classes, or exits.', 'Compare before/after output for key users and confirm no unintended authorization or performance regression.'],
    deployment: ['Release and import the transport sequence with dependencies, activation checks, and post-import smoke testing.', 'Document package, transport request, import order, owner, rollback or correction transport approach, and production validation steps.']
  },
  'sap-integration': {
    unit: ['Validate mapping logic, Groovy scripts, content modifiers, value mappings, and exception handling with representative payloads.', 'Test mandatory-field, malformed-payload, credential, and receiver-error branches before end-to-end testing.'],
    integration: ['Run sender-to-receiver scenarios through the deployed iFlow and capture message IDs, MPL traces, payload before/after mapping, and receiver acknowledgement.', 'Verify retry, idempotency, duplicate handling, alerting, and manual reprocess steps.'],
    regression: ['Replay sample payloads for all affected message types, sender systems, receiver systems, and mapping variants.', 'Confirm unchanged interfaces in the same package or shared value mappings continue to process successfully.'],
    deployment: ['Deploy the iFlow/package to the target tenant, validate security material, externalized parameters, certificates, destinations, and alert subscriptions.', 'Record artifact version, tenant, package, transport/export path, rollback version, and support reprocess procedure.']
  },
  'sap-btp-fiori': {
    unit: ['Run UI5/controller/formatter/component tests for custom logic, value formatting, validation, and extension hooks.', 'Validate Fiori Elements annotation-driven behavior such as facets, field groups, value helps, actions, and side effects where applicable.'],
    integration: ['Test launchpad navigation, semantic object/action, OData calls, draft/save/cancel behavior, role access, and browser network responses.', 'Capture desktop, tablet, mobile, accessibility, error-message, empty-state, and success-state evidence.'],
    regression: ['Retest impacted launchpad spaces/pages/catalogs, cross-app navigation, shared UI5 libraries, and OData entity behavior.', 'Confirm app cache/content refresh does not expose stale metadata after deployment.'],
    deployment: ['Deploy the HTML5/UI5 application to the target BTP subaccount/space and update app content, launchpad content, role collections, and destination dependencies.', 'Record app ID, semantic intent, service endpoint, deployment target, version, and cache refresh steps.']
  },
  'sap-cap': {
    unit: ['Run CAP unit tests for service handlers, validations, custom actions/functions, and transaction rollback behavior.', 'Use mock services or seeded test data for entity, association, and authorization branch coverage.'],
    integration: ['Execute OData/API tests against the deployed service with bound HANA/HDI, XSUAA, destinations, and external services.', 'Validate service events, database migration behavior, tenant assumptions, and error responses.'],
    regression: ['Retest API consumers, Fiori apps, CDS entities, role restrictions, and database artifacts touched by the CAP change.', 'Compare contract changes against existing API collections or consumer expectations.'],
    deployment: ['Build and deploy the MTA or CAP artifact to the target org/space, then validate app routes, service bindings, HDI deployment, and role collections.', 'Record MTA version, org/space, service instances, rollback artifact, and smoke-test URL.']
  },
  'azure-logic-apps': {
    unit: ['Validate expressions, compose/parse JSON actions, conditions, variables, and schema handling with sample payloads.', 'Test connector authentication, managed identity permissions, timeout, retry, and scoped failure branches.'],
    integration: ['Trigger the workflow through the real source event or HTTP endpoint and confirm every connector action, SAP/Azure call, and response path.', 'Capture run IDs, action inputs/outputs, correlation IDs, diagnostics, and alert evidence.'],
    regression: ['Replay successful, invalid, timeout, and downstream-failure payloads for affected workflows and shared connectors.', 'Confirm existing schedules, event subscriptions, and connector permissions are not disrupted.'],
    deployment: ['Deploy ARM/Bicep/workflow changes to the target subscription, resource group, region, and environment configuration.', 'Record workflow version, connection references, Key Vault/identity permissions, rollback plan, and alert rule updates.']
  },
  'sap-spartacus': {
    unit: ['Run Angular component, service, guard, resolver, facade, selector, and effect tests for changed storefront logic.', 'Mock OCC responses and validate loading, empty, error, and success states.'],
    integration: ['Test CMS component mapping, route configuration, OCC calls, cart/customer/session flows, and responsive behavior in the storefront.', 'Capture browser console/network evidence and relevant CMS/content setup.'],
    regression: ['Run e2e journeys around affected pages, checkout/cart/customer state, CMS slots, and base-site/language/currency variants.', 'Confirm accessibility and responsive behavior across target browsers.'],
    deployment: ['Build and deploy the storefront package, validate environment config, OCC endpoints, CMS mappings, SSR/build output if used, and cache behavior.', 'Record build version, route/component ownership, rollback artifact, and smoke-test journeys.']
  },
  'sap-commerce': {
    unit: ['Run unit tests for services, facades, populators, converters, validators, interceptors, and cronjob logic.', 'Validate items.xml model assumptions, impex defaults, and Spring bean overrides with focused test data.'],
    integration: ['Execute system update validation, impex import, Backoffice/HAC checks, API/storefront flows, and cronjob execution.', 'Capture FlexibleSearch, cronjob history, application logs, and relevant Backoffice evidence.'],
    regression: ['Retest affected extensions, type-system changes, storefront/API behavior, Backoffice views, impex data, and scheduled jobs.', 'Confirm existing Spring overrides and interceptors still behave as expected.'],
    deployment: ['Deploy extension changes through the Commerce Cloud pipeline, run required system update steps, and validate impex/import dependencies.', 'Record extension, system update impact, cloud build/deploy version, rollback approach, and post-deploy smoke tests.']
  },
  'sap-rap': {
    unit: ['Run ABAP Unit tests for behavior pool validations, determinations, actions, feature control, and save sequence logic.', 'Validate draft, lock, ETag, and authorization branches using controlled RAP test data.'],
    integration: ['Test service binding publication, OData create/edit/delete/action flows, draft activate/discard, and Fiori Elements rendering.', 'Capture Gateway/service errors, ADT activation, application logs, and UI evidence.'],
    regression: ['Retest projection views, annotations, exposed fields/actions, authorization master, and apps consuming the RAP service.', 'Confirm draft and lock behavior for concurrent-user scenarios.'],
    deployment: ['Transport CDS, behavior, projection, service definition/binding, and authorization artifacts in the correct order.', 'Record service binding URL, activation status, transport sequence, and post-import service publication checks.']
  },
  'sap-bw': {
    unit: ['Validate transformation routines, calculated fields, filters, currency/unit logic, and variable handling with controlled source data.', 'Test provider/model changes for keys, joins, aggregations, and exception cases.'],
    integration: ['Run extraction/load or task/process chain tests from source to provider/model and query/report consumption.', 'Capture record counts, reconciliation totals, load logs, failed requests, and query screenshots.'],
    regression: ['Compare source and target totals, KPI values, variables, schedules, authorizations, and existing consuming reports before and after the change.', 'Retest dependencies in upstream extraction and downstream reporting.'],
    deployment: ['Transport BW/Datasphere artifacts, dependencies, schedules, authorizations, and environment-specific connections.', 'Record model/provider, source system, load schedule, reconciliation procedure, rollback or reload approach.']
  },
  'sap-mdg': {
    unit: ['Validate BRF+ validation/derivation rules, duplicate checks, feeder class logic, and UI field behavior with controlled master-data cases.', 'Test agent determination and rule branches for requester, approver, steward, and exception paths.'],
    integration: ['Execute create/change change requests through workflow approval/rejection/rework, replication, key mapping, and audit trail.', 'Capture CR numbers, workflow logs, DRF/outbound status, replication target evidence, and validation errors.'],
    regression: ['Retest affected CR types, governance roles, UI configurations, replication models, BRF+ decision tables, and downstream master-data consumers.', 'Confirm existing approval paths and compliance controls remain unchanged.'],
    deployment: ['Transport MDG data model, UI, workflow, BRF+, replication, and role changes in the required sequence.', 'Record CR type, entity, replication target, role changes, transport sequence, and post-import governance smoke tests.']
  }
};

const initialForm = {
  title: '',
  owner: '',
  system: '',
  documentVersion: '0.1 Draft',
  format: 'technical',
  areaId: '',
  overview: '',
  businessProcess: '',
  codeSnippet: '',
  codeFileName: '',
  codeFileType: '',
  configNotes: '',
  testingNotes: '',
  risks: '',
  revisionSummary: '',
  mappingSheetReference: '',
  jiraContext: '',
  designContext: '',
  architectureContext: '',
  decisionContext: '',
  apiContext: '',
  templateMode: 'auto',
  templateName: '',
  templateType: '',
  templateOutline: '',
  ocrLanguage: 'eng',
  customerLogoName: '',
  customerLogoType: '',
  customerLogoDataUrl: ''
};

const oldSampleOverview =
  'Documents the delivered change using screenshots, implementation notes, and code snippets so support and project teams can understand the solution quickly.';

function isSampleValue(field, value) {
  return safeLine(sampleDefaults[field]) && safeLine(value) === safeLine(sampleDefaults[field]);
}

function evidenceLine(form, field) {
  return isSampleValue(field, form[field]) ? '' : safeLine(form[field]);
}

function migrateSavedForm(form) {
  if (!form) return form;
  const migrated = { ...initialForm, ...form };
  const clearedSamples = Object.keys(sampleDefaults).reduce((current, field) => {
    if (safeLine(current[field]) === safeLine(sampleDefaults[field])) {
      return { ...current, [field]: '' };
    }
    return current;
  }, migrated);
  const hasSavedEvidence = safeLine(clearedSamples.codeSnippet) || safeLine(clearedSamples.codeFileName);
  return {
    ...clearedSamples,
    areaId: clearedSamples.areaId === 'sap-integration' && !hasSavedEvidence ? '' : clearedSamples.areaId,
    overview: safeLine(clearedSamples.overview) === oldSampleOverview ? initialForm.overview : clearedSamples.overview
  };
}

function loadSavedWorkspace() {
  try {
    const saved = window.localStorage.getItem('techdoc-studio-workspace');
    if (!saved) return null;
    const workspace = JSON.parse(saved);
    return workspace?.form ? { ...workspace, form: migrateSavedForm(workspace.form) } : workspace;
  } catch {
    return null;
  }
}

function createScreenshotRecord(file, dataUrl) {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    url: dataUrl,
    dataUrl,
    screenType: 'Test evidence',
    caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
    note: '',
    extractedText: ''
  };
}

async function preprocessImageForOcr(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      try {
        const scale = Math.max(2, Math.min(3.5, 2600 / Math.max(image.width || 1, image.height || 1)));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) {
          resolve(dataUrl);
          return;
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const { data } = imageData;
        for (let index = 0; index < data.length; index += 4) {
          const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
          const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.75 + 128));
          const value = contrasted > 210 ? 255 : contrasted < 125 ? 0 : contrasted;
          data[index] = value;
          data[index + 1] = value;
          data[index + 2] = value;
        }
        context.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function cleanOcrText(value) {
  return String(value || '')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function decodeXmlEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function cleanTemplateText(value) {
  return String(value || '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 4000);
}

async function extractDocxTemplateText(file) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) return '';

  const paragraphTexts = documentXml
    .split(/<\/w:p>/i)
    .map((paragraphXml) => {
      const textRuns = [...paragraphXml.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/gi)]
        .map((match) => decodeXmlEntities(match[1]));
      return textRuns.join('');
    })
    .map(cleanTemplateText)
    .filter(Boolean);

  return paragraphTexts.join('\n');
}

async function extractPdfTemplateText(file) {
  const raw = new TextDecoder('latin1').decode(await file.arrayBuffer());
  const candidates = [...raw.matchAll(/\(([^()]{4,180})\)\s*T[jJ]/g)]
    .map((match) => match[1])
    .concat([...raw.matchAll(/<([0-9A-Fa-f\s]{8,})>\s*T[jJ]/g)]
      .map((match) => {
        const hex = match[1].replace(/\s+/g, '');
        const bytes = [];
        for (let index = 0; index < hex.length - 1; index += 2) {
          bytes.push(parseInt(hex.slice(index, index + 2), 16));
        }
        return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
      }));

  return cleanTemplateText(candidates.join('\n'));
}

async function extractTemplateText(file, extension) {
  if (extension === 'docx') return cleanTemplateText(await extractDocxTemplateText(file));
  if (extension === 'pdf') return cleanTemplateText(await extractPdfTemplateText(file));
  if (extension === 'doc') return '';
  return cleanTemplateText(await file.text());
}

function dataUrlToBytes(dataUrl) {
  const [, base64 = ''] = String(dataUrl || '').split(',');
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function imageTypeFromDataUrl(dataUrl) {
  if (/image\/jpe?g/i.test(dataUrl)) return 'jpg';
  if (/image\/gif/i.test(dataUrl)) return 'gif';
  if (/image\/bmp/i.test(dataUrl)) return 'bmp';
  return 'png';
}

function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeLine(value) {
  return String(value || '').trim();
}

function bulletList(items) {
  return items.filter(Boolean).map((item) => `- ${item}`).join('\n');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlParagraph(value, fallback) {
  const text = safeLine(value) || fallback;
  return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
}

function htmlList(items) {
  return `<ul>${items.filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function htmlOrderedList(items) {
  return `<ol>${items.filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>`;
}

function buildBrandingMarkdown(form) {
  return [
    `**${brandName}**`,
    `_Technical documentation generated by ${brandName}._`,
    safeLine(form.customerLogoName)
      ? `Customer logo included in Word export: ${safeLine(form.customerLogoName)}`
      : 'Customer logo: Optional, not provided.'
  ].join('\n\n');
}

function slugify(value) {
  return (safeLine(value) || 'technical-specification')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function humanizeArtifactName(value) {
  return safeLine(value)
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isWeakScreenshotDefault(value) {
  return /^(image|screenshot|screen shot|capture|untitled)(?:\s+\d+)?$/i.test(safeLine(value));
}

function buildTechSpecFilename(title, version) {
  const versionPart = safeLine(version) ? `_v${slugify(version)}` : '';
  return `TechSpec_${slugify(title)}${versionPart}.docx`;
}

function detectCodeSignals(code, area) {
  const text = code || '';
  const signals = [];

  const sharedChecks = [
    [/try\s*\{|catch\s*\(|raise exception|throw new|notfoundexception|unknownidentifierexception|exception/i, 'Error handling detected: document validation failures, exception mapping, retries, and user/support messages.'],
    [/password|secret|client_secret|apikey|api-key|bearer\s+[a-z0-9]/i, 'Security-sensitive token pattern found: remove secrets from documentation and store credentials in a vault/destination.']
  ];

  const areaChecks = {
    'sap-integration': [
      [/groovy|message\.getbody|camel|content modifier|integration flow|iflow/i, 'Evidence suggests SAP Integration Suite/CPI; verify adapter flow, mapping, script step, headers/properties, and monitoring.']
    ],
    'sap-cap': [
      [/entity\s+\w+|service\s+\w+|using\s+.*from|\.cds\b|srv\/|db\//i, 'Evidence suggests CAP/CDS; verify entities, services, handlers, persistence, and deployment target.']
    ],
    'sap-btp-fiori': [
      [/<\?xml|<mvc:|sap\.m\.|manifest\.json|component\.js|ui5/i, 'Evidence suggests Fiori/UI5; verify component structure, manifest routing, models, views, and launchpad intent.'],
      [/\/iwbep\/|odata|service binding|service definition|define service|annotate /i, 'Evidence suggests OData/service exposure; verify service entity, binding, annotations, and authorization behavior.']
    ],
    'sap-rap': [
      [/service binding|service definition|define service|annotate |behavior definition|behavior implementation/i, 'Evidence suggests RAP/OData exposure; verify service entity, binding, annotations, behavior pool, and authorization behavior.']
    ],
    'azure-logic-apps': [
      [/"triggers"\s*:|"actions"\s*:|"definition"\s*:|"workflow"|logic app/i, 'Evidence suggests Azure Logic Apps; verify trigger, connectors, actions, retry policy, and run history.']
    ],
    'sap-commerce': [
      [/occ|commerce|hybris|items\.xml|impex|backoffice|hac|flexiblesearch|cronjob|facade|populator|converter|b2bunitmodel/i, 'Evidence suggests SAP Commerce Cloud; verify OCC controller/API entry point, facade/service/populator path, model access, impex/type-system impact, and Backoffice/HAC validation.']
    ],
    'sap-spartacus': [
      [/spartacus|cmsmapping|cmscomponent|ngmodule|angular|facade|occ endpoint/i, 'Evidence suggests SAP Spartacus; verify Angular module, CMS mapping, OCC calls, route/config, and storefront behavior.']
    ]
  };

  if (
    ['sap-abap', 'sap-rap'].includes(area.id) ||
    /\b(?:REPORT|DATA\s*\(|CALL FUNCTION|AUTHORITY-CHECK|sy-subrc|abap_true|SELECT-OPTIONS|START-OF-SELECTION|END-OF-SELECTION|CLASS\s+\w+\s+DEFINITION)\b/i.test(text)
  ) {
    signals.push('Evidence suggests ABAP/SAP backend; verify object type, database access, validations, function/class usage, and exception handling.');
  }

  [...(areaChecks[area.id] || []), ...sharedChecks].forEach(([pattern, message]) => {
    if (pattern.test(text)) signals.push(message);
  });

  if (!signals.length && safeLine(text)) {
    signals.push(`Code was provided for ${area.name}; review object names, inputs, outputs, validations, dependencies, and error paths.`);
  }

  return [...new Set(signals)];
}

function extractMatches(text, patterns) {
  const values = [];
  patterns.forEach((pattern) => {
    for (const match of text.matchAll(pattern)) {
      const value = safeLine(match[1] || match[0]);
      if (value && value.length <= 80) values.push(value);
    }
  });
  return [...new Set(values)].slice(0, 12);
}

function getScreenshotEvidenceText(screenshots) {
  return (screenshots || [])
    .flatMap((shot) => [shot.screenType, shot.caption, shot.name, displayEvidenceText(shot.extractedText, 1200), shot.note])
    .map(safeLine)
    .filter(Boolean)
    .join('\n');
}

function getProjectContextText(form) {
  if (!form) return '';
  return [
    evidenceLine(form, 'jiraContext'),
    evidenceLine(form, 'designContext'),
    evidenceLine(form, 'architectureContext'),
    evidenceLine(form, 'decisionContext'),
    evidenceLine(form, 'apiContext')
  ].filter(Boolean).join('\n');
}

function getActiveEvidenceText(form, screenshots) {
  return [getActiveCodeSnippet(form), getScreenshotEvidenceText(screenshots || []), getProjectContextText(form)].map(safeLine).filter(Boolean).join('\n');
}

function uniqueItems(values) {
  return values
    .map(safeLine)
    .filter(Boolean)
    .filter((value, index, list) => list.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);
}

function cleanEvidenceText(value) {
  return safeLine(value)
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
    .replace(/\b(?:undefined|null|nan)\b/gi, ' ')
    .replace(/[^\w\s:/+().,_-]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isNoisyEvidenceText(value) {
  const text = cleanEvidenceText(value);
  if (!text) return true;
  const compact = text.replace(/\s+/g, '');
  if (compact.length < 5) return true;
  const alphaNum = (compact.match(/[a-z0-9]/gi) || []).length;
  if (alphaNum / compact.length < 0.55) return true;
  const words = text.split(/\s+/).filter(Boolean);
  const shortWords = words.filter((word) => word.length <= 2).length;
  return words.length > 8 && shortWords / words.length > 0.55;
}

function displayEvidenceText(value, maxLength = 260) {
  const text = cleanEvidenceText(value);
  if (isNoisyEvidenceText(text)) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function isWeakArtifactCandidate(value) {
  return /^(image|screenshot|capture|screen|figure|test|evidence|integration|process|sender|receiver|start|end|error|message|payload|http|amqp|sap|dev|runtime|status)$/i.test(safeLine(value));
}

function normalizeIflowText(value) {
  return safeLine(value)
    .replace(/[|]/g, ' ')
    .replace(/\s*[_-]\s*/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(value, labels) {
  const lower = value.toLowerCase();
  return labels.some((label) => lower.includes(label.toLowerCase()));
}

function extractKnownLabels(context, labels) {
  return labels.filter((label) => includesAny(context, [label]));
}

function labelVariants(context, variants, canonical) {
  return variants.some((variant) => includesAny(context, [variant])) ? canonical : '';
}

function inferSystemsFromIflowName(name, context) {
  const systems = { source: '', target: '' };
  const match = safeLine(name).match(/_([A-Za-z0-9]+)_to_([A-Za-z0-9]+)/i);
  if (match) {
    systems.source = match[1].replace(/^SAP/i, 'SAP ');
    systems.target = match[2];
  }
  if (!systems.source && /sap\s*ecc|sapecc/i.test(context)) systems.source = 'SAP ECC';
  if (!systems.target && /fareye|far eye/i.test(context)) systems.target = 'FarEye';
  return systems;
}

function extractIntegrationFlowFacts(form, screenshots) {
  const context = normalizeIflowText([
    form?.title,
    form?.businessProcess,
    form?.overview,
    form?.system,
    getProjectContextText(form),
    form?.codeSnippet,
    ...screenshots.flatMap((shot) => [shot.name, shot.caption, shot.screenType, shot.extractedText, shot.note])
  ].join(' '));
  const hasIflowSignal = /iflow|integration suite|integration process|exception subprocess|amqp|far\s*eye|fareye|content modifier|message mapping|json to xml|xml to json|set standard headers|consignment_create/i.test(context);
  if (!hasIflowSignal) {
    return {
      hasEvidence: false,
      context: '',
      iflowName: '',
      packageName: '',
      deploymentStatus: '',
      runtimeStatus: '',
      sourceSystem: '',
      targetSystem: '',
      adapters: [],
      mainSteps: [],
      authSteps: [],
      mappingSteps: [],
      exceptionSteps: [],
      processSteps: [],
      diagramSteps: []
    };
  }

  const iflowCandidates = extractMatches(context, [
    /\b([A-Za-z0-9]+_create_[A-Za-z0-9_]+_to_[A-Za-z0-9_]+)\b/gi,
    /\b([A-Za-z0-9]+_[A-Za-z0-9]+_SAPECC_to_[A-Za-z0-9_]+)\b/gi,
    /\b([A-Za-z0-9]+_SAPECC_to_[A-Za-z0-9_]+)\b/gi,
    /\b([A-Za-z0-9]+_[A-Za-z0-9]+_to_[A-Za-z0-9_]+)\b/gi
  ]);
  const packageCandidates = extractMatches(context, [
    /\b(DeliveryVisibility[A-Za-z0-9_]*IntegrationDEV)\b/gi,
    /\b([A-Za-z0-9_]*Integration(?:DEV|QAS|PRD|PROD)?)\b/gi
  ]);
  const deploymentCandidates = extractMatches(context, [
    /Deployment Status:\s*([^,]+,\s*[^,]+,\s*[^,]+|[^R]+?)(?=\s+Runtime Status|\s+Started|\s*$)/gi,
    /(Deployed on\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}[^R]*)/gi
  ]);
  const runtimeCandidates = extractMatches(context, [/Runtime Status:\s*(Started|Stopped|Failed|Error|Undeployed)/gi]);
  const iflowName = iflowCandidates[0] || '';
  const systems = inferSystemsFromIflowName(iflowName, context);
  const adapters = uniqueItems([
    /amqp/i.test(context) ? 'AMQP sender adapter' : '',
    /http/i.test(context) ? 'HTTP receiver/auth call' : '',
    /sender/i.test(context) ? 'Sender participant captured in iFlow' : '',
    /fareye|far eye/i.test(context) ? 'FarEye receiver endpoint' : ''
  ]);
  const mainSteps = uniqueItems([
    ...extractKnownLabels(context, [
      'Set Standard Headers',
      'Log Payload',
      'Map to FarEye',
      'Get Authorisation',
      'Get Authorization',
      'Set Log Attachment',
      'Post to FarEye'
    ]),
    labelVariants(context, ['Set Standard Headers', 'Standard Headers', 'Std Headers'], 'Set Standard Headers'),
    labelVariants(context, ['Log Payload', 'Log Payload1', 'Log Payload 1'], 'Log Payload'),
    labelVariants(context, ['Map to FarEye', 'Mapping to FarEye', 'Map FarEye'], 'Map to FarEye'),
    labelVariants(context, ['Get Authorisation', 'Get Authorization', 'Get Authorisation1', 'Get Access'], 'Get Authorisation'),
    labelVariants(context, ['Set Log Attachment', 'Log Attachment'], 'Set Log Attachment'),
    labelVariants(context, ['Post to FarEye', 'Post FarEye'], 'Post to FarEye')
  ]);
  const authSteps = uniqueItems([
    ...extractKnownLabels(context, [
      'Set Client ID + Secret',
      'Set Client ID Secret',
      'Set Auth Base64',
      'Get Access Token',
      'Set Auth'
    ]),
    labelVariants(context, ['Client ID + Secret', 'Client ID Secret', 'Client Id Secret'], 'Set Client ID + Secret'),
    labelVariants(context, ['Auth Base64', 'Set Auth Base64'], 'Set Auth Base64'),
    labelVariants(context, ['Access Token', 'Get Access Token'], 'Get Access Token'),
    labelVariants(context, ['Set Auth', 'Authorization Header'], 'Set Auth')
  ]);
  const mappingSteps = uniqueItems([
    ...extractKnownLabels(context, [
      'JSON to XML Converter 1',
      'JSON to XML Converter',
      'MM_ECC_to_FarEye',
      'Set Application ID',
      'XML to JSON Converter 1',
      'XML to JSON Converter',
      'Normalize Payload',
      'Persist Data'
    ]),
    labelVariants(context, ['JSON to XML', 'JSON_to_XML'], 'JSON to XML Converter'),
    labelVariants(context, ['MM_ECC_to_FarEye', 'ECC to FarEye', 'ECC_to_FarEye'], 'MM_ECC_to_FarEye'),
    labelVariants(context, ['Application ID', 'Set Application ID'], 'Set Application ID'),
    labelVariants(context, ['XML to JSON', 'XML_to_JSON'], 'XML to JSON Converter'),
    labelVariants(context, ['Normalize Payload', 'Normalise Payload'], 'Normalize Payload'),
    labelVariants(context, ['Persist Data'], 'Persist Data')
  ]);
  const exceptionSteps = uniqueItems([
    /exception subprocess/i.test(context) ? 'Exception subprocess is present' : '',
    /log error message/i.test(context) ? 'Log Error Message' : '',
    /error start/i.test(context) ? 'Error Start event' : '',
    /error end/i.test(context) ? 'Error End event' : ''
  ]);
  const source = systems.source || 'source system';
  const target = systems.target || 'target system';
  const processSteps = uniqueItems([
    systems.source || /sender/i.test(context) ? `Receive consignment message from ${source} using AMQP` : '',
    mainSteps.includes('Set Standard Headers') ? 'Set standard message headers' : '',
    mainSteps.includes('Log Payload') ? 'Log inbound payload before transformation' : '',
    includesAny(context, ['Map to FarEye']) ? 'Call the Map to FarEye subprocess' : '',
    includesAny(context, ['JSON to XML Converter']) ? 'Convert JSON payload to XML for mapping' : '',
    includesAny(context, ['MM_ECC_to_FarEye']) ? 'Map SAP ECC structure to FarEye payload using MM_ECC_to_FarEye' : '',
    includesAny(context, ['Set Application ID']) ? 'Set FarEye application identifier' : '',
    includesAny(context, ['XML to JSON Converter']) ? 'Convert mapped XML payload back to JSON' : '',
    includesAny(context, ['Normalize Payload']) ? 'Normalize the outbound payload' : '',
    includesAny(context, ['Persist Data']) ? 'Persist mapped payload or processing state' : '',
    includesAny(context, ['Get Authorisation', 'Get Authorization']) ? 'Call the authorization subprocess for FarEye access token' : '',
    includesAny(context, ['Set Client ID + Secret', 'Set Client ID Secret']) ? 'Prepare FarEye client ID and secret' : '',
    includesAny(context, ['Set Auth Base64']) ? 'Encode authorization value in Base64' : '',
    includesAny(context, ['Get Access Token']) ? 'Retrieve FarEye access token over HTTP' : '',
    includesAny(context, ['Set Auth']) ? 'Set authorization header/property for the receiver call' : '',
    mainSteps.includes('Set Log Attachment') ? 'Attach log metadata or payload evidence' : '',
    mainSteps.includes('Log Payload') && includesAny(context, ['Post to FarEye']) ? 'Log outbound payload before receiver call' : '',
    includesAny(context, ['Post to FarEye']) ? `Post consignment payload to ${target} using HTTP` : '',
    exceptionSteps.length ? 'Route technical failures to exception subprocess and log error message' : ''
  ]);
  const diagramSteps = uniqueItems([
    systems.source || /amqp|sender/i.test(context) ? `Main process: ${source} AMQP message` : '',
    mainSteps.includes('Set Standard Headers') ? 'Main process: Set Standard Headers' : '',
    mainSteps.includes('Log Payload') ? 'Main process: Log inbound payload' : '',
    includesAny(context, ['Map to FarEye']) ? 'Main process: Call Map to FarEye subprocess' : '',
    includesAny(context, ['JSON to XML Converter']) ? 'Map to FarEye subprocess: JSON to XML Converter' : '',
    includesAny(context, ['MM_ECC_to_FarEye']) ? 'Map to FarEye subprocess: MM_ECC_to_FarEye mapping' : '',
    includesAny(context, ['Set Application ID']) ? 'Map to FarEye subprocess: Set Application ID' : '',
    includesAny(context, ['XML to JSON Converter']) ? 'Map to FarEye subprocess: XML to JSON Converter' : '',
    includesAny(context, ['Normalize Payload']) ? 'Map to FarEye subprocess: Normalize Payload' : '',
    includesAny(context, ['Persist Data']) ? 'Map to FarEye subprocess: Persist Data' : '',
    includesAny(context, ['Get Authorisation', 'Get Authorization']) ? 'Main process: Call Get Authorisation subprocess' : '',
    includesAny(context, ['Set Client ID + Secret', 'Set Client ID Secret']) ? 'Auth subprocess: Set Client ID + Secret' : '',
    includesAny(context, ['Set Auth Base64']) ? 'Auth subprocess: Set Auth Base64' : '',
    includesAny(context, ['Get Access Token']) ? 'Auth subprocess: Get Access Token' : '',
    includesAny(context, ['Set Auth']) ? 'Auth subprocess: Set Auth' : '',
    includesAny(context, ['Set Log Attachment']) ? 'Main process: Set Log Attachment' : '',
    mainSteps.includes('Log Payload') && includesAny(context, ['Post to FarEye']) ? 'Main process: Log outbound payload' : '',
    includesAny(context, ['Post to FarEye']) ? `Main process: Post to ${target} via HTTP` : '',
    exceptionSteps.length ? 'Exception subprocess: Log Error Message' : ''
  ]);
  const hasConcreteEvidence = Boolean(
    iflowName ||
    packageCandidates.length ||
    deploymentCandidates.length ||
    runtimeCandidates.length ||
    adapters.length ||
    mainSteps.length ||
    authSteps.length ||
    mappingSteps.length ||
    exceptionSteps.length
  );

  return {
    hasEvidence: hasConcreteEvidence,
    context,
    iflowName,
    packageName: packageCandidates[0] || '',
    deploymentStatus: deploymentCandidates[0] || '',
    runtimeStatus: runtimeCandidates[0] || '',
    sourceSystem: systems.source,
    targetSystem: systems.target,
    adapters,
    mainSteps: uniqueItems(mainSteps),
    authSteps: uniqueItems(authSteps),
    mappingSteps: uniqueItems(mappingSteps),
    exceptionSteps,
    processSteps,
    diagramSteps
  };
}

function inferCodeDetails(code, area) {
  const text = code || '';
  const lower = text.toLowerCase();
  const details = {
    objects: [],
    validations: [],
    integrations: [],
    persistence: [],
    security: [],
    errors: [],
    operations: []
  };

  const commonObjectPatterns = [
    /\bREPORT\s+([a-zA-Z_][\w/]*)/gi,
    /\bCLASS\s+([a-zA-Z_][\w/]*)\s+(?:DEFINITION|IMPLEMENTATION)?/gi,
    /\bMETHOD\s+([a-zA-Z_][\w/]*)/gi,
    /\bFUNCTION\s+([a-zA-Z_][\w/]*)/gi,
    /\b(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s*)?\(/gi,
    /\b(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)/gi,
    /\bapp\.(?:get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/gi,
    /\b(?:controllerName|componentName|sap\.app["']?\s*:\s*{[^}]*id)\s*[:=]\s*['"]([^'"]+)['"]/gi,
    /\bCALL FUNCTION\s+'([^']+)'/gi
  ];
  const areaObjectPatterns = {
    'sap-cap': [
      /\b(?:srv|service)\.(?:on|before|after)\s*\(\s*['"]([^'"]+)['"]/gi,
      /\b(?:define\s+(?:root\s+)?(?:view\s+entity|entity)|entity|service|action)\s+([a-zA-Z_][\w/]*)/gi
    ],
    'sap-commerce': [
      /\b(?:public|private|protected)\s+[\w<>, ?]+\s+([a-zA-Z_][\w]*)\s*\(/gi,
      /\b([A-Z][A-Za-z0-9]*(?:Controller|Facade|FacadeImpl|Service|Populator|Converter|CronJob|Model|DTO|WsDTO))\b/g,
      /\b(?:extension|module|facade|populator|converter|cronjob|impex|items\.xml)\s+([a-zA-Z_][\w/-]*)/gi,
      /\bFlexibleSearch(?:Query)?\s*\(\s*['"]([^'"]+)/gi
    ],
    'sap-spartacus': [
      /\b([A-Z][A-Za-z0-9]*(?:Component|Module|Service|Facade|Resolver|Guard))\b/g
    ],
    'azure-logic-apps': [
      /\b(?:workflow|trigger|action)\s+([a-zA-Z_][\w/-]*)/gi
    ]
  };
  details.objects = extractMatches(text, [...commonObjectPatterns, ...(areaObjectPatterns[area.id] || [])]);

  if (/if\s+.+\s+is\s+initial|mandatory|required|validate|validation/i.test(text)) {
    details.validations.push('Input validation or mandatory-field checks are present.');
  }
  if (area.id === 'sap-commerce' && /flexiblesearch|modelservice|b2bunitmodel|customerModel|userService|commerce/i.test(text)) {
    details.persistence.push('The code uses the SAP Commerce model layer or FlexibleSearch and should document model types, keys, and lookup behavior.');
  } else if (/select\b|from\b|join\b|update\b|modify\b|insert\b|delete\b|entity\s+\w+/i.test(text)) {
    details.persistence.push('The code reads or changes application data and should document table/entity impact.');
  }
  if (/odata|\/iwbep\/|service binding|destination|http|api|adapter|connector|iflow|logic app|workflow|occ/i.test(text)) {
    details.integrations.push('The implementation participates in a service/API/integration flow and should document endpoint, sender, receiver, and payload mapping.');
  }
  if (/role|authorization|authority-check|oauth|jwt|bearer|credential|secret|destination/i.test(text)) {
    details.security.push('Authorization or credential handling is relevant and should be documented with roles, destinations, and secret storage approach.');
  }
  if (/raise exception|try\s*\{|catch\s*\(|throw new|error|failed|exception/i.test(text)) {
    details.errors.push('The solution includes exception/error handling; document message behavior, retry/reprocess rules, and support action.');
  }
  if (/deserialize|serialize|mapping|transform|payload|json|xml/i.test(lower)) {
    details.operations.push('Payload parsing, serialization, mapping, or transformation is part of the delivered logic.');
  }
  if (area.id === 'sap-commerce' && /dto|data\s*=|converter|populator|set[A-Z]\w+\s*\(|get[A-Z]\w+\s*\(/.test(text)) {
    details.operations.push('DTO/model mapping is present and should document source model fields, target DTO fields, and default/null behavior.');
  }
  if (/loop|filter|where|case|switch|if\s+/i.test(text)) {
    details.operations.push('Conditional or iterative business logic is present and should be described as processing rules.');
  }
  return details;
}

function extractCommerceFacts(form, screenshots) {
  const code = getActiveCodeSnippet(form);
  const context = [
    code,
    getScreenshotEvidenceText(screenshots || []),
    getProjectContextText(form),
    form ? evidenceLine(form, 'businessProcess') : '',
    form ? evidenceLine(form, 'overview') : '',
    form ? evidenceLine(form, 'system') : ''
  ].map(safeLine).filter(Boolean).join('\n');
  const hasEvidence = /occ|commerce|hybris|controller|facade|facadeimpl|service|populator|converter|b2bunitmodel|dto|wsdto|flexiblesearch|notfoundexception|delivery/i.test(context);
  const methods = uniqueItems(extractMatches(context, [
    /\b(?:public|private|protected)\s+[\w<>, ?]+\s+([a-zA-Z_][\w]*)\s*\(/gi,
    /\b([a-z][A-Za-z0-9_]*Delivery[A-Za-z0-9_]*)\s*\(/g,
    /\b(getDeliveryEnrichment)\s*\(/gi
  ]));
  const controllers = uniqueItems(extractMatches(context, [
    /\b([A-Z][A-Za-z0-9]*(?:Controller|OccController))\b/g,
    /@(GetMapping|PostMapping|RequestMapping)\s*\(([^)]*)\)/gi
  ]));
  const facadeClasses = uniqueItems(extractMatches(context, [
    /\b([A-Z][A-Za-z0-9]*(?:FacadeImpl|Facade|Service))\b/g
  ]));
  const models = uniqueItems(extractMatches(context, [
    /\b([A-Z][A-Za-z0-9]*Model)\b/g,
    /\b(B2BUnitModel)\b/g
  ]));
  const dtos = uniqueItems(extractMatches(context, [
    /\b([A-Z][A-Za-z0-9]*(?:DTO|WsDTO|Data))\b/g
  ]));
  const exceptionTypes = uniqueItems(extractMatches(context, [
    /\b(?:new\s+)?([A-Z][A-Za-z0-9]*(?:NotFoundException|Exception))\b/g,
    /\b(NotFoundException)\b/g
  ]).map((item) => item.replace(/^new\s+/, '')));
  const deliveryIdSignals = /delivery\s*id|deliveryId|deliveryNumber|consignment|delivery/i.test(context);
  const nullCheckSignals = /==\s*null|!=\s*null|Objects\.isNull|Objects\.nonNull|StringUtils\.isBlank|StringUtils\.isEmpty|isEmpty\(|isBlank\(/i.test(context);
  const method = methods.find((item) => /delivery|enrichment/i.test(item)) || methods[0] || '';
  const title = method
    ? `${humanizeArtifactName(method)} OCC API`
    : controllers[0]
      ? `${humanizeArtifactName(controllers[0])} OCC API`
      : '';
  const processSteps = [];
  const addStep = (condition, step) => {
    if (condition && !processSteps.includes(step)) processSteps.push(step);
  };

  addStep(method || controllers.length || /occ|controller|@GetMapping|@RequestMapping/i.test(context), `OCC REST controller receives the delivery request${deliveryIdSignals ? ' with delivery ID' : ''}`);
  addStep(nullCheckSignals, 'Validate request/model values with null or blank checks before enrichment logic continues');
  addStep(facadeClasses.length || /facade|service/i.test(context), `Call Commerce facade/service layer${facadeClasses.length ? ` (${facadeClasses.slice(0, 3).join(', ')})` : ''}`);
  addStep(models.length || /b2bunitmodel|model/i.test(context), `Read or cast Commerce model data${models.length ? ` (${models.slice(0, 3).join(', ')})` : ''}`);
  addStep(dtos.length || /dto|wsdto|set[A-Z]\w+\s*\(/.test(context), `Map Commerce model values into response DTO${dtos.length ? ` (${dtos.slice(0, 3).join(', ')})` : ''}`);
  addStep(exceptionTypes.length || /notfoundexception|throw new|exception/i.test(context), `Return controlled not-found/error paths${exceptionTypes.length ? ` (${exceptionTypes.slice(0, 3).join(', ')})` : ''}`);

  return {
    hasEvidence,
    title,
    method,
    controllers,
    facadeClasses,
    models,
    dtos,
    exceptionTypes,
    deliveryIdSignals,
    nullCheckSignals,
    processSteps
  };
}

function collectEvidenceSummary(screenshots) {
  return screenshots.map((shot, index) => {
    const caption = safeLine(shot.caption) || shot.name;
    const visible = displayEvidenceText(shot.extractedText, 220);
    const note = safeLine(shot.note);
    return `Figure ${index + 1} (${shot.screenType}): ${caption}${visible ? `; visible text: ${visible}` : ''}${note ? `; note: ${note}` : ''}`;
  });
}

function getActiveCodeSnippet(form) {
  if (!form) return '';
  return evidenceLine(form, 'codeSnippet');
}

function extractGenericEvidenceFacts(form, area, screenshots) {
  const context = [
    getActiveEvidenceText(form, screenshots),
    getProjectContextText(form),
    form ? evidenceLine(form, 'businessProcess') : '',
    form ? evidenceLine(form, 'overview') : '',
    form ? evidenceLine(form, 'system') : ''
  ].map(safeLine).filter(Boolean).join('\n');
  const lower = context.toLowerCase();
  const codeDetails = inferCodeDetails(context, area);
  const systems = uniqueItems(extractMatches(context, [
    /\b(S\/4HANA|SAP\s*ECC|SAPECC|SAP\s*BTP|SAP\s*Commerce|Commerce\s*Cloud|Spartacus|FarEye|Azure|Logic\s*Apps|Confluence|Jira|HANA|HDI|XSUAA|OData|OCC)\b/gi,
    /\b(?:source|sender|from)\s*(?:system|app|application)?\s*[:=-]\s*([A-Za-z0-9 _/-]{3,40})/gi,
    /\b(?:target|receiver|to)\s*(?:system|app|application|endpoint)?\s*[:=-]\s*([A-Za-z0-9 _/-]{3,40})/gi
  ]));
  const titleCandidates = uniqueItems([
    ...codeDetails.objects,
    ...extractMatches(context, [
      /\b(?:file|artifact|program|object|service|workflow|app|component|extension|iflow)\s*(?:name|id)?\s*[:=-]\s*([A-Za-z0-9_./-]{3,80})/gi,
      /\b([A-Z][A-Za-z0-9]+(?:Service|Controller|Component|Handler|Router|Facade|Populator|CronJob|Workflow|LogicApp))\b/g,
      /\b([ZY][A-Z0-9_]{4,})\b/g
    ])
  ]).filter((item) => !isWeakArtifactCandidate(item));
  const processSteps = [];
  const addStep = (condition, step) => {
    if (condition && !processSteps.includes(step)) processSteps.push(step);
  };

  addStep(['sap-abap', 'sap-rap'].includes(area.id) && /report|selection-screen|select-options|parameter|start-of-selection|abap|se38|adt|class|method/i.test(context), 'Identify ABAP entry point, selection inputs, class/method, and transport context from screenshot/code evidence');
  addStep(/select\b|from\b|join\b|cds|define view|entity|items\.xml|database|hana|persist|repository/i.test(context), 'Read or persist business/application data using the tables, entities, item types, or repositories visible in evidence');
  addStep(/service|odata|api|endpoint|app\.(get|post|put|patch|delete)|router|occ|destination|http/i.test(context), 'Expose or call service/API endpoint shown in the evidence');
  addStep(/payload|json|xml|mapping|transform|deserialize|serialize|converter|mapper/i.test(context), 'Parse, map, or transform payload/data structures identified in the evidence');
  addStep(/validate|required|mandatory|if\s|case|switch|where|filter|guard|resolver|annotation/i.test(context), 'Apply validation, routing, filtering, annotations, guards, or business rules visible in the evidence');
  addStep(/oauth|jwt|xsuaa|role|authorization|authority-check|credential|secret|certificate|managed identity/i.test(context), 'Apply authorization, role, credential, certificate, or identity handling identified in evidence');
  addStep(area.id === 'sap-btp-fiori' && /ui5|fiori|manifest|component|controller|view|fragment|semantic object|launchpad|annotation/i.test(context), 'Render Fiori/UI behavior, navigation, annotations, component/controller, or launchpad intent shown in screenshot/code');
  addStep(area.id === 'sap-cap' && /cap|cds|srv\.|service\.cds|event handler|before|after|on\s*\(/i.test(context), 'Execute CAP service/entity handler logic and validations identified in evidence');
  addStep(area.id === 'sap-commerce' && /commerce|hybris|occ|facade|populator|converter|impex|cronjob|backoffice|hac|items\.xml|b2bunitmodel/i.test(context), 'Process SAP Commerce extension, OCC API, facade/service/populator, impex, cronjob, or Backoffice/HAC behavior');
  addStep(area.id === 'sap-spartacus' && /spartacus|cms|occ|facade|ngmodule|component|guard|resolver/i.test(context), 'Process SAP Spartacus storefront, CMS/OCC, facade, route, guard, resolver, or component behavior');
  addStep(/logic app|workflow|trigger|connector|run history|compose|parse json|condition/i.test(context), 'Execute Azure Logic Apps trigger, connector, action, condition, retry, or run-history path shown in evidence');
  addStep(/error|exception|catch|failed|timeout|retry|reprocess|log|trace|monitor|message id|correlation/i.test(context), 'Log, monitor, retry, reprocess, or route exception outcome identified in evidence');

  const observations = uniqueItems([
    titleCandidates.length ? `Technical object/artifact candidates: ${titleCandidates.slice(0, 5).join(', ')}.` : '',
    systems.length ? `System or platform candidates: ${systems.slice(0, 5).join(', ')}.` : '',
    codeDetails.integrations.length ? 'Evidence includes service/API/integration indicators.' : '',
    codeDetails.persistence.length ? 'Evidence includes persistence or data model indicators.' : '',
    codeDetails.security.length ? 'Evidence includes security/authorization indicators.' : '',
    codeDetails.errors.length ? 'Evidence includes exception, logging, or failure handling indicators.' : '',
    codeDetails.operations.length ? 'Evidence includes transformation, mapping, or business logic indicators.' : ''
  ]);

  return {
    hasEvidence: Boolean(safeLine(context)),
    context,
    lower,
    title: titleCandidates[0] || '',
    systems,
    processSteps,
    diagramSteps: processSteps.map((step) => step.replace(/^(Identify|Read or persist|Expose or call|Parse, map, or transform|Apply|Render|Execute|Process|Log, monitor, retry, reprocess, or route)\s+/i, '')).slice(0, 16),
    observations,
    codeDetails
  };
}

function getEvidenceTitleFromInputs(form, area, screenshots) {
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(form, screenshots) : null;
  if (iflowFacts?.iflowName) return iflowFacts.iflowName;
  const commerceFacts = area.id === 'sap-commerce' ? extractCommerceFacts(form, screenshots) : null;
  if (commerceFacts?.title) return commerceFacts.title;
  if (form.codeFileName) return humanizeArtifactName(form.codeFileName);
  const codeDetails = inferCodeDetails(getActiveEvidenceText(form, screenshots), area);
  const usefulObject = codeDetails.objects.find((item) => !isWeakArtifactCandidate(item));
  if (usefulObject) return humanizeArtifactName(usefulObject);
  const genericFacts = extractGenericEvidenceFacts(form, area, screenshots);
  if (genericFacts.title) return humanizeArtifactName(genericFacts.title);
  const firstScreenshot = screenshots[0];
  if (firstScreenshot && !isWeakScreenshotDefault(firstScreenshot.caption || firstScreenshot.name)) {
    return humanizeArtifactName(firstScreenshot.caption || firstScreenshot.name);
  }
  return '';
}

function deriveDocumentTitle(form, area, screenshots) {
  const evidenceTitle = getEvidenceTitleFromInputs(form, area, screenshots);
  if (evidenceTitle) return evidenceTitle;
  const providedTitle = evidenceLine(form, 'title');
  if (providedTitle && !isWeakScreenshotDefault(providedTitle)) return providedTitle;
  if (providedTitle) return providedTitle;
  return `${area.name} Technical Specification`;
}

function deriveBusinessProcessText(form, area, screenshots) {
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(form, screenshots) : null;
  if (iflowFacts?.processSteps?.length) {
    const summary = [
      iflowFacts.iflowName ? `iFlow ${iflowFacts.iflowName}` : 'SAP Integration Suite iFlow',
      iflowFacts.sourceSystem || iflowFacts.targetSystem ? `moves consignment data from ${iflowFacts.sourceSystem || 'the source system'} to ${iflowFacts.targetSystem || 'the target system'}` : 'orchestrates the integration process',
      iflowFacts.deploymentStatus ? `deployment evidence: ${iflowFacts.deploymentStatus}` : '',
      iflowFacts.runtimeStatus ? `runtime status: ${iflowFacts.runtimeStatus}` : ''
    ].filter(Boolean).join('; ');
    return `${summary}. Process evidence: ${iflowFacts.processSteps.slice(0, 10).join(' -> ')}.`;
  }
  const commerceFacts = area.id === 'sap-commerce' ? extractCommerceFacts(form, screenshots) : null;
  if (commerceFacts?.processSteps?.length) {
    const entryPoint = commerceFacts.method ? `Method ${commerceFacts.method}()` : 'The OCC REST endpoint';
    return `${entryPoint} is the SAP Commerce entry point. Process evidence: ${commerceFacts.processSteps.join(' -> ')}.`;
  }
  const genericFacts = extractGenericEvidenceFacts(form, area, screenshots);
  if (genericFacts.processSteps.length) {
    return `Process inferred from ${screenshots.length ? 'screenshot' : 'code'} evidence: ${genericFacts.processSteps.slice(0, 10).join(' -> ')}.`;
  }
  const screenshotText = screenshots
    .map((shot, index) => {
      const parts = [
        `Figure ${index + 1}`,
        shot.screenType,
        shot.caption || shot.name,
        shot.extractedText,
        shot.note
      ].map(safeLine).filter(Boolean);
      return parts.join(': ');
    })
    .filter(Boolean);
  if (screenshotText.length) {
    return `Process inferred from screenshot evidence: ${screenshotText.slice(0, 4).join(' -> ')}`;
  }

  const codeDetails = inferCodeDetails(getActiveCodeSnippet(form), area);
  const codeFlow = [
    form.codeFileName ? `Code artifact ${form.codeFileName}` : '',
    ...codeDetails.objects.map((item) => `Object ${item}`),
    ...codeDetails.operations,
    ...codeDetails.validations,
    ...codeDetails.integrations,
    ...codeDetails.persistence,
    ...codeDetails.errors
  ].filter(Boolean);
  if (codeFlow.length) return `Process inferred from code evidence: ${codeFlow.slice(0, 8).join(' -> ')}`;
  const providedProcess = evidenceLine(form, 'businessProcess');
  if (providedProcess && !isWeakScreenshotDefault(providedProcess)) return providedProcess;
  if (providedProcess) return providedProcess;
  return '';
}

function derivePurposeText(form, area, screenshots) {
  const providedPurpose = evidenceLine(form, 'overview');
  if (providedPurpose && !isNoisyEvidenceText(providedPurpose)) return providedPurpose;
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(form, screenshots) : null;
  if (iflowFacts?.hasEvidence) {
    const flowName = iflowFacts.iflowName || 'the SAP Integration Suite iFlow';
    const systems = iflowFacts.sourceSystem || iflowFacts.targetSystem
      ? ` from ${iflowFacts.sourceSystem || 'the source system'} to ${iflowFacts.targetSystem || 'the target system'}`
      : '';
    const flowActions = [
      iflowFacts.adapters.length ? `uses ${iflowFacts.adapters.join(', ')}` : '',
      iflowFacts.mappingSteps.length ? `maps/transforms payloads through ${iflowFacts.mappingSteps.slice(0, 4).join(', ')}` : '',
      iflowFacts.authSteps.length ? 'obtains and applies receiver authorization' : '',
      iflowFacts.exceptionSteps.length ? 'logs and routes exceptions through the configured exception subprocess' : ''
    ].filter(Boolean).join('; ');
    return `This technical specification documents ${flowName}, which processes integration messages${systems}. It explains the sender/receiver connectivity, iFlow processing steps, payload mapping, authorization handling, logging, monitoring, exception handling, test scope, and handover details required for developers and support teams.${flowActions ? ` Evidence indicates the iFlow ${flowActions}.` : ''}`;
  }
  const commerceFacts = area.id === 'sap-commerce' ? extractCommerceFacts(form, screenshots) : null;
  if (commerceFacts?.hasEvidence) {
    const apiName = commerceFacts.method ? `${commerceFacts.method}()` : deriveDocumentTitle(form, area, screenshots);
    return `This technical specification documents the SAP Commerce Cloud OCC/API change for ${apiName}. It explains the REST entry point, request input, facade/service path, Commerce model access, DTO mapping, exception paths, testing scope, deployment/system-update considerations, and support handover needed for the IXOM Commerce change.`;
  }

  const genericFacts = extractGenericEvidenceFacts(form, area, screenshots);
  if (genericFacts.processSteps.length || genericFacts.title) {
    return `This document explains the ${area.name} implementation derived from the supplied ${screenshots.length ? 'screenshot evidence' : 'code evidence'}. It captures the technical object or artifact, process flow, implementation behavior, testing scope, deployment/support considerations, risks, and handover information required for review and beta validation.`;
  }

  return `This document captures the technical specification for ${deriveDocumentTitle(form, area, screenshots)} using the supplied evidence.`;
}

function deriveSystemText(form, area, screenshots) {
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(form, screenshots) : null;
  const inferredSystems = uniqueItems([
    iflowFacts?.sourceSystem,
    iflowFacts?.targetSystem
  ]).join(', ');
  if (inferredSystems) return inferredSystems;
  const genericSystems = extractGenericEvidenceFacts(form, area, screenshots).systems.join(', ');
  if (genericSystems) return genericSystems;
  return evidenceLine(form, 'system');
}

function getEvidenceProfile(form, area, screenshots) {
  const codeSnippet = getActiveCodeSnippet(form);
  const sourceMode = codeSnippet && screenshots.length ? 'combined' : screenshots.length ? 'screenshots' : (codeSnippet ? 'code' : 'manual');
  return {
    title: deriveDocumentTitle(form, area, screenshots),
    overview: derivePurposeText(form, area, screenshots),
    businessProcess: deriveBusinessProcessText(form, area, screenshots),
    configNotes: evidenceLine(form, 'configNotes'),
    testingNotes: evidenceLine(form, 'testingNotes'),
    risks: evidenceLine(form, 'risks'),
    revisionSummary: evidenceLine(form, 'revisionSummary'),
    system: deriveSystemText(form, area, screenshots),
    owner: evidenceLine(form, 'owner'),
    codeSnippet,
    codeFileName: safeLine(form.codeFileName),
    sourceMode
  };
}

function describeEvidenceSource(sourceMode) {
  if (sourceMode === 'combined') return 'Code and screenshot evidence';
  if (sourceMode === 'screenshots') return 'Screenshot evidence';
  if (sourceMode === 'code') return 'Code evidence';
  return 'Manual inputs';
}

function areaSpecificDetails(area, codeDetails, screenshots) {
  const evidence = collectEvidenceSummary(screenshots);
  const screenshotDetails = inferCodeDetails(getScreenshotEvidenceText(screenshots), area);
  const evidenceDetails = {
    objects: uniqueItems([...codeDetails.objects, ...screenshotDetails.objects]),
    validations: uniqueItems([...codeDetails.validations, ...screenshotDetails.validations]),
    integrations: uniqueItems([...codeDetails.integrations, ...screenshotDetails.integrations]),
    persistence: uniqueItems([...codeDetails.persistence, ...screenshotDetails.persistence]),
    security: uniqueItems([...codeDetails.security, ...screenshotDetails.security]),
    errors: uniqueItems([...codeDetails.errors, ...screenshotDetails.errors]),
    operations: uniqueItems([...codeDetails.operations, ...screenshotDetails.operations])
  };
  const genericFacts = extractGenericEvidenceFacts(null, area, screenshots);
  const objectText = evidenceDetails.objects.length ? evidenceDetails.objects.join(', ') : 'objects to be confirmed from repository/package';
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(null, screenshots) : null;
  const base = {
    'sap-abap': {
      'ABAP object inventory': [`ABAP objects identified or referenced: ${objectText}.`, 'Document object type, package, transport, activation status, and runtime entry point.', 'Confirm whether objects are custom Z/Y objects or extensions to standard SAP behavior.'],
      'Selection and business logic': [...evidenceDetails.validations, ...evidenceDetails.operations, 'Capture selection-screen parameters, filters, default values, and business rule branches.'],
      'Data access and CDS model': [...evidenceDetails.persistence, 'List SAP tables, CDS views, structures, keys, joins, and read/write impact.'],
      'Enhancements and exits': ['Confirm whether this is a BAdI, user exit, enhancement spot, implicit enhancement, custom report/class, or RAP/service extension.'],
      'Performance and locking': ['Document expected volume, SELECT strategy, indexes, buffering, enqueue/dequeue locking, update task, and commit/rollback behavior.'],
      'Error handling and application log': [...evidenceDetails.errors, 'Document message class/number, exception class, SLG1/application log object, and recovery steps.'],
      'Transport and deployment': ['Document transport request, package, dependencies, activation sequence, retrofit needs, and post-import validation.']
    },
    'sap-integration': {
      'Integration scenario': [
        iflowFacts?.iflowName ? `iFlow identified from screenshot: ${iflowFacts.iflowName}.` : '',
        iflowFacts?.packageName ? `Package/environment evidence: ${iflowFacts.packageName}.` : '',
        iflowFacts?.sourceSystem || iflowFacts?.targetSystem ? `Business data direction: ${iflowFacts.sourceSystem || 'source system'} to ${iflowFacts.targetSystem || 'target system'}.` : '',
        iflowFacts?.deploymentStatus ? `Deployment status captured: ${iflowFacts.deploymentStatus}.` : '',
        iflowFacts?.runtimeStatus ? `Runtime status captured: ${iflowFacts.runtimeStatus}.` : '',
        ...evidenceDetails.integrations,
        ...evidenceDetails.operations,
        ...(evidence.length ? [`Evidence reviewed: ${evidence[0]}`] : [])
      ],
      'Sender and receiver adapters': [
        ...(iflowFacts?.adapters || []),
        iflowFacts?.sourceSystem ? `Sender/source system: ${iflowFacts.sourceSystem}.` : '',
        iflowFacts?.targetSystem ? `Receiver/target endpoint: ${iflowFacts.targetSystem}.` : '',
        'Confirm endpoint URLs, credential aliases, timeout, QoS, retry, and connectivity route for each adapter.'
      ],
      'Message mapping and transformation': [
        ...(iflowFacts?.mappingSteps || []).map((step) => `Mapping step identified: ${step}.`),
        ...(iflowFacts?.mainSteps || []).filter((step) => /map|payload|attachment/i.test(step)).map((step) => `Main process step identified: ${step}.`),
        ...evidenceDetails.operations,
        'Document source-to-target field mapping, mandatory values, payload normalization, and any Groovy/content modifier behavior.'
      ],
      'Security material': [
        ...(iflowFacts?.authSteps || []).map((step) => `Authorization subprocess step identified: ${step}.`),
        ...evidenceDetails.security,
        'Document FarEye/API credential alias, OAuth/client-secret owner, certificate or destination dependency, and rotation process.'
      ],
      'Exception subprocess and retry': [
        ...(iflowFacts?.exceptionSteps || []).map((step) => `Exception handling evidence: ${step}.`),
        ...evidenceDetails.errors,
        'Document retry count, idempotency, duplicate handling, alerting, and manual reprocess path.'
      ],
      'Monitoring and reprocessing': [
        ...(iflowFacts?.mainSteps || []).filter((step) => /log/i.test(step)).map((step) => `Monitoring/logging step identified: ${step}.`),
        'Document message monitor location, MPL/correlation/message ID, payload visibility, alerting, and reprocess approach.',
        ...evidence.slice(0, 2)
      ]
    },
    'sap-btp-fiori': {
      'Fiori app intent and navigation': ['Document semantic object/action, launchpad tile, target mapping, inbound/outbound navigation, and primary user action.'],
      'UI/UX behavior': ['Document screen layout, field behavior, mandatory indicators, value helps, table/list behavior, buttons, messages, and user decision points.', ...evidence.slice(0, 2)],
      'Fiori Elements annotations': ['Document floorplan, annotation files, UI facets, line items, identification, field groups, actions, side effects, and presentation variants.'],
      'UI5 components and extensions': [...evidenceDetails.objects.map((item) => `Component/object reference: ${item}.`), ...genericFacts.observations, 'Document manifest, component, controller extension, fragment, formatter, model, and routing changes.'],
      'OData and service binding': [...evidenceDetails.integrations, 'Document service URL, entity sets, operation/action imports, bindings, draft/read/update behavior, and backend service owner.'],
      'Launchpad content and deployment': ['Document content provider, app descriptor, catalog/group/space/page, role collection, deployment target, and cache/republish steps.'],
      'Roles and authorizations': [...evidenceDetails.security, 'Document role collections, catalog access, backend PFCG/authorization objects, and business role dependencies.'],
      'Accessibility and responsive behavior': ['Document keyboard navigation, labels, value-state messages, responsive layout behavior, device support, and accessibility considerations.']
    },
    'sap-cap': {
      'Domain model and entities': [...evidenceDetails.persistence, `Entities/services detected or referenced: ${objectText}.`],
      'Service API contract': [...evidenceDetails.integrations, 'Document service definitions, exposed entities, actions, events, API paths, and request/response behavior.'],
      'Event handlers and validations': [...evidenceDetails.operations, ...evidenceDetails.errors, 'Document custom handlers, validations, side effects, and transaction handling.'],
      'Persistence and data model': [...evidenceDetails.persistence, 'Document database artifacts, migrations, tenant isolation, seed data, and data retention assumptions.'],
      'Authentication and authorization': [...evidenceDetails.security, 'Document XSUAA scopes/roles, restrictions annotations, identity provider, and role collections.'],
      'Deployment and service bindings': ['Document MTA/modules, service bindings, destinations, HDI/container, Cloud Foundry/Kyma target, and environment variables.'],
      'Testing and mock data': ['Document unit/integration tests, mocked services, seed data, API test collections, and deployment smoke tests.']
    },
    'azure-logic-apps': {
      'Workflow trigger': ['Document trigger type, schedule/event/source, schema, and sample payload.'],
      'Action sequence': [...evidenceDetails.operations, `Workflow/action references: ${objectText}.`],
      'Connectors and identities': [...evidenceDetails.integrations, ...evidenceDetails.security, 'Document connector accounts, SAP/Azure endpoints, managed identity, and permission model.'],
      'Data operations and expressions': [...evidenceDetails.operations, 'Document compose/parse JSON/condition expressions, variables, and field mapping.'],
      'Retry and exception policy': [...evidenceDetails.errors, 'Document retry count, backoff, timeout, idempotency, scoped error handling, and duplicate handling.'],
      'Run history and diagnostics': ['Attach run IDs, action outputs, failure screenshots, and correlation IDs.', ...evidence.slice(0, 2)],
      'Environment configuration': ['Document connections, parameters, app settings, Key Vault references, and environment-specific values.']
    },
    'sap-spartacus': {
      'Feature module and routing': [`Feature/component references: ${objectText}.`, 'Document Angular module, route, guards, and lazy loading behavior.'],
      'CMS component mapping': ['Document CMS component mapping, slot/page dependency, page template, and content setup.'],
      'OCC API integration': [...evidenceDetails.integrations, 'Document OCC endpoint, request/response model, facade/adapter/converter, and error handling.'],
      'Storefront UI/UX behavior': [...evidenceDetails.operations, 'Document user journey, page states, empty/error/loading states, and responsive behavior.'],
      'State management and guards': ['Document facade usage, NgRx/store impact, guards, resolvers, and route protection.'],
      'Responsive and accessibility behavior': ['Document mobile/desktop behavior, keyboard support, ARIA labels, and accessibility constraints.'],
      'Testing and regression scope': ['Document unit/e2e scenarios, mocked OCC responses, regression areas, and browser/device coverage.']
    },
    'sap-commerce': {
      'Extension and module changes': [`Extension/object references: ${objectText}.`, 'Document extension, module, spring configuration, and build/update steps.'],
      'Items XML and type system': [...evidenceDetails.persistence, 'Document item types, attributes, relations, indexes, and deployment/update impact.'],
      'Service/facade/populator logic': [...evidenceDetails.operations, 'Document service/facade/populator/converter changes and data flow between layers.'],
      'Impex and sample data': ['Document impex files, sample data, environment-specific values, and rollback approach.'],
      'Cronjobs and tasks': ['Document cronjob/service/facade behavior, schedule, triggers, and monitoring location if applicable.'],
      'Backoffice and HAC validation': [...evidence.slice(0, 2), 'Document Backoffice screens, HAC scripts, FlexibleSearch, and operational validation.'],
      'Deployment and system update': ['Document system update, initialization impact, build pipeline, cloud hot folder/media migration, and rollback.']
    },
    'sap-rap': {
      'RAP data model': [...evidenceDetails.persistence, `Root/projection objects detected or referenced: ${objectText}.`],
      'Behavior definition and implementation': [...evidenceDetails.operations, ...evidenceDetails.validations, 'Document managed/unmanaged behavior, actions, determinations, validations, and behavior pool methods.'],
      'Projection and service exposure': [...evidenceDetails.integrations, 'Document projection views, service definition, service binding, publication status, and protocol.'],
      'Fiori Elements annotations': ['Document UI annotations, facets, line items, identification, field groups, actions, side effects, and value helps.'],
      'Draft and locking behavior': ['Document draft enablement, locks, ETags, numbering, save/activate flow, and concurrent edit behavior.'],
      'Authorization and feature control': [...evidenceDetails.security, 'Document authorization master, instance authorization, feature control, and business role dependencies.'],
      'Service binding and publication': ['Document binding type, preview app, published service URL, transport, and activation/deployment steps.']
    },
    'sap-bw': {
      'Source system and extraction': ['Document source system, extractor/connection, delta method, and source dependencies.'],
      'Data model/provider': [...evidenceDetails.persistence, `Provider/model references: ${objectText}.`],
      'Transformations and business rules': [...evidenceDetails.operations, 'Document transformation rules, routines, currency/unit handling, and semantic mappings.'],
      'Queries and consumption model': ['Document query/view, variables, restricted/calculated key figures, hierarchies, and consuming reports.'],
      'Scheduling and dependencies': ['Document process chain, task chain, schedule, dependencies, restart point, and SLA.'],
      'Reconciliation and data quality': ['Document record counts, totals, duplicate checks, exception reports, and reconciliation evidence.', ...evidence.slice(0, 2)],
      'Authorization and transport': [...evidenceDetails.security, 'Document analysis authorizations, spaces/roles, transport path, and post-import validation.']
    },
    'sap-mdg': {
      'Master data object and scope': [`Master data/entity references: ${objectText}.`, 'Document object scope, create/change/display behavior, and governance domain.'],
      'Change request type': ['Document CR type, steps, priorities, statuses, and triggering business scenario.'],
      'MDG data model and UI': [...evidenceDetails.persistence, 'Document entity type, attributes, UI configuration, feeder classes, and field properties.'],
      'Workflow and approvals': ['Document workflow path, approver roles, agent determination, escalation, and rejection/rework behavior.'],
      'Validations and derivations': [...evidenceDetails.validations, ...evidenceDetails.operations, 'Document BRF+ rules, derivations, duplicate checks, and error messages.'],
      'Replication and key mapping': [...evidenceDetails.integrations, 'Document target systems, DRF/replication model, key mapping, and outbound status handling.'],
      'Governance roles and audit trail': [...evidenceDetails.security, 'Document governance roles, authorization, audit fields, change history, and compliance evidence.']
    }
  };

  return base[area.id] || {};
}

function buildSectionInsights(area, section, form, screenshots) {
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const codeDetails = inferCodeDetails(getActiveEvidenceText(form, screenshots), area);
  const specific = areaSpecificDetails(area, codeDetails, screenshots)[section] || [];
  const evidence = collectEvidenceSummary(screenshots);
  const generic = [
    `${section} is part of the ${area.name} delivery scope for "${evidenceProfile.title}".`,
    evidenceProfile.codeFileName ? `Code artifact reviewed: ${evidenceProfile.codeFileName}.` : '',
    ...codeDetails.operations,
    ...codeDetails.integrations,
    ...codeDetails.validations,
    ...codeDetails.persistence,
    ...codeDetails.security,
    ...codeDetails.errors,
    ...(evidence.length ? [`Evidence basis: ${evidence[0]}`] : [])
  ];

  const merged = [...specific, ...generic]
    .filter(Boolean)
    .filter((value, index, list) => list.indexOf(value) === index)
    .slice(0, 5);

  return merged.length ? merged : [`Add implementation details for ${section}.`];
}

function buildImplementationSummary(form, area, screenshots) {
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const evidenceText = getActiveEvidenceText(form, screenshots);
  const codeDetails = inferCodeDetails(evidenceText, area);
  const signals = detectCodeSignals(evidenceText, area);
  const evidence = collectEvidenceSummary(screenshots);
  const contextItems = buildProjectContextItems(form);
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(form, screenshots) : null;
  if (iflowFacts?.hasEvidence) {
    return [
      `This specification documents ${iflowFacts.iflowName || evidenceProfile.title} for ${area.name}.`,
      iflowFacts.sourceSystem || iflowFacts.targetSystem ? `Integration direction: ${iflowFacts.sourceSystem || 'source system'} to ${iflowFacts.targetSystem || 'target system'}.` : '',
      iflowFacts.adapters.length ? `Connectivity evidence: ${iflowFacts.adapters.join(', ')}.` : '',
      iflowFacts.mainSteps.length ? `Main iFlow sequence: ${iflowFacts.mainSteps.join(' -> ')}.` : '',
      iflowFacts.mappingSteps.length ? `Mapping/transformation sequence: ${iflowFacts.mappingSteps.join(' -> ')}.` : '',
      iflowFacts.authSteps.length ? `Authorization sequence: ${iflowFacts.authSteps.join(' -> ')}.` : '',
      iflowFacts.exceptionSteps.length ? `Exception handling evidence: ${iflowFacts.exceptionSteps.join(', ')}.` : '',
      evidence.length ? `Primary screenshot evidence reviewed: ${evidence[0]}.` : '',
      contextItems.length ? `Project context applied: ${contextItems.slice(0, 3).join(' ')}` : '',
      safeLine(form.templateOutline) ? 'Customer template guidance was used to shape the document layout and handover content.' : ''
    ].filter(Boolean);
  }
  const commerceFacts = area.id === 'sap-commerce' ? extractCommerceFacts(form, screenshots) : null;
  if (commerceFacts?.hasEvidence) {
    return [
      `This specification documents ${commerceFacts.title || evidenceProfile.title} for ${area.name}.`,
      commerceFacts.method ? `Primary entry point: OCC/API method ${commerceFacts.method}().` : '',
      commerceFacts.deliveryIdSignals ? 'Business input: delivery ID drives the enrichment lookup and response.' : '',
      commerceFacts.facadeClasses.length ? `Commerce layer evidence: ${commerceFacts.facadeClasses.slice(0, 4).join(', ')}.` : '',
      commerceFacts.models.length ? `Model evidence: ${commerceFacts.models.slice(0, 4).join(', ')}.` : '',
      commerceFacts.dtos.length ? `DTO/response mapping evidence: ${commerceFacts.dtos.slice(0, 4).join(', ')}.` : '',
      commerceFacts.exceptionTypes.length ? `Exception evidence: ${commerceFacts.exceptionTypes.slice(0, 4).join(', ')}.` : '',
      evidence.length ? `Screenshot/visual evidence reviewed: ${evidence[0]}.` : '',
      contextItems.length ? `Project context applied: ${contextItems.slice(0, 3).join(' ')}` : '',
      safeLine(form.templateOutline) ? 'Customer template guidance was used to shape the document layout and handover content.' : ''
    ].filter(Boolean);
  }
  const summary = [
    `This specification documents ${evidenceProfile.title} for ${area.name}.`,
    evidenceProfile.sourceMode === 'combined' ? 'Evidence source: code and screenshots are both used; code provides implementation detail and screenshots provide visual/process proof.' : '',
    evidenceProfile.sourceMode === 'screenshots' ? 'Evidence source: uploaded screenshot(s); code sections are included only when code is also supplied.' : '',
    evidenceProfile.sourceMode === 'code' ? `Evidence source: code snippet${evidenceProfile.codeFileName ? ` from ${evidenceProfile.codeFileName}` : ''}.` : '',
    evidenceProfile.businessProcess ? `Business/process flow evidence: ${evidenceProfile.businessProcess}` : '',
    codeDetails.objects.length ? `Key technical objects or identifiers inferred from the snippet: ${codeDetails.objects.join(', ')}.` : '',
    signals[0],
    evidence.length ? `Primary screenshot evidence reviewed: ${evidence[0]}.` : '',
    contextItems.length ? `Project context applied: ${contextItems.slice(0, 3).join(' ')}` : '',
    safeLine(form.templateOutline) ? 'Customer template guidance was used to shape the document layout and handover content.' : ''
  ];

  return summary.filter(Boolean);
}

function hasAny(value, patterns) {
  return patterns.some((pattern) => pattern.test(value));
}

function extractBusinessProcessSteps(value) {
  const text = safeLine(value);
  if (!text) return [];
  const normalized = text
    .replace(/\s*(?:->|→)\s*/g, '. ')
    .replace(/\s+(?:then|after that|afterwards)\s+/gi, '. ')
    .replace(/\s*;\s*/g, '. ');
  const parts = normalized
    .split(/(?:\r?\n|(?<=[.!?])\s+)/)
    .map((part) => safeLine(part).replace(/[.!?]+$/g, ''))
    .filter((part) => part.length > 8);
  return (parts.length ? parts : [text]).slice(0, 8);
}

function buildProcessFlowSteps(form, area, screenshots) {
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(form, screenshots) : null;
  if (iflowFacts?.processSteps?.length) {
    return iflowFacts.processSteps.slice(0, 18);
  }
  const commerceFacts = area.id === 'sap-commerce' ? extractCommerceFacts(form, screenshots) : null;
  if (commerceFacts?.processSteps?.length) {
    return commerceFacts.processSteps.slice(0, 18);
  }
  const genericFacts = extractGenericEvidenceFacts(form, area, screenshots);
  if (genericFacts.processSteps.length >= 2) {
    return genericFacts.processSteps.slice(0, 18);
  }
  const describedSteps = extractBusinessProcessSteps(evidenceProfile.businessProcess);
  if (describedSteps.length) {
    return describedSteps;
  }

  const code = evidenceProfile.codeSnippet || '';
  const hasEvidence = safeLine(code) || screenshots.length || evidenceProfile.overview;
  if (!hasEvidence) return [];

  const context = [
    code,
    evidenceProfile.businessProcess,
    evidenceProfile.overview,
    ...screenshots.flatMap((shot) => [shot.screenType, shot.caption, shot.extractedText, shot.note, shot.name])
  ].map(safeLine).join(' ').toLowerCase();
  const codeDetails = inferCodeDetails(code, area);
  const steps = [];

  if (hasAny(context, [/trigger|schedule|event|button|tile|launchpad|source|sender|workflow|http|api|request|payload/])) {
    steps.push('Trigger/Input: The process starts from the user action, source system event, scheduled workflow, API request, or incoming payload described in the supplied evidence.');
  }

  if (codeDetails.operations.some((item) => /payload|parsing|serialization|mapping|transformation/i.test(item)) || hasAny(context, [/deserialize|serialize|mapping|transform|payload|json|xml|content modifier|message mapping/])) {
    steps.push('Parse/Map: The supplied code or evidence indicates payload parsing, serialization, mapping, or transformation before the SAP target operation.');
  }

  if (codeDetails.validations.length || hasAny(context, [/mandatory|required|validate|validation|is initial|invalid|missing/])) {
    steps.push('Validate: Mandatory fields and business rules are checked before processing continues; validation failures should route to error handling.');
  }

  if (codeDetails.security.length || hasAny(context, [/role|authorization|oauth|credential|destination|secret|certificate|authority-check/])) {
    steps.push('Authorize/Connect: The process depends on roles, credentials, destinations, certificates, or connector accounts to call the target system.');
  }

  if (codeDetails.integrations.length || hasAny(context, [/adapter|iflow|odata|service|api|connector|logic app|occ|receiver|sender|endpoint/])) {
    steps.push('Integrate: Data is passed through an integration/API/service layer; document sender, receiver, endpoint, adapter/connector, and message correlation ID.');
  }

  if (codeDetails.persistence.length || hasAny(context, [/select|insert|update|modify|delete|entity|table|cds|database|persist/])) {
    steps.push('Read/Update Data: The implementation reads or updates SAP/application data; document impacted tables, entities, keys, and commit/rollback behavior.');
  }

  if (hasAny(context, [/loop|filter|where|case|switch|if |rule|condition|business rule/])) {
    steps.push('Apply Business Logic: Conditional, filtering, looping, or rule-based processing determines how records are selected, transformed, or posted.');
  }

  if (hasAny(context, [/success|completed|processed|posted|green|200|ok|created|updated/])) {
    steps.push('Success Outcome: Evidence indicates a successful processing or posting state; document resulting status, confirmation message, and output object.');
  }

  if (codeDetails.errors.length || hasAny(context, [/error|failed|exception|timeout|retry|reprocess|dead letter|alert|red|dump/])) {
    steps.push('Exception Path: Errors, missing data, failed calls, or timeouts should be logged and handled through retry, reprocess, alerting, or support correction.');
  }

  if (hasAny(context, [/monitor|trace|log|run history|message id|correlation|application log|slg1|payload/])) {
    steps.push('Monitor/Support: Runtime evidence should be tracked using message ID, run history, trace, application log, or support queue details.');
  }

  return steps.filter((step, index, list) => list.indexOf(step) === index);
}

function buildProcessFlowText(form, area, screenshots) {
  return buildProcessFlowSteps(form, area, screenshots)
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');
}

function splitDetailedFlowSteps(values) {
  return values
    .flatMap((value) => safeLine(value)
      .replace(/\s*(?:->|→)\s*/g, '. ')
      .split(/(?:\r?\n|(?<=[.!?])\s+|\s*;\s*|\s*,\s+|\s+\band\b\s+|\s+\bthen\b\s+)/i)
    )
    .map((value) => safeLine(value).replace(/^[\d.)\s-]+/, '').replace(/[.!?]+$/g, ''))
    .filter((value) => value.length > 5)
    .filter((value, index, list) => list.indexOf(value) === index);
}

function buildTechnicalDiagramSteps(form, area, screenshots) {
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(form, screenshots) : null;
  if (iflowFacts?.diagramSteps?.length >= 3) return iflowFacts.diagramSteps.slice(0, 16);
  const commerceFacts = area.id === 'sap-commerce' ? extractCommerceFacts(form, screenshots) : null;
  if (commerceFacts?.processSteps?.length >= 3) return commerceFacts.processSteps.slice(0, 16);
  const genericFacts = extractGenericEvidenceFacts(form, area, screenshots);
  if (genericFacts.diagramSteps.length >= 3) return genericFacts.diagramSteps.slice(0, 16);
  const describedSteps = splitDetailedFlowSteps(extractBusinessProcessSteps(evidenceProfile.businessProcess));
  if (describedSteps.length >= 3) return describedSteps.slice(0, 16);

  const code = evidenceProfile.codeSnippet || '';
  const context = [
    code,
    evidenceProfile.businessProcess,
    evidenceProfile.overview,
    ...screenshots.flatMap((shot) => [shot.screenType, shot.caption, shot.extractedText, shot.note, shot.name])
  ].map(safeLine).join(' ').toLowerCase();
  const codeDetails = inferCodeDetails(code, area);
  const steps = [];
  const addStep = (condition, label) => {
    if (condition && !steps.includes(label)) steps.push(label);
  };

  addStep(hasAny(context, [/trigger|schedule|event|button|tile|launchpad|source|sender|workflow|http|api|request|payload/]), 'Inferred from evidence: receive trigger or user action');
  addStep(hasAny(context, [/payload|json|xml|message|body|request/]) || codeDetails.operations.some((item) => /payload|parsing|serialization/i.test(item)), 'Inferred from evidence: read incoming payload');
  addStep(codeDetails.operations.some((item) => /payload|parsing|serialization/i.test(item)) || hasAny(context, [/deserialize|serialize|parse|json|xml/]), 'Inferred from code/evidence: parse source structure');
  addStep(codeDetails.operations.some((item) => /mapping|transformation/i.test(item)) || hasAny(context, [/mapping|transform|content modifier|message mapping|field mapping/]), 'Inferred from evidence: map source fields to target');
  addStep(codeDetails.validations.length || hasAny(context, [/mandatory|required|validate|validation|is initial|invalid|missing/]), 'Inferred from evidence: validate mandatory fields');
  addStep(hasAny(context, [/rule|condition|case|switch|if |filter|where|loop|business rule/]), 'Inferred from evidence: apply business rules');
  addStep(codeDetails.security.length || hasAny(context, [/role|authorization|oauth|credential|destination|secret|certificate|authority-check/]), 'Inferred from evidence: check access and credentials');
  addStep(codeDetails.integrations.length || hasAny(context, [/adapter|iflow|odata|service|api|connector|logic app|occ|receiver|sender|endpoint/]), 'Inferred from evidence: call integration or service layer');
  addStep(hasAny(context, [/receiver|target|sap|s\/4|commerce|btp|azure|endpoint/]), 'Inferred from evidence: route to target system');
  addStep(codeDetails.persistence.length || hasAny(context, [/select|read|entity|table|cds|database/]), 'Inferred from evidence: read target data');
  addStep(codeDetails.persistence.length || hasAny(context, [/insert|update|modify|delete|persist|commit|posted|created|updated/]), 'Inferred from evidence: create or update records');
  addStep(hasAny(context, [/response|acknowledg|confirmation|status|200|ok|success|completed|processed|green/]), 'Inferred from evidence: return status or confirmation');
  addStep(codeDetails.errors.length || hasAny(context, [/error|failed|exception|timeout|retry|reprocess|dead letter|alert|red|dump/]), 'Inferred from evidence: log and route exceptions');
  addStep(hasAny(context, [/retry|reprocess|dead letter|queue|resubmit/]), 'Inferred from evidence: retry or reprocess failed item');
  addStep(hasAny(context, [/monitor|trace|log|run history|message id|correlation|application log|slg1|payload/]), 'Inferred from evidence: monitor logs and message IDs');
  addStep(evidenceProfile.testingNotes, 'Provided by tester: validate with test evidence');

  if (steps.length >= 3) return steps.slice(0, 16);
  if (evidenceProfile.sourceMode === 'screenshots' && !screenshots.some((shot) => displayEvidenceText(shot.extractedText) || safeLine(shot.note))) {
    return [];
  }
  return buildProcessFlowSteps(form, area, screenshots)
    .flatMap((step) => splitDetailedFlowSteps([step]))
    .slice(0, 16);
}

function cleanFlowLabel(value, fallback) {
  return safeLine(value)
    .replace(/[`"'<>|{}[\]]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 72)
    || fallback;
}

function parseFlowStep(value) {
  const text = safeLine(value);
  const match = text.match(/^([^:]{3,42}):\s*(.+)$/);
  if (!match) return { group: 'Process', label: text };
  return {
    group: cleanFlowLabel(match[1], 'Process'),
    label: cleanFlowLabel(match[2], 'Process step')
  };
}

function wrapSvgText(value, maxLength = 22) {
  const words = cleanFlowLabel(value, 'Process step')
    .split(' ')
    .flatMap((word) => {
      if (word.length <= maxLength) return [word];
      const chunks = [];
      for (let index = 0; index < word.length; index += maxLength) {
        chunks.push(word.slice(index, index + maxLength));
      }
      return chunks;
    });
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function buildMermaidFlowDiagram(steps) {
  const usableSteps = steps.filter(Boolean);
  if (!usableSteps.length) return '';

  const parsedSteps = usableSteps.map(parseFlowStep);
  const hasGroups = parsedSteps.some((step) => step.group !== 'Process');
  if (hasGroups) {
    const groups = uniqueItems(parsedSteps.map((step) => step.group));
    const subgraphs = groups.flatMap((group, groupIndex) => {
      const groupNodes = parsedSteps
        .map((step, index) => ({ ...step, nodeId: `S${index + 1}` }))
        .filter((step) => step.group === group)
        .map((step) => `    ${step.nodeId}["${cleanFlowLabel(step.label, step.nodeId)}"]`);
      return [`  subgraph G${groupIndex}["${cleanFlowLabel(group, `Group ${groupIndex + 1}`)}"]`, ...groupNodes, '  end'];
    });
    const links = usableSteps.slice(1).map((_, index) => `  S${index + 1} --> S${index + 2}`);
    return ['```mermaid', 'flowchart TD', ...subgraphs, ...links, '```'].join('\n');
  }

  const nodes = parsedSteps.map((step, index) => {
    const nodeId = `S${index + 1}`;
    return `  ${nodeId}["${cleanFlowLabel(step.label, `Step ${index + 1}`)}"]`;
  });
  const links = usableSteps.slice(1).map((_, index) => `  S${index + 1} --> S${index + 2}`);

  return ['```mermaid', 'flowchart TD', ...nodes, ...links, '```'].join('\n');
}

function buildFlowDiagramSvg(steps) {
  const usableSteps = steps.filter(Boolean).slice(0, 16);
  if (!usableSteps.length) return '';

  const parsedSteps = usableSteps.map(parseFlowStep);
  const columnCount = Math.min(4, usableSteps.length);
  const nodeWidth = 196;
  const nodeHeight = 82;
  const gapX = 36;
  const gapY = 42;
  const marginX = 28;
  const marginTop = 70;
  const rowCount = Math.ceil(usableSteps.length / columnCount);
  const width = marginX * 2 + columnCount * nodeWidth + (columnCount - 1) * gapX;
  const height = marginTop + rowCount * nodeHeight + (rowCount - 1) * gapY + 44;
  const nodePosition = (index) => {
    const row = Math.floor(index / columnCount);
    const column = index % columnCount;
    return {
      x: marginX + column * (nodeWidth + gapX),
      y: marginTop + row * (nodeHeight + gapY),
      row,
      column
    };
  };

  const connectors = usableSteps.slice(1).map((_, index) => {
    const from = nodePosition(index);
    const to = nodePosition(index + 1);
    const fromX = from.x + nodeWidth;
    const fromY = from.y + nodeHeight / 2;
    const toX = to.x;
    const toY = to.y + nodeHeight / 2;

    if (from.row === to.row) {
      return `<path d="M ${fromX} ${fromY} H ${toX - 12}" fill="none" stroke="#167a5b" stroke-width="4" marker-end="url(#arrow)" />`;
    }

    const midY = from.y + nodeHeight + gapY / 2;
    return `<path d="M ${from.x + nodeWidth / 2} ${from.y + nodeHeight} V ${midY} H ${to.x + nodeWidth / 2} V ${to.y - 12}" fill="none" stroke="#167a5b" stroke-width="4" marker-end="url(#arrow)" />`;
  }).join('\n');

  const nodes = parsedSteps.map((step, index) => {
    const { x, y } = nodePosition(index);
    const isStart = index === 0;
    const isEnd = index === usableSteps.length - 1;
    const isException = /exception/i.test(step.group);
    const isSubprocess = /subprocess/i.test(step.group);
    const fill = isStart ? '#101820' : isEnd ? '#167a5b' : isException ? '#fff8e8' : isSubprocess ? '#ecf7f2' : '#f3fbf7';
    const stroke = isStart ? '#101820' : isException ? '#9a392f' : '#167a5b';
    const textColor = isStart || isEnd ? '#ffffff' : '#101820';
    const groupColor = isStart || isEnd ? '#7fe0c5' : isException ? '#9a392f' : '#167a5b';
    const lines = wrapSvgText(step.label, 20);
    const textStartY = y + 43 - (lines.length - 1) * 7;

    return [
      `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />`,
      `<text x="${x + 14}" y="${y + 18}" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="${groupColor}">${escapeHtml(step.group.toUpperCase())}</text>`,
      `<circle cx="${x + 22}" cy="${y + 38}" r="12" fill="${isStart || isEnd ? '#ffffff' : stroke}" opacity="${isStart || isEnd ? '0.95' : '1'}" />`,
      `<text x="${x + 22}" y="${y + 42}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="800" fill="${isStart || isEnd ? '#101820' : '#ffffff'}">${index + 1}</text>`,
      ...lines.map((line, lineIndex) => `<text x="${x + 42}" y="${textStartY + lineIndex * 16}" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="${textColor}">${escapeHtml(line)}</text>`)
    ].join('\n');
  }).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Technical process flow diagram">
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
      <path d="M 0 0 L 12 6 L 0 12 z" fill="#167a5b" />
    </marker>
  </defs>
  <rect width="${width}" height="${height}" rx="18" fill="#ffffff" />
  <rect x="18" y="18" width="${width - 36}" height="${height - 36}" rx="14" fill="#f7fbf9" stroke="#101820" stroke-width="2" />
  <text x="30" y="48" font-family="Arial, sans-serif" font-size="20" font-weight="800" fill="#101820">Technical Flow Diagram</text>
  <text x="${width - 30}" y="48" text-anchor="end" font-family="Arial, sans-serif" font-size="12" font-weight="800" fill="#167a5b">Detailed technical steps</text>
  ${connectors}
  ${nodes}
</svg>`;
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function svgToPngBytes(svg, width = 980, height = 430) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not create flow diagram canvas context');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        canvas.toBlob(async (pngBlob) => {
          URL.revokeObjectURL(url);
          if (!pngBlob) {
            reject(new Error('Could not render flow diagram fallback'));
            return;
          }
          resolve(new Uint8Array(await pngBlob.arrayBuffer()));
        }, 'image/png');
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load flow diagram SVG'));
    };
    image.src = url;
  });
}

async function createFlowDiagramAsset(steps) {
  const svg = buildFlowDiagramSvg(steps);
  if (!svg) return null;
  const [, width = '980', height = '430'] = svg.match(/width="(\d+)" height="(\d+)"/) || [];
  const svgWidth = Number(width);
  const svgHeight = Number(height);

  try {
    return {
      svg,
      width: svgWidth,
      height: svgHeight,
      svgBytes: new TextEncoder().encode(svg),
      pngBytes: await svgToPngBytes(svg, svgWidth, svgHeight)
    };
  } catch {
    return null;
  }
}

function buildProcessFlowContent(form, area, screenshots) {
  const steps = buildProcessFlowSteps(form, area, screenshots);
  const diagramSteps = buildTechnicalDiagramSteps(form, area, screenshots);
  if (!steps.length) return '';

  return [
    steps.map((step, index) => `${index + 1}. ${step}`).join('\n'),
    '### Technical Flow Diagram',
    buildMermaidFlowDiagram(diagramSteps)
  ].join('\n\n');
}

function buildAutomaticTemplateOutline(form, area) {
  const selectedFormat = docFormats.find((format) => format.id === form.format) ?? docFormats[1];
  const designSections = area.sections.map((section, index) => `${index + 1}. ${section}`).join('\n');
  const profile = areaDocumentProfiles[area.id];
  const checklist = Object.keys(profile?.checklistDetails || {})
    .map((item) => `- ${item}: ${profile.checklistDetails[item]}`)
    .join('\n');
  const requiredHeaders = requiredDocumentHeaders
    .map((header, index) => `${index + 1}. ${header}${header === 'Technical Design' ? ' (dynamic for selected solution area)' : ''}`)
    .join('\n');

  return [
    `Document type: ${selectedFormat.name}`,
    `Solution area: ${area.name}`,
    '',
    'Required section order:',
    requiredHeaders,
    '',
    'Dynamic Technical Design subsections for this solution area:',
    designSections,
    '',
    'Area-specific checklist focus:',
    checklist || area.prompts.map((prompt) => `- ${prompt}`).join('\n'),
    '',
    'Generation rule: populate sections from the selected solution area, code snippet, screenshot evidence, process notes, and testing/risk inputs.'
  ].join('\n');
}

function getTemplateMode(form) {
  return form.templateMode === 'upload' ? 'upload' : 'auto';
}

function getTemplateGuidance(form, area) {
  if (getTemplateMode(form) === 'upload') {
    return safeLine(form.templateOutline) || 'Uploaded template selected. Paste required headings, section order, mandatory tables, approval fields, or style rules for stronger alignment.';
  }

  return buildAutomaticTemplateOutline(form, area);
}

function buildTemplateAlignmentItems(form, area) {
  if (getTemplateMode(form) === 'upload') {
    return [
      'Template source: Customer-provided template.',
      safeLine(form.templateName) ? `Template file: ${safeLine(form.templateName)}.` : '',
      safeLine(form.templateOutline) ? `Applied template guidance: ${safeLine(form.templateOutline)}` : ''
    ].filter(Boolean);
  }

  return [
    `Template source: ${brandName} standard technical specification structure for ${area.name}.`,
    'The document has been organized for developer handover, support readiness, and beta-test review.'
  ];
}

function buildTemplateAlignmentContent(form, area) {
  return bulletList(buildTemplateAlignmentItems(form, area));
}

function buildProjectContextItems(form) {
  return [
    safeLine(form.jiraContext) ? `Jira / work item context: ${safeLine(form.jiraContext)}` : '',
    safeLine(form.designContext) ? `Design / HLD context: ${safeLine(form.designContext)}` : '',
    safeLine(form.architectureContext) ? `Architecture or diagram reference: ${safeLine(form.architectureContext)}` : '',
    safeLine(form.decisionContext) ? `Meeting notes / decisions: ${safeLine(form.decisionContext)}` : '',
    safeLine(form.apiContext) ? `Integration mapping / API details: ${safeLine(form.apiContext)}` : ''
  ].filter(Boolean);
}

function buildContextDrivenItems(form, area, screenshots) {
  const contextItems = buildProjectContextItems(form);
  if (!contextItems.length) return [];
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  return [
    ...contextItems,
    `Context use: align ${area.name} documentation for "${evidenceProfile.title}" with the referenced delivery scope, acceptance criteria, design decisions, architecture, mapping/API contract, and review notes.`,
    'Consultants should confirm any context that conflicts with visible code, screenshots, or implementation evidence before sign-off.'
  ];
}

function buildCommerceCodeUnderstanding(form, screenshots) {
  const facts = extractCommerceFacts(form, screenshots);
  const items = [];
  if (facts.method) items.push(`Entry method: ${facts.method}() handles the SAP Commerce OCC/API request${facts.deliveryIdSignals ? ' using a delivery ID as the driving input' : ''}.`);
  if (facts.controllers.length) items.push(`Controller/API evidence: ${facts.controllers.slice(0, 3).join(', ')}.`);
  if (facts.nullCheckSignals) items.push('Validation behavior: the implementation performs null/blank checks before continuing with delivery enrichment processing.');
  if (facts.facadeClasses.length) items.push(`Commerce layer path: the implementation delegates through facade/service classes such as ${facts.facadeClasses.slice(0, 4).join(', ')}.`);
  if (facts.models.length) items.push(`Model handling: Commerce model objects are read or cast, including ${facts.models.slice(0, 4).join(', ')}.`);
  if (facts.dtos.length) items.push(`DTO mapping: response data is mapped into DTO/WS DTO structures such as ${facts.dtos.slice(0, 4).join(', ')}.`);
  if (facts.exceptionTypes.length) items.push(`Exception paths: controlled error branches are present, including ${facts.exceptionTypes.slice(0, 4).join(', ')}.`);
  if (!items.length && safeLine(getActiveCodeSnippet(form))) {
    items.push('SAP Commerce code was supplied; review OCC controller method, facade/service delegation, model access, DTO mapping, validation, and exception paths.');
  }
  return items;
}

function buildCodeUnderstanding(form, area, screenshots = []) {
  if (area.id === 'sap-commerce') {
    const commerceItems = buildCommerceCodeUnderstanding(form, screenshots);
    if (commerceItems.length) return bulletList(commerceItems);
  }
  const signals = detectCodeSignals(getActiveCodeSnippet(form), area);
  return bulletList(signals);
}

function buildMappingSheetItems(form, area) {
  if (area.id !== 'sap-integration') return [];
  const reference = safeLine(form.mappingSheetReference);
  return [
    reference
      ? `Mapping sheet reference: ${reference}`
      : 'Mapping sheet reference: TBD - provide the Excel file name, SharePoint link, Google Drive link, or controlled repository link used for source-to-target field mapping.',
    'Consultants should validate source fields, target fields, mandatory/optional flags, default values, transformation rules, value mappings, and owner/sign-off against the mapping sheet.',
    'If no mapping sheet exists yet, create one before final handover and update this section with the approved link.'
  ];
}

function buildFormatFocusItems(form, area) {
  if (form.format === 'functional') {
    return [
      'Functional Spec focus: business scope, actors, process behavior, business rules, user experience, UAT, and acceptance criteria.',
      `For ${area.name}, confirm the functional outcomes expected from each selected solution-area checklist item.`
    ];
  }
  if (form.format === 'runbook') {
    return [
      'Support Runbook focus: ownership, monitoring, alerting, diagnostics, recovery, reprocessing, escalation, and operational risks.',
      `For ${area.name}, make support paths explicit enough for first-line and second-line teams to act.`
    ];
  }
  if (form.format === 'handover') {
    return [
      'Handover Pack focus: delivered scope, design/configuration summary, evidence, testing outcome, deployment status, support ownership, and open items.',
      `For ${area.name}, include enough implementation context for developers and support teams to take ownership.`
    ];
  }
  return [
    'Technical Spec focus: objects, services, logic, configuration, testing, deployment, monitoring, risks, and handover.',
    `For ${area.name}, keep the dynamic technical design sections aligned with the actual evidence supplied.`
  ];
}

function getChecklistRows(area) {
  const profile = areaDocumentProfiles[area.id];
  return area.prompts.map((prompt) => ({
    item: prompt,
    detail: profile?.checklistDetails?.[prompt] || 'Capture the relevant detail for this solution area and confirm it against code/screenshots.'
  }));
}

function buildAreaTestingStrategy(area, form, screenshots) {
  const profile = areaDocumentProfiles[area.id];
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const evidence = collectEvidenceSummary(screenshots);
  const base = profile?.testing || ['Validate happy path, failure path, authorization, deployment, and support monitoring for this solution area.'];
  return [
    ...base,
    evidenceProfile.testingNotes ? `Project-specific testing note: ${evidenceProfile.testingNotes}` : '',
    evidence.length ? `Evidence to attach: ${evidence[0]}` : ''
  ].filter(Boolean);
}

function getValidationProfile(area) {
  return areaValidationProfiles[area.id] || {
    unit: [`Create focused unit tests for reusable ${area.name} logic, validations, calculations, and exception branches.`],
    integration: [`Execute end-to-end ${area.name} tests across all touched systems, services, configuration, and user roles.`],
    regression: [`Retest impacted ${area.name} objects, upstream/downstream dependencies, authorizations, and existing business scenarios.`],
    deployment: [`Deploy ${area.name} changes using the approved environment path, capture version/transport details, and run post-deploy smoke tests.`]
  };
}

async function createBrandLogoAsset() {
  return {
    svgBytes: new TextEncoder().encode(brandLogoSvg),
    pngBytes: await svgToPngBytes(brandLogoSvg, 520, 150)
  };
}

function buildUnitTestingPlan(area, form) {
  const profile = getValidationProfile(area);
  const evidenceProfile = getEvidenceProfile(form, area, []);
  const codeDetails = inferCodeDetails(evidenceProfile.codeSnippet, area);
  return [
    evidenceProfile.testingNotes ? `Project testing scope: ${evidenceProfile.testingNotes}` : '',
    codeDetails.validations.length ? 'Unit tests should cover the validation and exception branches identified in the supplied code.' : '',
    codeDetails.operations.length ? 'Unit tests should cover the processing rules identified in the supplied code.' : '',
    !evidenceProfile.testingNotes && evidenceProfile.codeSnippet ? profile.unit[0] : ''
  ].filter(Boolean);
}

function buildIntegrationTestingPlan(area, form, screenshots) {
  const profile = getValidationProfile(area);
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const genericFacts = extractGenericEvidenceFacts(form, area, screenshots);
  const evidence = collectEvidenceSummary(screenshots);
  return [
    evidenceProfile.businessProcess ? `End-to-end test path: ${evidenceProfile.businessProcess}` : '',
    genericFacts.processSteps.length ? `Validate inferred evidence path: ${genericFacts.processSteps.slice(0, 5).join(' -> ')}` : '',
    evidence.length ? `Evidence to attach: ${evidence[0]}` : '',
    !evidenceProfile.businessProcess && !evidence.length && evidenceProfile.testingNotes ? profile.integration[0] : ''
  ].filter(Boolean);
}

function buildRegressionTestingPlan(area, form) {
  const evidenceProfile = getEvidenceProfile(form, area, []);
  return [
    evidenceProfile.testingNotes ? `Regression coverage should include the scenarios called out in testing notes: ${evidenceProfile.testingNotes}` : '',
    evidenceProfile.businessProcess ? `Regression should verify adjacent user journeys and integrations touched by: ${evidenceProfile.businessProcess}` : '',
    evidenceProfile.risks ? `Include risk-based regression for: ${evidenceProfile.risks}` : '',
    !evidenceProfile.testingNotes && !evidenceProfile.businessProcess ? getValidationProfile(area).regression[0] : ''
  ].filter(Boolean);
}

function buildDeploymentPlan(area, form) {
  const evidenceProfile = getEvidenceProfile(form, area, []);
  return [
    evidenceProfile.configNotes ? `Deployment/configuration notes: ${evidenceProfile.configNotes}` : '',
    evidenceProfile.system ? `Target landscape: ${evidenceProfile.system}.` : '',
    'Record release owner, version/transport, deployment date, rollback approach, and post-deployment smoke-test result.'
  ].filter(Boolean);
}

function buildMonitoringSupportPlan(area, form, screenshots) {
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const evidence = collectEvidenceSummary(screenshots);
  return [
    evidenceProfile.risks ? `Support watch items: ${evidenceProfile.risks}` : '',
    evidence.length ? `Support evidence/reference: ${evidence[0]}` : '',
    evidenceProfile.businessProcess ? `Support should validate the documented process outcome: ${evidenceProfile.businessProcess}` : '',
    !evidenceProfile.risks && !evidence.length ? buildAreaSupportNotes(area)[0] : ''
  ].filter(Boolean);
}

function buildApprovalHandoverPlan(area) {
  return [
    `Technical and business approvers should review the ${area.name} design, test evidence, deployment notes, and support procedure before release.`,
    'Handover should include the final specification, test evidence, release notes, known limitations, and support owner.'
  ];
}

function buildApprovalRows() {
  return [
    ['Business approver', ''],
    ['Technical approver', ''],
    ['Approval date', ''],
    ['Release/sign-off decision', 'Approved / Approved with conditions / Rejected'],
    ['Handover owner', ''],
    ['Handover date', '']
  ];
}

function buildRevisionRows(form) {
  return [
    [
      safeLine(form.documentVersion) || '0.1 Draft',
      new Date().toLocaleDateString(),
      safeLine(form.owner) || 'TBD',
      safeLine(form.revisionSummary) || 'Generated technical specification draft for review.'
    ]
  ];
}

function docParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { after: options.after ?? 140 },
    alignment: options.alignment,
    children: [
      new TextRun({
        text: safeLine(text) || options.fallback || '',
        bold: options.bold,
        italics: options.italics,
        size: options.size
      })
    ]
  });
}

function docHeading(text, level = HeadingLevel.HEADING_2) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 260, after: 120 }
  });
}

function docBullets(items) {
  return items.filter(Boolean).map((item) =>
    new Paragraph({
      text: item,
      bullet: { level: 0 },
      spacing: { after: 70 }
    })
  );
}

function docNumbered(items) {
  return items.filter(Boolean).map((item) =>
    new Paragraph({
      text: item,
      numbering: { reference: 'process-flow', level: 0 },
      spacing: { after: 70 }
    })
  );
}

function docCodeBlock(code) {
  return new Paragraph({
    spacing: { after: 140 },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'C8D4DA' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C8D4DA' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'C8D4DA' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'C8D4DA' }
    },
    children: String(code || '')
      .split('\n')
      .flatMap((line, index) => [
        new TextRun({ text: line || ' ', font: 'Consolas', size: 18 }),
        ...(index === String(code || '').split('\n').length - 1 ? [] : [new TextRun({ break: 1 })])
      ])
  });
}

function docInfoTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 28, type: WidthType.PERCENTAGE },
            shading: { fill: 'E8F2F4' },
            children: [docParagraph(label, { bold: true, after: 40 })]
          }),
          new TableCell({
            children: [docParagraph(value ?? '', { after: 40 })]
          })
        ]
      })
    )
  });
}

function docRevisionTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((row, rowIndex) =>
      new TableRow({
        children: row.map((cell) =>
          new TableCell({
            shading: rowIndex === 0 ? { fill: 'E8F2F4' } : undefined,
            children: [docParagraph(cell, { bold: rowIndex === 0, after: 40 })]
          })
        )
      })
    )
  });
}

function buildDocxDocument(form, area, screenshots, brandLogoAsset, flowDiagramAsset) {
  const selectedFormat = docFormats.find((format) => format.id === form.format) ?? docFormats[1];
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const templateRows = getTemplateMode(form) === 'upload'
    ? [
      ['Template source', 'Customer-provided template'],
      ...(safeLine(form.templateName) ? [['Template file', safeLine(form.templateName)]] : [])
    ]
    : [['Template source', `${brandName} standard technical specification`]];
  const logoChildren = [
    new Paragraph({
      children: [
        new ImageRun({
          type: 'svg',
          data: brandLogoAsset.svgBytes,
          fallback: {
            type: 'png',
            data: brandLogoAsset.pngBytes
          },
          transformation: { width: 245, height: 77 }
        })
      ]
    }),
    docParagraph(`Technical documentation generated by ${brandName}`, { size: 18 })
  ];
  const customerChildren = form.customerLogoDataUrl
    ? [
      docParagraph('Customer', { alignment: AlignmentType.RIGHT, bold: true, size: 18 }),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            type: imageTypeFromDataUrl(form.customerLogoDataUrl),
            data: dataUrlToBytes(form.customerLogoDataUrl),
            transformation: { width: 130, height: 65 }
          })
        ]
      })
    ]
    : [docParagraph('Customer logo optional', { alignment: AlignmentType.RIGHT, italics: true, size: 18 })];

  const children = [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: '1F5D6C' },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE }
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: logoChildren, width: { size: 62, type: WidthType.PERCENTAGE } }),
            new TableCell({ children: customerChildren, width: { size: 38, type: WidthType.PERCENTAGE } })
          ]
        })
      ]
    }),
    new Paragraph({ text: evidenceProfile.title || 'Technical Documentation', heading: HeadingLevel.TITLE }),
    docInfoTable([
      ['Document type', selectedFormat.name],
      ['Solution area', area.name],
      ['Document version', safeLine(form.documentVersion) || '0.1 Draft'],
      ['Owner', evidenceProfile.owner || 'TBD'],
      ['Systems', evidenceProfile.system || 'TBD'],
      ['Generated', new Date().toLocaleString()],
      ['Evidence source', describeEvidenceSource(evidenceProfile.sourceMode)],
      ...(evidenceProfile.codeFileName ? [['Code file', evidenceProfile.codeFileName]] : []),
      ...(area.id === 'sap-integration' ? [['Mapping sheet reference', safeLine(form.mappingSheetReference) || 'TBD - provide Excel/SharePoint/Google Drive link']] : []),
      ...templateRows
    ])
  ];

  let sectionNumber = 1;
  const addSection = (title, body, options = {}) => {
    const content = Array.isArray(body) ? body.filter(Boolean) : [body].filter(Boolean);
    if (!content.length && options.skipWhenEmpty) return;
    children.push(docHeading(`${sectionNumber}. ${title}`));
    children.push(...content);
    sectionNumber += 1;
  };
  const processFlowSteps = buildProcessFlowSteps(form, area, screenshots);
  const processFlowBody = processFlowSteps.length
    ? [
      ...docNumbered(processFlowSteps),
      docHeading('Technical Flow Diagram', HeadingLevel.HEADING_3),
      flowDiagramAsset
        ? new Paragraph({
          children: [
            new ImageRun({
              type: 'svg',
              data: flowDiagramAsset.svgBytes,
              fallback: {
                type: 'png',
                data: flowDiagramAsset.pngBytes,
                transformation: {
                  width: 560,
                  height: Math.round(560 * flowDiagramAsset.height / flowDiagramAsset.width)
                }
              },
              transformation: {
                width: 560,
                height: Math.round(560 * flowDiagramAsset.height / flowDiagramAsset.width)
              }
            })
          ]
        })
        : docParagraph('Technical flow diagram could not be rendered. Review the numbered process steps above.', { italics: true })
    ]
    : [];

  addSection('Purpose', [docParagraph(evidenceProfile.overview, { fallback: `This document is created to capture the technical specification for ${evidenceProfile.title} using the supplied ${describeEvidenceSource(evidenceProfile.sourceMode).toLowerCase()}.` })]);
  addSection('Generated Implementation Summary', docBullets(buildImplementationSummary(form, area, screenshots)));
  addSection('Revision History', [docRevisionTable([
    ['Version', 'Date', 'Author/Owner', 'Change Summary'],
    ...buildRevisionRows(form)
  ])]);
  addSection('Process Flow', processFlowBody, { skipWhenEmpty: true });
  addSection('Business Process', [docParagraph(evidenceProfile.businessProcess)], { skipWhenEmpty: true });
  addSection('Project Context', docBullets(buildContextDrivenItems(form, area, screenshots)), { skipWhenEmpty: true });
  addSection('Template Alignment', docBullets(buildTemplateAlignmentItems(form, area)));
  if (area.id === 'sap-integration') {
    addSection('Mapping Sheet', docBullets(buildMappingSheetItems(form, area)));
  }
  addSection('Document Type Focus', docBullets(buildFormatFocusItems(form, area)));
  addSection('Solution Area Checklist', [docInfoTable(getChecklistRows(area).map((row) => [row.item, row.detail]))]);
  addSection('Technical Design', area.sections.flatMap((section) => [
    docHeading(section, HeadingLevel.HEADING_3),
    ...docBullets(buildSectionInsights(area, section, form, screenshots))
  ]));
  addSection('Configuration Notes', [docParagraph(evidenceProfile.configNotes)], { skipWhenEmpty: true });

  if (safeLine(evidenceProfile.codeSnippet)) {
    addSection('Code Understanding', docBullets(area.id === 'sap-commerce' ? buildCommerceCodeUnderstanding(form, screenshots) : detectCodeSignals(evidenceProfile.codeSnippet, area)));
    addSection('Code Snippet', [docCodeBlock(evidenceProfile.codeSnippet)]);
  }

  if (screenshots.length) {
    addSection('Screenshot Evidence', screenshots.flatMap((shot, index) => [
      docHeading(`Figure ${index + 1}: ${safeLine(shot.caption) || shot.name}`, HeadingLevel.HEADING_3),
      ...(shot.dataUrl ? [new Paragraph({ children: [new ImageRun({ type: imageTypeFromDataUrl(shot.dataUrl), data: dataUrlToBytes(shot.dataUrl), transformation: { width: 520, height: 292 } })] })] : []),
      docInfoTable([
        ['Type', shot.screenType],
        ['File', `${shot.name} (${formatBytes(shot.size)})`],
        ['Readable evidence text', displayEvidenceText(shot.extractedText, 420)],
        ['Reviewer notes', safeLine(shot.note)]
      ])
    ]));
    addSection('Screenshot Review And Technical Interpretation', screenshots.flatMap((shot, index) => [
      docHeading(`Figure ${index + 1}: ${safeLine(shot.caption) || shot.name}`, HeadingLevel.HEADING_3),
      ...docBullets(getScreenshotObservations(shot, area))
    ]));
  }

  addSection('Unit Testing', docBullets(buildUnitTestingPlan(area, form)), { skipWhenEmpty: true });
  addSection('Integration Testing', docBullets(buildIntegrationTestingPlan(area, form, screenshots)), { skipWhenEmpty: true });
  addSection('Regression Testing And UAT', docBullets(buildRegressionTestingPlan(area, form)), { skipWhenEmpty: true });
  addSection('Deployment And Transport', docBullets(buildDeploymentPlan(area, form)), { skipWhenEmpty: true });
  addSection('Monitoring And Support', docBullets(buildMonitoringSupportPlan(area, form, screenshots)), { skipWhenEmpty: true });
  addSection('Risks, Assumptions, And Open Items', docBullets(buildAreaRiskControls(area, form)), { skipWhenEmpty: true });
  addSection('Approval And Handover', [
    ...docBullets(buildApprovalHandoverPlan(area)),
    docInfoTable(buildApprovalRows())
  ]);

  return new Document({
    numbering: {
      config: [
        {
          reference: 'process-flow',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT
            }
          ]
        }
      ]
    },
    sections: [{ children }]
  });
}

function buildAreaRiskControls(area, form) {
  const profile = areaDocumentProfiles[area.id];
  const evidenceProfile = getEvidenceProfile(form, area, []);
  return [
    ...(profile?.risks || ['Confirm solution-specific operational, security, transport, and data risks.']),
    evidenceProfile.risks ? `Project-specific risk/open item: ${evidenceProfile.risks}` : ''
  ].filter(Boolean);
}

function buildAreaSupportNotes(area) {
  const profile = areaDocumentProfiles[area.id];
  return profile?.support || [
    `Monitor the relevant ${area.name} runtime logs, deployment status, authorization failures, and business process outcomes.`,
    'Support should know the owner, object names, monitoring location, recovery steps, and escalation path.'
  ];
}

function buildScreenshotUnderstanding(shot, area, index) {
  const context = [shot.caption, shot.note, shot.extractedText, shot.name, shot.screenType].map(safeLine).join(' ').toLowerCase();
  const observations = getScreenshotObservations(shot, area, context);

  return `### Figure ${index + 1}: ${safeLine(shot.caption) || shot.name}\n${bulletList(observations)}`;
}

function getScreenshotObservations(shot, area, contextOverride) {
  const context = contextOverride ?? [shot.caption, shot.note, shot.extractedText, shot.name, shot.screenType].map(safeLine).join(' ').toLowerCase();
  const observations = [];
  const iflowFacts = area.id === 'sap-integration' ? extractIntegrationFlowFacts(null, [shot]) : null;
  const genericFacts = extractGenericEvidenceFacts(null, area, [shot]);

  if (shot.screenType) observations.push(`Screenshot type: ${shot.screenType}.`);
  if (safeLine(shot.caption)) observations.push(`Caption reviewed: ${safeLine(shot.caption)}.`);
  if (safeLine(shot.note)) observations.push(`Reviewer note: ${safeLine(shot.note)}.`);
  const readableText = displayEvidenceText(shot.extractedText, 220);
  if (readableText) observations.push(`Readable screenshot text used as evidence: ${readableText}.`);

  if (iflowFacts?.hasEvidence) {
    if (iflowFacts.iflowName) observations.push(`iFlow identified: ${iflowFacts.iflowName}.`);
    if (iflowFacts.sourceSystem || iflowFacts.targetSystem) observations.push(`Integration direction: ${iflowFacts.sourceSystem || 'source system'} to ${iflowFacts.targetSystem || 'target system'}.`);
    if (iflowFacts.adapters.length) observations.push(`Adapters/endpoints inferred: ${iflowFacts.adapters.join(', ')}.`);
    if (iflowFacts.mainSteps.length) observations.push(`Main process steps visible: ${iflowFacts.mainSteps.join(' -> ')}.`);
    if (iflowFacts.authSteps.length) observations.push(`Authorization subprocess visible: ${iflowFacts.authSteps.join(' -> ')}.`);
    if (iflowFacts.mappingSteps.length) observations.push(`Mapping subprocess visible: ${iflowFacts.mappingSteps.join(' -> ')}.`);
    if (iflowFacts.exceptionSteps.length) observations.push(`Exception handling visible: ${iflowFacts.exceptionSteps.join(', ')}.`);
    return observations;
  }

  if (genericFacts.hasEvidence && genericFacts.observations.length) {
    observations.push(...genericFacts.observations);
    if (genericFacts.processSteps.length) observations.push(`Process/technical flow inferred: ${genericFacts.processSteps.slice(0, 6).join(' -> ')}.`);
    if (/code review|ide|abap|cap|node|commerce|spartacus|fiori|logic|workflow|architecture/i.test(context)) {
      observations.push(`Technical interpretation: evidence is treated as ${area.name} implementation evidence and should populate object inventory, process flow, testing, monitoring, and handover sections from the visible code/screen content.`);
    }
    return observations;
  }

  if (/error|failed|exception|dump|red|invalid|unauthori[sz]ed|timeout/.test(context)) {
    observations.push('Technical interpretation: evidence appears to include an error or failure path; document root cause, retry/reprocess steps, and support ownership.');
  } else if (/success|completed|green|posted|processed|200|ok/.test(context)) {
    observations.push('Technical interpretation: evidence appears to show a successful processing state; link it to the happy-path validation scenario.');
  } else if (/monitor|message|run|trace|log|payload|iflow|integration/.test(context)) {
    observations.push('Technical interpretation: evidence appears integration-focused; document message ID, sender/receiver, payload mapping, and monitoring location.');
  } else if (/fiori|launchpad|tile|ui5|screen|app|semantic/.test(context)) {
    observations.push('Technical interpretation: evidence appears UI-focused; document app intent, role access, service binding, and user action shown.');
  } else if (/btp|destination|role|subaccount|cloud foundry|space/.test(context)) {
    observations.push('Technical interpretation: evidence appears BTP-focused; document subaccount, destination, role collection, service instance, and deployment target.');
  } else if (/logic app|workflow|trigger|connector|azure/.test(context)) {
    observations.push('Technical interpretation: evidence appears Azure workflow-focused; document trigger, connector actions, retry policy, and run history.');
  } else if (/abap|se38|se80|adt|class|method|transport|cds/.test(context)) {
    observations.push('Technical interpretation: evidence appears ABAP/development-focused; document object name, package, transport, dependencies, and activation status.');
  } else {
    observations.push(`Technical interpretation: review this figure against the ${area.name} design and document what object, configuration, test result, or runtime state it proves.`);
  }

  return observations;
}

function buildFormatSpecificSections(form, area, screenshots) {
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const areaPrompts = getChecklistRows(area).map((row) => `- ${row.item}: ${row.detail}`).join('\n');
  const sectionDetails = area.sections.map((section) => {
    const insights = buildSectionInsights(area, section, form, screenshots);
    return `### ${section}\n${bulletList(insights)}`;
  }).join('\n\n');
  const implementationSummary = bulletList(buildImplementationSummary(form, area, screenshots));
  const projectContext = bulletList(buildContextDrivenItems(form, area, screenshots));
  const revisionHistory = `| Version | Date | Author/Owner | Change Summary |\n| --- | --- | --- | --- |\n${buildRevisionRows(form).map((row) => `| ${row.map((cell) => safeLine(cell) || 'TBD').join(' | ')} |`).join('\n')}`;
  const processFlow = buildProcessFlowContent(form, area, screenshots);
  const mappingSheet = bulletList(buildMappingSheetItems(form, area));
  const unitTesting = bulletList(buildUnitTestingPlan(area, form));
  const integrationTesting = bulletList(buildIntegrationTestingPlan(area, form, screenshots));
  const regressionTesting = bulletList(buildRegressionTestingPlan(area, form));
  const deploymentPlan = bulletList(buildDeploymentPlan(area, form));
  const monitoringSupport = bulletList(buildMonitoringSupportPlan(area, form, screenshots));
  const areaRisks = bulletList(buildAreaRiskControls(area, form));
  const codeSections = safeLine(evidenceProfile.codeSnippet)
    ? [
      ['Code Understanding', buildCodeUnderstanding(form, area, screenshots)],
      ['Code Snippet', `\`\`\`\n${evidenceProfile.codeSnippet}\n\`\`\``]
    ]
    : [];
  const screenshotSections = screenshots.length
    ? [
      ['Screenshot Evidence', screenshots.map((shot, index) => `- Figure ${index + 1}: ${safeLine(shot.caption) || shot.name} (${shot.screenType})${shot.note ? ` - ${safeLine(shot.note)}` : ''}`).join('\n')],
      ['Screenshot Review And Technical Interpretation', screenshots.map((shot, index) => buildScreenshotUnderstanding(shot, area, index)).join('\n\n')]
    ]
    : [];
  const approval = `${bulletList(buildApprovalHandoverPlan(area))}\n\n| Field | Detail |\n| --- | --- |\n${buildApprovalRows().map(([field, value]) => `| ${field} | ${value} |`).join('\n')}`;
  const commonStart = [
    ['Purpose', evidenceProfile.overview || `This document is created to capture the technical specification for ${evidenceProfile.title} using the supplied ${describeEvidenceSource(evidenceProfile.sourceMode).toLowerCase()}.`],
    ['Generated Implementation Summary', implementationSummary],
    ['Revision History', revisionHistory],
    ['Process Flow', processFlow],
    ['Business Process', evidenceProfile.businessProcess],
    ['Project Context', projectContext],
    ['Template Alignment', buildTemplateAlignmentContent(form, area)],
    ...(area.id === 'sap-integration' ? [['Mapping Sheet', mappingSheet]] : []),
    ['Document Type Focus', bulletList(buildFormatFocusItems(form, area))]
  ];

  if (form.format === 'functional') {
    return [
      ...commonStart,
      ['Functional Scope And Requirements', areaPrompts],
      ['Business Rules And User Experience', bulletList([
        evidenceProfile.businessProcess ? `Business journey: ${evidenceProfile.businessProcess}` : '',
        'Document actors, trigger events, decision points, approvals, exceptions, and expected business outcomes.',
        'Confirm value help, validation messages, mandatory fields, and acceptance criteria with business users.'
      ])],
      ...screenshotSections,
      ['UAT And Acceptance Criteria', `${integrationTesting}\n${regressionTesting}`],
      ['Risks, Assumptions, And Open Items', areaRisks],
      ['Approval And Handover', approval]
    ];
  }

  if (form.format === 'runbook') {
    return [
      ...commonStart,
      ['Component And Ownership Summary', areaPrompts],
      ['Monitoring And Alerting', monitoringSupport],
      ['Troubleshooting And Diagnostics', bulletList([
        'Use captured message IDs, application logs, run history, browser console/network traces, or SAP transaction logs to locate failures.',
        evidenceProfile.testingNotes ? `Known validation evidence: ${evidenceProfile.testingNotes}` : '',
        'Record first-response checks, common failure symptoms, and the team responsible for each recovery step.'
      ])],
      ['Recovery And Reprocessing', bulletList([
        'Define retry/reprocess path, rollback option, correction owner, and business communication steps.',
        'Confirm what support can safely re-run and what requires developer/project approval.'
      ])],
      ...screenshotSections,
      ['Risks, Assumptions, And Open Items', areaRisks],
      ['Approval And Handover', approval]
    ];
  }

  if (form.format === 'handover') {
    return [
      ...commonStart,
      ['Delivered Scope', implementationSummary],
      ['Technical And Configuration Handover', `${sectionDetails}\n\n### Configuration Notes\n${evidenceProfile.configNotes || 'Document configuration, destinations, roles, communication arrangements, feature flags, and environment-specific values.'}`],
      ...codeSections,
      ...screenshotSections,
      ['Testing Evidence Summary', `${unitTesting}\n${integrationTesting}\n${regressionTesting}`],
      ['Deployment, Monitoring, And Support Ownership', `${deploymentPlan}\n${monitoringSupport}`],
      ['Risks, Assumptions, And Open Items', areaRisks],
      ['Approval And Handover', approval]
    ];
  }

  return [
    ...commonStart,
    ['Solution Area Checklist', areaPrompts],
    ['Technical Design', sectionDetails],
    ['Configuration Notes', evidenceProfile.configNotes],
    ...codeSections,
    ...screenshotSections,
    ['Unit Testing', unitTesting],
    ['Integration Testing', integrationTesting],
    ['Regression Testing And UAT', regressionTesting],
    ['Deployment And Transport', deploymentPlan],
    ['Monitoring And Support', monitoringSupport],
    ['Risks, Assumptions, And Open Items', areaRisks],
    ['Approval And Handover', approval]
  ];
}

function buildDocumentation(form, area, screenshots) {
  const selectedFormat = docFormats.find((format) => format.id === form.format) ?? docFormats[1];
  const evidenceProfile = getEvidenceProfile(form, area, screenshots);
  const mappingSheetRow = area.id === 'sap-integration'
    ? `| Mapping sheet reference | ${safeLine(form.mappingSheetReference) || 'TBD - provide Excel/SharePoint/Google Drive link'} |\n`
    : '';
  const sections = buildFormatSpecificSections(form, area, screenshots)
    .filter(([, content]) => safeLine(content));

  const body = sections
    .map(([title, content], index) => `## ${index + 1}. ${title}\n${content}`)
    .join('\n\n');

  return `${buildBrandingMarkdown(form)}\n\n# ${evidenceProfile.title || 'Technical Documentation'}\n\n` +
    `| Field | Detail |\n| --- | --- |\n| Document type | ${selectedFormat.name} |\n| Solution area | ${area.name} |\n| Document version | ${safeLine(form.documentVersion) || '0.1 Draft'} |\n| Owner | ${evidenceProfile.owner || 'TBD'} |\n| Systems | ${evidenceProfile.system || 'TBD'} |\n| Evidence source | ${describeEvidenceSource(evidenceProfile.sourceMode)} |\n${evidenceProfile.codeFileName ? `| Code file | ${evidenceProfile.codeFileName} |\n` : ''}${mappingSheetRow}| Generated | ${new Date().toLocaleString()} |\n\n` +
    `${body}\n`;
}

function formatInlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function tableMarkdownToHtml(lines) {
  const rows = lines
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) => line.split('|').slice(1, -1).map((cell) => formatInlineMarkdown(cell.trim())));

  if (!rows.length) return '';

  return `<table><tbody>${rows.map((row, index) => (
    `<tr>${row.map((cell) => (index === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`)).join('')}</tr>`
  )).join('')}</tbody></table>`;
}

function markdownToConfluenceHtml(markdown, flowDiagramSvg = '') {
  const lines = String(markdown || '').split('\n');
  const html = [];
  let paragraph = [];
  let listType = '';
  let listItems = [];
  let tableLines = [];
  let codeLines = [];
  let inCode = false;
  let codeLanguage = '';

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${formatInlineMarkdown(paragraph.join(' '))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listItems.length) return;
    html.push(`<${listType}>${listItems.map((item) => `<li>${formatInlineMarkdown(item)}</li>`).join('')}</${listType}>`);
    listType = '';
    listItems = [];
  };

  const flushTable = () => {
    if (!tableLines.length) return;
    html.push(tableMarkdownToHtml(tableLines));
    tableLines = [];
  };

  const flushOpenBlocks = () => {
    flushParagraph();
    flushList();
    flushTable();
  };

  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      if (inCode) {
        const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
        if (codeLanguage === 'mermaid' && flowDiagramSvg) {
          html.push(`<div class="technical-flow-diagram">${flowDiagramSvg}</div>`);
        } else {
          html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        }
        codeLines = [];
        inCode = false;
        codeLanguage = '';
      } else {
        flushOpenBlocks();
        inCode = true;
        codeLanguage = line.trim().replace(/^```/, '').trim().replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (/^\|.+\|$/.test(line.trim())) {
      flushParagraph();
      flushList();
      tableLines.push(line.trim());
      return;
    }

    flushTable();

    if (!line.trim()) {
      flushParagraph();
      flushList();
      return;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flushOpenBlocks();
      const level = Math.min(heading[1].length, 4);
      html.push(`<h${level}>${formatInlineMarkdown(heading[2].replace(/^\d+\.\s+/, ''))}</h${level}>`);
      return;
    }

    const unordered = line.match(/^\s*-\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(unordered[1]);
      return;
    }

    const ordered = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(ordered[1]);
      return;
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      flushOpenBlocks();
      html.push(`<p><em>Image reference: ${formatInlineMarkdown(image[1] || image[2])}</em></p>`);
      return;
    }

    paragraph.push(line.trim());
  });

  if (inCode) {
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    if (codeLanguage === 'mermaid' && flowDiagramSvg) {
      html.push(`<div class="technical-flow-diagram">${flowDiagramSvg}</div>`);
    } else {
      html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    }
  }
  flushOpenBlocks();

  return `<div>${html.join('\n')}</div>`;
}

function hasAreaSelection(form) {
  return capabilityAreas.some((area) => area.id === form.areaId);
}

function hasEvidenceInput(form, screenshots) {
  return Boolean(safeLine(form.codeSnippet) || safeLine(form.codeFileName) || screenshots.length);
}

function buildBlockedPreview(form, area, screenshots) {
  if (!hasAreaSelection(form)) {
    return [
      '# Choose Solution Area First',
      '',
      'Select the solution area for the document before uploading screenshots, pasting code, previewing, copying, or exporting.',
      '',
      'After the area is selected, provide code, screenshots, or both when both implementation detail and visual proof are needed.'
    ].join('\n');
  }

  if (!hasEvidenceInput(form, screenshots)) {
    return [
      `# ${area.name} Documentation Intake`,
      '',
      'Provide either a code snippet/file or screenshot evidence to generate the document.',
      '',
      'The app will derive the document name, process flow, technical design, testing focus, monitoring notes, and solution-area sections from the supplied evidence.'
    ].join('\n');
  }

  return '';
}

function buildReadinessGaps(form, area, screenshots) {
  const gaps = [];
  if (!hasAreaSelection(form)) gaps.push('Solution area must be selected before evidence is added.');
  if (!hasEvidenceInput(form, screenshots)) gaps.push('Provide code, screenshot evidence, or both when both implementation detail and visual proof are needed.');
  if (screenshots.length && !screenshots.some((shot) => safeLine(shot.extractedText) || safeLine(shot.note))) {
    gaps.push('Screenshot evidence should have extracted text or reviewer notes so the app can derive real sections.');
  }
  if (hasAreaSelection(form) && hasEvidenceInput(form, screenshots) && !getEvidenceTitleFromInputs(form, area, screenshots)) {
    gaps.push('Document name could not be confidently derived from evidence; add file name, object name, iFlow name, screenshot caption, or visible text.');
  }
  if (area.id === 'sap-integration' && hasEvidenceInput(form, screenshots) && !safeLine(form.mappingSheetReference)) {
    gaps.push('SAP Integration/CPI specs should include a mapping sheet file name, SharePoint link, Google Drive link, or repository reference before final handover.');
  }
  if (area.id === 'sap-integration' && screenshots.length) {
    const iflowFacts = extractIntegrationFlowFacts(form, screenshots);
    if (!iflowFacts.hasEvidence && screenshots.some((shot) => /iflow|integration/i.test(`${shot.screenType} ${shot.caption} ${shot.name}`))) {
      gaps.push('CPI/iFlow screenshot needs OCR text or notes containing visible step labels, adapters, systems, or iFlow name.');
    }
  }
  return gaps;
}

function App() {
  const savedWorkspace = loadSavedWorkspace();
  const [form, setForm] = useState(savedWorkspace?.form ?? initialForm);
  const [screenshots, setScreenshots] = useState([]);
  const [activeTab, setActiveTab] = useState('compose');
  const [toast, setToast] = useState('');
  const [lastAction, setLastAction] = useState('');
  const [ocrActiveId, setOcrActiveId] = useState('');
  const [ocrStatus, setOcrStatus] = useState('');
  const [jiraIssueKey, setJiraIssueKey] = useState('');
  const [contextImportStatus, setContextImportStatus] = useState('');

  const selectedArea = capabilityAreas.find((area) => area.id === form.areaId) || null;
  const displayArea = selectedArea ?? capabilityAreas[0];
  const areaReady = Boolean(selectedArea);
  const evidenceReady = hasEvidenceInput(form, screenshots);
  const generatedDoc = useMemo(
    () => {
      const blocked = buildBlockedPreview(form, displayArea, screenshots);
      return blocked || buildDocumentation(form, displayArea, screenshots);
    },
    [form, displayArea, screenshots]
  );
  const previewTechnicalDiagramSteps = useMemo(
    () => (areaReady && evidenceReady ? buildTechnicalDiagramSteps(form, displayArea, screenshots) : []),
    [areaReady, evidenceReady, form, displayArea, screenshots]
  );
  const previewFlowDiagramSvg = useMemo(
    () => buildFlowDiagramSvg(previewTechnicalDiagramSteps),
    [previewTechnicalDiagramSteps]
  );
  const derivedDocumentTitle = areaReady && evidenceReady ? deriveDocumentTitle(form, displayArea, screenshots) : '';
  const derivedBusinessProcess = areaReady && evidenceReady ? deriveBusinessProcessText(form, displayArea, screenshots) : '';
  const readinessGaps = buildReadinessGaps(form, displayArea, screenshots);
  const evidenceMode = safeLine(form.codeSnippet) || safeLine(form.codeFileName)
    ? screenshots.length ? 'Code and screenshot evidence' : 'Code evidence'
    : screenshots.length
      ? 'Screenshot evidence'
      : 'No evidence yet';

  const stats = useMemo(() => {
    const words = generatedDoc.split(/\s+/).filter(Boolean).length;
    const trackedFields = ['title', 'owner', 'system', 'documentVersion', 'overview', 'businessProcess', 'codeSnippet', 'testingNotes', 'revisionSummary', 'jiraContext', 'designContext', 'architectureContext', 'decisionContext', 'apiContext'];
    if (selectedArea?.id === 'sap-integration') trackedFields.push('mappingSheetReference');
    const completedFields = trackedFields
      .filter((field) => safeLine(form[field])).length;
    return {
      words,
      screenshots: screenshots.length,
      completedFields,
      trackedFields: trackedFields.length,
      sections: (generatedDoc.match(/^##\s+\d+\./gm) || []).length
    };
  }, [form, generatedDoc, screenshots.length, selectedArea?.id]);

  useEffect(() => {
    window.localStorage.setItem('techdoc-studio-workspace', JSON.stringify({ form }));
  }, [form]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  function ensureAreaSelected(action = 'continue') {
    if (areaReady) return true;
    setActiveTab('compose');
    setLastAction(`Choose the solution area first, then ${action}.`);
    showToast('Choose solution area first');
    return false;
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function importJiraContext() {
    if (!ensureAreaSelected('import Jira context')) return;
    const issueKey = safeLine(jiraIssueKey).toUpperCase();
    if (!/^[A-Z][A-Z0-9]+-\d+$/.test(issueKey)) {
      setContextImportStatus('Enter a valid Jira issue key, for example ABC-123.');
      showToast('Enter Jira issue key');
      return;
    }

    setContextImportStatus(`Importing ${issueKey} from Jira...`);
    try {
      const response = await fetch(`${contextApiBase}/api/jira/issue/${encodeURIComponent(issueKey)}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || `Jira import failed with ${response.status}`);
      }

      setForm((current) => ({
        ...current,
        jiraContext: [current.jiraContext, payload.jiraContext].map(safeLine).filter(Boolean).join('\n\n'),
        designContext: [current.designContext, payload.designContext].map(safeLine).filter(Boolean).join('\n\n'),
        decisionContext: [current.decisionContext, payload.decisionContext].map(safeLine).filter(Boolean).join('\n\n'),
        apiContext: [current.apiContext, payload.apiContext].map(safeLine).filter(Boolean).join('\n\n')
      }));
      setContextImportStatus(`Imported ${issueKey}: ${payload.summary || 'Jira context loaded'}.`);
      showToast('Jira context imported');
    } catch (error) {
      const message = error?.message || 'Could not import Jira context';
      setContextImportStatus(`${message}. Start the local context server with npm run dev:server and check server/.env.`);
      showToast('Jira import failed');
    }
  }

  function selectArea(areaId) {
    setForm((current) => ({
      ...current,
      areaId,
      ...(current.areaId === areaId
        ? {}
        : {
          title: '',
          businessProcess: '',
          codeSnippet: '',
          codeFileName: '',
          codeFileType: '',
          mappingSheetReference: '',
          jiraContext: '',
          designContext: '',
          architectureContext: '',
          decisionContext: '',
          apiContext: ''
        })
    }));
    if (form.areaId !== areaId) setScreenshots([]);
    setLastAction('');
    showToast('Solution area selected; add code or screenshot evidence');
  }

  function handleCodeSnippetChange(value) {
    if (!ensureAreaSelected('paste or attach evidence')) return;
    setForm((current) => ({
      ...current,
      codeSnippet: value,
      codeFileName: safeLine(value) ? current.codeFileName : '',
      codeFileType: safeLine(value) ? (current.codeFileType || 'Code snippet') : ''
    }));
  }

  function setTemplateMode(mode) {
    if (!ensureAreaSelected('choose the template source')) return;
    setForm((current) => ({ ...current, templateMode: mode }));
    showToast(mode === 'upload' ? 'Use my template selected' : 'Automatic template selected');
  }

  async function handleScreenshotUpload(event) {
    if (!ensureAreaSelected('add screenshot evidence')) {
      event.target.value = '';
      return;
    }
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) {
      showToast('Choose screenshot image files');
      return;
    }

    try {
      const records = await Promise.all(
        imageFiles.map(async (file) => createScreenshotRecord(file, await readFileAsDataUrl(file)))
      );
      const typedRecords = records.map((record) => ({
        ...record,
        screenType: displayArea.id === 'sap-integration' ? 'SAP Integration Suite iFlow design' : record.screenType
      }));
      setScreenshots((current) => [...current, ...typedRecords]);
      setForm((current) => ({
        ...current,
        title: '',
        businessProcess: '',
        codeFileName: current.codeFileName,
        codeFileType: current.codeFileType
      }));
      showToast(`${imageFiles.length} screenshot${imageFiles.length === 1 ? '' : 's'} added`);
    } catch {
      showToast('Could not load screenshot image');
    } finally {
      event.target.value = '';
    }
  }

  async function handleCustomerLogoUpload(event) {
    if (!ensureAreaSelected('add document branding')) {
      event.target.value = '';
      return;
    }
    const [file] = Array.from(event.target.files || []);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Choose a customer logo image');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setForm((current) => ({
        ...current,
        customerLogoName: file.name,
        customerLogoType: file.type || 'Image',
        customerLogoDataUrl: dataUrl
      }));
      showToast('Customer logo added');
    } catch {
      showToast('Could not load customer logo');
    } finally {
      event.target.value = '';
    }
  }

  function removeCustomerLogo() {
    setForm((current) => ({
      ...current,
      customerLogoName: '',
      customerLogoType: '',
      customerLogoDataUrl: ''
    }));
    showToast('Customer logo removed');
  }

  function updateScreenshot(id, field, value) {
    setScreenshots((current) =>
      current.map((shot) => (shot.id === id ? { ...shot, [field]: value } : shot))
    );
  }

  async function extractScreenshotText(id) {
    if (!ensureAreaSelected('extract screenshot text')) return;
    const shot = screenshots.find((item) => item.id === id);
    if (!shot?.dataUrl) {
      showToast('No image available for OCR');
      return;
    }

    setOcrActiveId(id);
    setOcrStatus('Preparing OCR');

    let worker;
    try {
      const language = safeLine(form.ocrLanguage) || 'eng';
      worker = await createWorker(language, 1, {
        logger: (message) => {
          if (!message?.status) return;
          const progress = typeof message.progress === 'number' ? ` ${Math.round(message.progress * 100)}%` : '';
          setOcrStatus(`${message.status}${progress}`);
        }
      });
      await worker.setParameters({ preserve_interword_spaces: '1' });

      setOcrStatus('Enhancing screenshot for OCR');
      const imageForOcr = await preprocessImageForOcr(shot.dataUrl);
      const result = await worker.recognize(imageForOcr);
      const text = cleanOcrText(result?.data?.text);

      if (!text) {
        setLastAction('OCR finished but did not find readable text. Try a sharper screenshot or paste the visible text manually.');
        showToast('No readable text found');
        return;
      }

      setScreenshots((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          return {
            ...item,
            extractedText: item.extractedText ? `${item.extractedText}\n\n${text}` : text,
            note: item.note || `OCR extracted visible text from ${item.name}. Review and correct the text before final export.`
          };
        })
      );
      if (displayArea.id === 'sap-integration') {
        const enrichedShot = {
          ...shot,
          extractedText: shot.extractedText ? `${shot.extractedText}\n\n${text}` : text,
          screenType: shot.screenType || 'SAP Integration Suite iFlow design'
        };
        const iflowFacts = extractIntegrationFlowFacts(form, [enrichedShot]);
        if (iflowFacts.hasEvidence) {
          setForm((current) => ({
            ...current,
            title: iflowFacts.iflowName ? '' : current.title,
            system: [iflowFacts.sourceSystem, iflowFacts.targetSystem].filter(Boolean).join(', ') || current.system,
            businessProcess: iflowFacts.processSteps.length ? '' : current.businessProcess
          }));
        }
      }
      const languageName = ocrLanguages.find((item) => item.id === language)?.name || language;
      setLastAction(`OCR extracted ${text.length.toLocaleString()} characters from ${shot.name} using ${languageName}. Review the visible text field, then click Review image or Download Word.`);
      showToast('OCR text extracted');
    } catch (error) {
      setLastAction(`OCR could not read ${shot.name}. Use a sharper image or paste visible text manually. ${error?.message || ''}`.trim());
      showToast('OCR failed');
    } finally {
      try {
        if (worker) await worker.terminate();
      } catch {
        // OCR cleanup should not keep the user stuck in the loading state.
      }
      setOcrActiveId('');
      setOcrStatus('');
    }
  }

  function applyScreenshotReview(id) {
    if (!ensureAreaSelected('review the screenshot')) return;
    setScreenshots((current) =>
      current.map((shot, index) => {
        if (shot.id !== id) return shot;
        const review = buildScreenshotUnderstanding(shot, displayArea, index)
          .split('\n')
          .slice(1)
          .join('\n')
          .replace(/^- /gm, '');
        return { ...shot, note: shot.note || review };
      })
    );
    showToast('Screenshot review added to notes');
  }

  function removeScreenshot(id) {
    setScreenshots((current) => {
      return current.filter((shot) => shot.id !== id);
    });
    showToast('Screenshot removed');
  }

  async function copyDocumentation() {
    if (!ensureAreaSelected('copy or export the document')) return;
    if (!evidenceReady) {
      setActiveTab('compose');
      setLastAction('Provide either a code snippet/file or screenshot evidence before copying the document.');
      showToast('Add code or screenshot first');
      return;
    }
    const textToCopy = generatedDoc || buildDocumentation(form, displayArea, screenshots);
    setActiveTab('preview');

    try {
      await navigator.clipboard.writeText(textToCopy);
      setLastAction(`Copied ${textToCopy.length.toLocaleString()} characters of generated specification text to the clipboard.`);
      showToast('Document text copied');
    } catch {
      setLastAction('Clipboard access was blocked. The generated specification is visible in Preview so you can select and copy it manually.');
      showToast('Clipboard blocked; use Preview');
    }
  }

  async function copyConfluenceDocumentation() {
    if (!ensureAreaSelected('copy or export the document')) return;
    if (!evidenceReady) {
      setActiveTab('compose');
      setLastAction('Provide either a code snippet/file or screenshot evidence before copying for Confluence.');
      showToast('Add code or screenshot first');
      return;
    }
    const textToCopy = generatedDoc || buildDocumentation(form, displayArea, screenshots);
    const htmlToCopy = markdownToConfluenceHtml(textToCopy, previewFlowDiagramSvg);
    setActiveTab('preview');

    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlToCopy], { type: 'text/html' }),
            'text/plain': new Blob([textToCopy], { type: 'text/plain' })
          })
        ]);
      } else {
        await navigator.clipboard.writeText(textToCopy);
      }

      setLastAction('Copied a Confluence-friendly version to the clipboard. Paste it into a Confluence page, then attach the Word export for audit/reference if required.');
      showToast('Confluence copy ready');
    } catch {
      try {
        await navigator.clipboard.writeText(textToCopy);
        setLastAction('Rich Confluence copy was blocked, so the plain generated text was copied instead. Paste into Confluence and adjust table formatting if needed.');
        showToast('Plain text copied');
      } catch {
        setLastAction('Clipboard access was blocked. The generated specification is visible in Preview so you can select and copy it into Confluence manually.');
        showToast('Clipboard blocked; use Preview');
      }
    }
  }

  async function handleCodeFileUpload(event) {
    if (!ensureAreaSelected('attach code evidence')) {
      event.target.value = '';
      return;
    }
    const [file] = Array.from(event.target.files || []);
    if (!file) return;

    try {
      const text = await file.text();
      setForm((current) => ({
        ...current,
        title: '',
        businessProcess: '',
        codeSnippet: text,
        codeFileName: file.name,
        codeFileType: file.type || file.name.split('.').pop()?.toUpperCase() || 'Code'
      }));
      showToast(`Code loaded from ${file.name}`);
    } catch {
      showToast('Could not read code file');
    } finally {
      event.target.value = '';
    }
  }

  async function handleTemplateUpload(event) {
    if (!ensureAreaSelected('upload a template')) {
      event.target.value = '';
      return;
    }
    const [file] = Array.from(event.target.files || []);
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const templateType = extension ? extension.toUpperCase() : file.type || 'Template';
    setForm((current) => ({
      ...current,
      templateMode: 'upload',
      templateName: file.name,
      templateType
    }));

    try {
      const readableText = await extractTemplateText(file, extension);

      if (readableText.length > 120) {
        updateForm('templateOutline', readableText);
        showToast(`${templateType} template text loaded`);
      } else {
        const message = extension === 'doc'
          ? 'Legacy DOC uploaded. Paste headings because browser parsing is limited.'
          : 'Template uploaded. Paste key headings if needed.';
        updateForm('templateOutline', `${templateType} template uploaded from ${file.name}. No readable section text was extracted in the browser. Paste headings, mandatory tables, approval fields, or style rules here for stronger alignment.`);
        showToast(message);
      }
    } catch {
      updateForm('templateOutline', `${templateType} template uploaded from ${file.name}. The browser could not extract readable text. Paste headings, mandatory tables, approval fields, or style rules here for stronger alignment.`);
      showToast('Template uploaded. Paste key headings if needed.');
    } finally {
      event.target.value = '';
    }
  }

  async function exportWord() {
    if (!ensureAreaSelected('download the Word document')) return;
    if (!evidenceReady) {
      setActiveTab('compose');
      setLastAction('Provide either a code snippet/file or screenshot evidence before downloading Word.');
      showToast('Add code or screenshot first');
      return;
    }
    const filename = buildTechSpecFilename(deriveDocumentTitle(form, displayArea, screenshots), form.documentVersion);
    const brandLogoAsset = await createBrandLogoAsset();
    const flowDiagramAsset = await createFlowDiagramAsset(buildTechnicalDiagramSteps(form, displayArea, screenshots));
    const wordDocument = buildDocxDocument(form, displayArea, screenshots, brandLogoAsset, flowDiagramAsset);
    const wordBlob = await Packer.toBlob(wordDocument);
    setActiveTab('preview');

    if (!wordBlob || wordBlob.size < 500) {
      setLastAction('Word export did not have enough content to save. Add a title, code snippet, screenshot notes, or process details and try again.');
      showToast('Nothing to export yet');
      return;
    }

    try {
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Word document',
              accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(wordBlob);
        await writable.close();
        setLastAction(`Saved ${filename}. Open it in Microsoft Word or upload it to Google Drive to view the generated technical specification with embedded logos.`);
        showToast('Word document saved');
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        showToast('Save cancelled');
        return;
      }
    }

    try {
      const url = URL.createObjectURL(wordBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
      }, 1000);
      setLastAction(`Started download for ${filename}. This is a real .docx file with embedded ${brandName} and customer logos. If the in-app browser blocks it, open this app in Chrome or Edge and click Download Word again.`);
      showToast('Word download started');
    } catch {
      await copyDocumentation();
      setLastAction('Download was blocked by the browser. The generated specification text was copied or shown in Preview as a fallback.');
      showToast('Download blocked, copied document text instead');
    }
  }

  function resetWorkspace() {
    setScreenshots([]);
    setForm(initialForm);
    setActiveTab('compose');
    showToast('Workspace reset');
  }

  return (
    <main className="app-shell">
      <section className="hero-band">
        <div className="hero-content">
          <span className="eyebrow">TechDoc Studio</span>
          <h1>SAP and cloud delivery documentation from screenshots, notes, and code.</h1>
          <p>
            Capture implementation evidence, select the solution area, paste code, and generate a
            structured Word document for project handover, support, and audits.
          </p>
        </div>

      </section>

      <section className="signal-strip">
        <div><strong>{stats.words}</strong><span>Words</span></div>
        <div><strong>{stats.screenshots}</strong><span>Screenshots</span></div>
        <div><strong>{stats.completedFields}/{stats.trackedFields}</strong><span>Inputs filled</span></div>
        <div><strong>{stats.sections}</strong><span>Doc sections</span></div>
      </section>

      <section className="workspace-grid">
        <aside className="side-panel">
          <div className="panel-heading">
            <span className="step">1</span>
            <div>
              <h2>Solution Area</h2>
              <p>Choose the closest delivery stream.</p>
            </div>
          </div>

          <div className="area-list" role="list">
            {capabilityAreas.map((area) => (
              <button
                type="button"
                key={area.id}
                className={`area-tile ${area.id === form.areaId ? 'selected' : ''}`}
                onClick={() => selectArea(area.id)}
              >
                <span>{area.name}</span>
                <small>{area.tag}</small>
              </button>
            ))}
          </div>

          <label className="format-picker">
            Document format
            <select value={form.format} onChange={(event) => updateForm('format', event.target.value)} disabled={!areaReady}>
              {docFormats.map((format) => (
                <option key={format.id} value={format.id}>{format.name}</option>
              ))}
            </select>
            <small>{docFormats.find((format) => format.id === form.format)?.description}</small>
          </label>

          <div className="area-sections">
            <strong>Core document headers</strong>
            <ul>
              {['Purpose', 'Implementation Summary', 'Process Flow', 'Business Process', 'Template Alignment', 'Technical Design'].map((header) => (
                <li key={header}>{header}</li>
              ))}
              <li>Testing, deployment, monitoring, risks, and handover when supported by inputs</li>
              <li>Code and screenshot sections only when artifacts are supplied</li>
            </ul>
          </div>

          <div className="area-sections">
            <strong>Readiness checks</strong>
            <ul>
              {readinessGaps.length ? readinessGaps.map((gap) => (
                <li key={gap}>{gap}</li>
              )) : <li>Ready to preview, copy, export Word, or copy for Confluence.</li>}
            </ul>
          </div>

          <div className="area-sections">
            <strong>{displayArea.name} sections</strong>
            <ul>
              {displayArea.sections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </div>

          <div className="area-sections">
            <strong>Testing focus</strong>
            <ul>
              {areaReady ? [...buildUnitTestingPlan(displayArea, form), ...buildIntegrationTestingPlan(displayArea, form, screenshots)].slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              )) : <li>Choose a solution area to load the testing focus.</li>}
            </ul>
          </div>
        </aside>

        <section className="main-panel">
          <div className="topbar">
            <div className="panel-heading">
              <span className="step">2</span>
              <div>
                <h2>Build Documentation</h2>
                <p>Add context, screenshots, and snippets. Preview updates instantly.</p>
              </div>
            </div>

            <div className="segmented" aria-label="Workspace tabs">
              <button
                type="button"
                className={activeTab === 'compose' ? 'active' : ''}
                onClick={() => setActiveTab('compose')}
              >
                Compose
              </button>
              <button
                type="button"
                className={activeTab === 'preview' ? 'active' : ''}
                onClick={() => setActiveTab('preview')}
              >
                Preview
              </button>
            </div>
          </div>

          {!areaReady ? (
            <div className="validation-banner" role="status">
              <strong>Choose solution area first</strong>
              <span>Select ABAP, CPI, Fiori, CAP, Azure, Commerce, or another area before adding evidence or generating a document.</span>
            </div>
          ) : !evidenceReady ? (
            <div className="validation-banner" role="status">
              <strong>Add evidence</strong>
              <span>Provide code, screenshots, or both. Code gives implementation detail; screenshots provide visual proof for the generated spec.</span>
            </div>
          ) : (
            <div className="evidence-banner" role="status">
              <strong>{evidenceMode}</strong>
              <span>Document name, process flow, technical sections, and testing focus are being derived from the active evidence.</span>
            </div>
          )}

          {activeTab === 'compose' ? (
            <div className="compose-grid">
              <section className="input-section">
                <h3>Generated Core Details</h3>
                <div className="field-grid">
                  <label>
                    Derived document name
                    <input value={derivedDocumentTitle || 'Will be derived after area and evidence are provided'} readOnly />
                  </label>
                  <label>
                    Owner/team
                    <input value={form.owner} onChange={(event) => updateForm('owner', event.target.value)} disabled={!areaReady} placeholder="Optional delivery owner/team" />
                  </label>
                  <label>
                    Document version
                    <input value={form.documentVersion} onChange={(event) => updateForm('documentVersion', event.target.value)} disabled={!areaReady} />
                  </label>
                  <label className="wide-field">
                    Systems and landscape
                    <input value={form.system} onChange={(event) => updateForm('system', event.target.value)} disabled={!areaReady} placeholder="Optional if not visible in evidence" />
                  </label>
                  <label className="wide-field">
                    Revision summary
                    <input value={form.revisionSummary} onChange={(event) => updateForm('revisionSummary', event.target.value)} disabled={!areaReady} placeholder="Optional version note" />
                  </label>
                  <label className="wide-field">
                    Derived business process
                    <textarea rows={4} value={derivedBusinessProcess || 'Will be derived from the uploaded screenshot or code snippet.'} readOnly />
                  </label>
                </div>
              </section>

              <section className="input-section">
                <div className="section-row">
                  <div>
                    <h3>Document Branding</h3>
                    <p className="helper-copy">{brandName} branding is included automatically. Add a customer logo if required.</p>
                  </div>
                  <label className="upload-button">
                    Upload customer logo
                    <input type="file" accept="image/*" onChange={handleCustomerLogoUpload} disabled={!areaReady} />
                  </label>
                </div>
                <div className="brand-preview">
                  <div className="brand-logo-preview">
                    <img src={brandLogoDataUrl} alt={`${brandName} logo`} />
                    <span>Included automatically in every generated document</span>
                  </div>
                  <div className={`customer-preview ${form.customerLogoDataUrl ? '' : 'empty'}`}>
                    {form.customerLogoDataUrl ? (
                      <>
                        <img src={form.customerLogoDataUrl} alt={form.customerLogoName || 'Customer logo'} />
                        <div>
                          <strong>{form.customerLogoName}</strong>
                          <span>{form.customerLogoType || 'Customer logo'}</span>
                        </div>
                        <button type="button" className="ghost-button" onClick={removeCustomerLogo}>Remove</button>
                      </>
                    ) : (
                      <span>Customer logo optional</span>
                    )}
                  </div>
                </div>
              </section>

              <section className="input-section">
                <div className="section-row">
                  <div>
                    <h3>Template Source</h3>
                    <p className="helper-copy">Do you want to use your template, or should the app create one automatically?</p>
                  </div>
                </div>

                <div className="template-choice-grid" role="group" aria-label="Template source">
                  <button
                    type="button"
                    className={`template-choice ${getTemplateMode(form) === 'auto' ? 'selected' : ''}`}
                    onClick={() => setTemplateMode('auto')}
                    disabled={!areaReady}
                  >
                    <strong>Create automatically</strong>
                    <span>Generate a standard tech-spec template from the selected area, code snippet, screenshots, and process notes.</span>
                  </button>
                  <button
                    type="button"
                    className={`template-choice ${getTemplateMode(form) === 'upload' ? 'selected' : ''}`}
                    onClick={() => setTemplateMode('upload')}
                    disabled={!areaReady}
                  >
                    <strong>Use my template</strong>
                    <span>Upload a PDF/Word template and use its headings, required tables, and style rules.</span>
                  </button>
                </div>

                {getTemplateMode(form) === 'upload' ? (
                  <>
                    <div className="section-row">
                      <div className="template-summary">
                        <strong>{form.templateName || 'No template uploaded'}</strong>
                        <span>{form.templateType || 'PDF, DOC, or DOCX accepted'}</span>
                      </div>
                      <label className="upload-button">
                        Upload template
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleTemplateUpload}
                          disabled={!areaReady}
                        />
                      </label>
                    </div>
                    <label>
                      Template guidance
                      <textarea
                        rows={5}
                        value={form.templateOutline}
                        onChange={(event) => updateForm('templateOutline', event.target.value)}
                        disabled={!areaReady}
                        placeholder="Paste template headings, section order, style requirements, mandatory tables, approval fields, or acceptance criteria here."
                      />
                    </label>
                  </>
                ) : (
                  <div className="analysis-box">
                    <strong>Automatic template that will be used</strong>
                    <pre>{areaReady ? buildAutomaticTemplateOutline(form, displayArea) : 'Choose a solution area first. The app will then generate the right template sections for that area.'}</pre>
                  </div>
                )}
              </section>

              <section className="input-section">
                <h3>Optional Notes</h3>
                <label>
                  Purpose notes
                  <textarea rows={4} value={form.overview} onChange={(event) => updateForm('overview', event.target.value)} disabled={!areaReady} placeholder="Optional. The final purpose is generated from the document area and supplied evidence." />
                </label>
                <label>
                  Business/process notes
                  <textarea rows={5} value={form.businessProcess} onChange={(event) => updateForm('businessProcess', event.target.value)} disabled={!areaReady} placeholder="Optional. The app prioritizes process flow derived from the code snippet or screenshot." />
                </label>
                <label>
                  Configuration notes
                  <textarea rows={4} value={form.configNotes} onChange={(event) => updateForm('configNotes', event.target.value)} disabled={!areaReady} placeholder="Optional if not visible in evidence." />
                </label>
                {displayArea.id === 'sap-integration' ? (
                  <label>
                    Mapping sheet reference
                    <input
                      value={form.mappingSheetReference}
                      onChange={(event) => updateForm('mappingSheetReference', event.target.value)}
                      disabled={!areaReady}
                      placeholder="Excel file name, SharePoint link, Google Drive link, or repository URL for source-to-target mapping"
                    />
                  </label>
                ) : null}
              </section>

              <section className="input-section">
                <h3>Project Context</h3>
                <p className="helper-copy">Add project references so the generated spec can align code and screenshots with real delivery scope, design decisions, mappings, and acceptance criteria.</p>
                <div className="context-import-row">
                  <label>
                    Jira issue key
                    <input
                      value={jiraIssueKey}
                      onChange={(event) => setJiraIssueKey(event.target.value)}
                      disabled={!areaReady}
                      placeholder="ABC-123"
                    />
                  </label>
                  <button type="button" onClick={importJiraContext} disabled={!areaReady}>
                    Import from Jira
                  </button>
                </div>
                {contextImportStatus ? <p className="helper-copy">{contextImportStatus}</p> : null}
                <label>
                  Jira / work item context
                  <textarea rows={3} value={form.jiraContext} onChange={(event) => updateForm('jiraContext', event.target.value)} disabled={!areaReady} placeholder="Epic/story IDs, story summary, acceptance criteria, defect IDs, or release scope." />
                </label>
                <label>
                  Design / HLD context
                  <textarea rows={3} value={form.designContext} onChange={(event) => updateForm('designContext', event.target.value)} disabled={!areaReady} placeholder="Design document or HLD link, key design assumptions, dependencies, and target behavior." />
                </label>
                <label>
                  Architecture or diagram reference
                  <textarea rows={3} value={form.architectureContext} onChange={(event) => updateForm('architectureContext', event.target.value)} disabled={!areaReady} placeholder="Architecture diagram link, component/data flow, source/target systems, trust boundaries, or sequence notes." />
                </label>
                <label>
                  Meeting notes / decisions
                  <textarea rows={3} value={form.decisionContext} onChange={(event) => updateForm('decisionContext', event.target.value)} disabled={!areaReady} placeholder="Design decisions, open questions, agreed constraints, reviewer comments, or sign-off notes." />
                </label>
                <label>
                  Integration mapping / API details
                  <textarea rows={3} value={form.apiContext} onChange={(event) => updateForm('apiContext', event.target.value)} disabled={!areaReady} placeholder="API endpoint, payload contract, field mapping, mapping sheet link, OpenAPI/Swagger link, or source-to-target notes." />
                </label>
              </section>

              <section className="input-section">
                <div className="section-row">
                  <h3>Code Snippet</h3>
                  <label className="upload-button">
                    Attach code file
                    <input
                      type="file"
                      accept=".abap,.cds,.xml,.json,.js,.ts,.java,.groovy,.txt,.properties,.yaml,.yml"
                      onChange={handleCodeFileUpload}
                      disabled={!areaReady}
                    />
                  </label>
                </div>
                <textarea
                  className="code-input"
                  rows={12}
                  value={form.codeSnippet}
                  onChange={(event) => handleCodeSnippetChange(event.target.value)}
                  disabled={!areaReady}
                  placeholder={areaReady ? 'Paste code here. You can also add screenshots for visual proof and flow/context evidence.' : 'Choose a solution area before pasting code.'}
                  spellCheck="false"
                />
                <div className="analysis-box">
                  <strong>Code understanding</strong>
                  <ul>
                    {areaReady ? (displayArea.id === 'sap-commerce' ? buildCommerceCodeUnderstanding(form, screenshots) : detectCodeSignals(form.codeSnippet, displayArea)).map((signal) => (
                      <li key={signal}>{signal}</li>
                    )) : <li>Choose a solution area before adding code evidence.</li>}
                  </ul>
                </div>
              </section>

              <section className="input-section">
                <div className="section-row">
                  <div>
                    <h3>Screenshot Evidence</h3>
                    <p className="helper-copy">OCR is browser-based. Choose the closest language before extracting text.</p>
                  </div>
                  <label className="upload-button">
                    Add screenshots
                    <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} disabled={!areaReady} />
                  </label>
                </div>
                <label>
                  OCR language
                  <select value={form.ocrLanguage} onChange={(event) => updateForm('ocrLanguage', event.target.value)} disabled={!areaReady}>
                    {ocrLanguages.map((language) => (
                      <option key={language.id} value={language.id}>{language.name}</option>
                    ))}
                  </select>
                </label>

                <div className="screenshot-grid">
                  {screenshots.length ? screenshots.map((shot, index) => (
                    <article className="screenshot-card" key={shot.id}>
                      <img src={shot.url} alt={shot.caption || shot.name} />
                      <div className="screenshot-fields">
                        <span>Figure {index + 1} | {formatBytes(shot.size)}</span>
                        <select
                          value={shot.screenType}
                          onChange={(event) => updateScreenshot(shot.id, 'screenType', event.target.value)}
                          aria-label="Screenshot type"
                        >
                          {screenshotTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <input
                          value={shot.caption}
                          onChange={(event) => updateScreenshot(shot.id, 'caption', event.target.value)}
                          aria-label="Screenshot caption"
                        />
                        <textarea
                          rows={3}
                          value={shot.extractedText}
                          onChange={(event) => updateScreenshot(shot.id, 'extractedText', event.target.value)}
                          placeholder="Use Extract text or paste visible screenshot text, object names, errors, message IDs, or status values"
                        />
                        <textarea
                          rows={3}
                          value={shot.note}
                          onChange={(event) => updateScreenshot(shot.id, 'note', event.target.value)}
                          placeholder="Reviewer notes and technical interpretation"
                        />
                        <div className="card-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={ocrActiveId === shot.id}
                            onClick={() => extractScreenshotText(shot.id)}
                          >
                            {ocrActiveId === shot.id ? 'Reading text...' : 'Extract text'}
                          </button>
                          <button type="button" className="secondary-button" onClick={() => applyScreenshotReview(shot.id)}>
                            Review image
                          </button>
                          <button type="button" className="ghost-button" onClick={() => removeScreenshot(shot.id)}>
                            Remove
                          </button>
                        </div>
                        {ocrActiveId === shot.id && ocrStatus ? (
                          <span className="ocr-status">{ocrStatus}</span>
                        ) : null}
                      </div>
                    </article>
                  )) : (
                    <div className="empty-state">Upload SAP GUI, Fiori, BTP cockpit, Azure, HAC, Backoffice, iFlow, or code review screenshots. Use Extract text or add notes so the document can interpret what each image proves.</div>
                  )}
                </div>
              </section>

              <section className="input-section">
                <h3>Testing, Risks, And Handover</h3>
                <label>
                  Testing notes
                  <textarea rows={5} value={form.testingNotes} onChange={(event) => updateForm('testingNotes', event.target.value)} disabled={!areaReady} placeholder="Optional. Area-specific testing is generated from the selected area and active evidence." />
                </label>
                <label>
                  Risks and open items
                  <textarea rows={4} value={form.risks} onChange={(event) => updateForm('risks', event.target.value)} disabled={!areaReady} placeholder="Optional project-specific risks or open items." />
                </label>
              </section>
            </div>
          ) : (
            <section className="preview-panel">
              <div className="preview-toolbar">
                <div>
                  <h3>Generated Document Text</h3>
                  <p>{areaReady ? displayArea.name : 'No solution area selected'} | {docFormats.find((format) => format.id === form.format)?.name}</p>
                </div>
                <div className="toolbar-actions">
                  <button type="button" onClick={copyDocumentation} disabled={!areaReady || !evidenceReady}>Copy</button>
                  <button type="button" className="secondary-button" onClick={copyConfluenceDocumentation} disabled={!areaReady || !evidenceReady}>Copy for Confluence</button>
                  <button type="button" className="secondary-button" onClick={exportWord} disabled={!areaReady || !evidenceReady}>Download Word</button>
                  <button type="button" className="danger-button" onClick={resetWorkspace}>Reset</button>
                </div>
              </div>
              {lastAction ? <div className="action-status" role="status">{lastAction}</div> : null}
              {previewFlowDiagramSvg ? (
                <div className="flow-diagram-preview" aria-label="Technical flow diagram preview">
                  <div className="flow-diagram-preview-header">
                    <strong>Technical Flow Diagram</strong>
                    <span>Compact flowchart with segregated technical steps</span>
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: previewFlowDiagramSvg }} />
                </div>
              ) : null}
              <textarea className="markdown-output" value={generatedDoc} readOnly spellCheck="false" />
            </section>
          )}
        </section>
      </section>

      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </main>
  );
}

export default App;
