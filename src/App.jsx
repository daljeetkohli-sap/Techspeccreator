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
import { createWorker } from 'tesseract.js';

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
    prompts: ['Sender/receiver systems', 'iFlow name', 'Adapters/protocols', 'Message mapping/script', 'Credential alias/certificate', 'Monitoring view', 'Retry/reprocess rule']
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

const fairLogoPath = '/fcg-logo.png';


const requiredDocumentHeaders = [
  'Purpose',
  'Generated Implementation Summary',
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
  title: 'Customer Account Update Interface',
  owner: 'SAP Delivery Team',
  system: 'S/4HANA, SAP BTP, Azure',
  format: 'technical',
  areaId: 'sap-integration',
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
  templateMode: 'auto',
  templateName: '',
  templateType: '',
  templateOutline: '',
  customerLogoName: '',
  customerLogoType: '',
  customerLogoDataUrl: ''
};

function loadSavedWorkspace() {
  try {
    const saved = window.localStorage.getItem('techdoc-studio-workspace');
    return saved ? JSON.parse(saved) : null;
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

async function loadFairLogoDataUrl() {
  try {
    const response = await fetch(fairLogoPath);
    const blob = await response.blob();
    return readBlobAsDataUrl(blob);
  } catch {
    return fairLogoPath;
  }
}

async function loadFairLogoBytes() {
  const response = await fetch(fairLogoPath);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
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
    '**FAIR CONSULTING GROUP**',
    '_Technical documentation generated by FAIR Consulting Group._',
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

function buildTechSpecFilename(title) {
  return `TechSpec_${slugify(title)}.docx`;
}

function detectCodeSignals(code, area) {
  const text = code || '';
  const signals = [];

  const checks = [
    [/^\s*(data|select|loop|if|call function|class|method|raise exception)\b/im, 'ABAP logic detected: variables, conditions, database access, function/class usage, or exception handling.'],
    [/\/iwbep\/|odata|service binding|service definition|define service|annotate /i, 'OData/service exposure detected: document service entity, binding, annotations, and authorization behavior.'],
    [/entity\s+\w+|service\s+\w+|using\s+.*from|\.cds\b|srv\/|db\//i, 'CAP/CDS pattern detected: document entities, services, handlers, persistence, and deployment target.'],
    [/<\?xml|<mvc:|sap\.m\.|manifest\.json|component\.js|ui5/i, 'Fiori/UI5 pattern detected: document component structure, manifest routing, models, views, and launchpad intent.'],
    [/groovy|message\.getbody|camel|content modifier|integration flow|iflow/i, 'SAP Integration Suite/CPI pattern detected: document adapter flow, mapping, script step, headers/properties, and monitoring.'],
    [/"triggers"\s*:|"actions"\s*:|"definition"\s*:|"workflow"|logic app/i, 'Azure Logic Apps workflow pattern detected: document trigger, connectors, actions, retry policy, and run history.'],
    [/impex|items\.xml|backoffice|cronjob|flexiblesearch|commerce/i, 'SAP Commerce pattern detected: document extension, item type, impex, facade/service, cronjob, or Backoffice/HAC dependency.'],
    [/occ|spartacus|cmsmapping|cmscomponent|ngmodule|angular/i, 'SAP Spartacus pattern detected: document Angular module, CMS mapping, OCC calls, route/config, and storefront behavior.'],
    [/try\s*\{|catch\s*\(|raise exception|throw new|exception/i, 'Error handling detected: document validation failures, exception mapping, retries, and user/support messages.'],
    [/password|secret|client_secret|apikey|api-key|bearer\s+[a-z0-9]/i, 'Security-sensitive token pattern found: remove secrets from documentation and store credentials in a vault/destination.']
  ];

  checks.forEach(([pattern, message]) => {
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

function inferCodeDetails(code, area) {
  const text = code || '';
  const lower = text.toLowerCase();
  const details = {
    objects: extractMatches(text, [
      /\b(?:class|method|function|form|module|entity|service|action|workflow|trigger)\s+([a-zA-Z_][\w/-]*)/gi,
      /\b(?:DATA|TYPES)\s*\(\s*([a-zA-Z_][\w]*)\s*\)/gi,
      /\bCALL FUNCTION\s+'([^']+)'/gi,
      /\b(?:FROM|JOIN|UPDATE|MODIFY|INSERT INTO)\s+([a-zA-Z_][\w/]*)/gi
    ]),
    validations: [],
    integrations: [],
    persistence: [],
    security: [],
    errors: [],
    operations: []
  };

  if (/if\s+.+\s+is\s+initial|mandatory|required|validate|validation/i.test(text)) {
    details.validations.push('Input validation or mandatory-field checks are present.');
  }
  if (/select\b|from\b|join\b|update\b|modify\b|insert\b|delete\b|entity\s+\w+/i.test(text)) {
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
  if (/loop|filter|where|case|switch|if\s+/i.test(text)) {
    details.operations.push('Conditional or iterative business logic is present and should be described as processing rules.');
  }
  return details;
}

function collectEvidenceSummary(screenshots) {
  return screenshots.map((shot, index) => {
    const caption = safeLine(shot.caption) || shot.name;
    const visible = safeLine(shot.extractedText);
    const note = safeLine(shot.note);
    return `Figure ${index + 1} (${shot.screenType}): ${caption}${visible ? `; visible text: ${visible}` : ''}${note ? `; note: ${note}` : ''}`;
  });
}

function areaSpecificDetails(area, codeDetails, screenshots) {
  const evidence = collectEvidenceSummary(screenshots);
  const objectText = codeDetails.objects.length ? codeDetails.objects.join(', ') : 'objects to be confirmed from repository/package';
  const base = {
    'sap-abap': {
      'ABAP object inventory': [`ABAP objects identified or referenced: ${objectText}.`, 'Document object type, package, transport, activation status, and runtime entry point.', 'Confirm whether objects are custom Z/Y objects or extensions to standard SAP behavior.'],
      'Selection and business logic': [...codeDetails.validations, ...codeDetails.operations, 'Capture selection-screen parameters, filters, default values, and business rule branches.'],
      'Data access and CDS model': [...codeDetails.persistence, 'List SAP tables, CDS views, structures, keys, joins, and read/write impact.'],
      'Enhancements and exits': ['Confirm whether this is a BAdI, user exit, enhancement spot, implicit enhancement, custom report/class, or RAP/service extension.'],
      'Performance and locking': ['Document expected volume, SELECT strategy, indexes, buffering, enqueue/dequeue locking, update task, and commit/rollback behavior.'],
      'Error handling and application log': [...codeDetails.errors, 'Document message class/number, exception class, SLG1/application log object, and recovery steps.'],
      'Transport and deployment': ['Document transport request, package, dependencies, activation sequence, retrofit needs, and post-import validation.']
    },
    'sap-integration': {
      'Integration scenario': [...codeDetails.integrations, ...codeDetails.operations, ...(evidence.length ? [`Evidence reviewed: ${evidence[0]}`] : [])],
      'Sender and receiver adapters': ['Document sender and receiver adapters, protocol, endpoint, authentication, timeout, and quality-of-service settings.'],
      'Message mapping and transformation': [...codeDetails.operations, 'Map source fields to SAP target fields and call out mandatory transformations, value mappings, Groovy scripts, and content modifiers.'],
      'Security material': [...codeDetails.security, 'Document credential alias, destination, certificate, OAuth client, key pair, or key vault dependency.'],
      'Exception subprocess and retry': [...codeDetails.errors, 'Document exception subprocess, retry count, idempotency, duplicate handling, alerting, and manual reprocess path.'],
      'Monitoring and reprocessing': ['Document message monitor location, correlation/message ID, alerting, and reprocess approach.', ...evidence.slice(0, 2)]
    },
    'sap-btp-fiori': {
      'Fiori app intent and navigation': ['Document semantic object/action, launchpad tile, target mapping, inbound/outbound navigation, and primary user action.'],
      'UI/UX behavior': ['Document screen layout, field behavior, mandatory indicators, value helps, table/list behavior, buttons, messages, and user decision points.', ...evidence.slice(0, 2)],
      'Fiori Elements annotations': ['Document floorplan, annotation files, UI facets, line items, identification, field groups, actions, side effects, and presentation variants.'],
      'UI5 components and extensions': [...codeDetails.objects.map((item) => `Component/object reference: ${item}.`), 'Document manifest, component, controller extension, fragment, formatter, model, and routing changes.'],
      'OData and service binding': [...codeDetails.integrations, 'Document service URL, entity sets, operation/action imports, bindings, draft/read/update behavior, and backend service owner.'],
      'Launchpad content and deployment': ['Document content provider, app descriptor, catalog/group/space/page, role collection, deployment target, and cache/republish steps.'],
      'Roles and authorizations': [...codeDetails.security, 'Document role collections, catalog access, backend PFCG/authorization objects, and business role dependencies.'],
      'Accessibility and responsive behavior': ['Document keyboard navigation, labels, value-state messages, responsive layout behavior, device support, and accessibility considerations.']
    },
    'sap-cap': {
      'Domain model and entities': [...codeDetails.persistence, `Entities/services detected or referenced: ${objectText}.`],
      'Service API contract': [...codeDetails.integrations, 'Document service definitions, exposed entities, actions, events, API paths, and request/response behavior.'],
      'Event handlers and validations': [...codeDetails.operations, ...codeDetails.errors, 'Document custom handlers, validations, side effects, and transaction handling.'],
      'Persistence and data model': [...codeDetails.persistence, 'Document database artifacts, migrations, tenant isolation, seed data, and data retention assumptions.'],
      'Authentication and authorization': [...codeDetails.security, 'Document XSUAA scopes/roles, restrictions annotations, identity provider, and role collections.'],
      'Deployment and service bindings': ['Document MTA/modules, service bindings, destinations, HDI/container, Cloud Foundry/Kyma target, and environment variables.'],
      'Testing and mock data': ['Document unit/integration tests, mocked services, seed data, API test collections, and deployment smoke tests.']
    },
    'azure-logic-apps': {
      'Workflow trigger': ['Document trigger type, schedule/event/source, schema, and sample payload.'],
      'Action sequence': [...codeDetails.operations, `Workflow/action references: ${objectText}.`],
      'Connectors and identities': [...codeDetails.integrations, ...codeDetails.security, 'Document connector accounts, SAP/Azure endpoints, managed identity, and permission model.'],
      'Data operations and expressions': [...codeDetails.operations, 'Document compose/parse JSON/condition expressions, variables, and field mapping.'],
      'Retry and exception policy': [...codeDetails.errors, 'Document retry count, backoff, timeout, idempotency, scoped error handling, and duplicate handling.'],
      'Run history and diagnostics': ['Attach run IDs, action outputs, failure screenshots, and correlation IDs.', ...evidence.slice(0, 2)],
      'Environment configuration': ['Document connections, parameters, app settings, Key Vault references, and environment-specific values.']
    },
    'sap-spartacus': {
      'Feature module and routing': [`Feature/component references: ${objectText}.`, 'Document Angular module, route, guards, and lazy loading behavior.'],
      'CMS component mapping': ['Document CMS component mapping, slot/page dependency, page template, and content setup.'],
      'OCC API integration': [...codeDetails.integrations, 'Document OCC endpoint, request/response model, facade/adapter/converter, and error handling.'],
      'Storefront UI/UX behavior': [...codeDetails.operations, 'Document user journey, page states, empty/error/loading states, and responsive behavior.'],
      'State management and guards': ['Document facade usage, NgRx/store impact, guards, resolvers, and route protection.'],
      'Responsive and accessibility behavior': ['Document mobile/desktop behavior, keyboard support, ARIA labels, and accessibility constraints.'],
      'Testing and regression scope': ['Document unit/e2e scenarios, mocked OCC responses, regression areas, and browser/device coverage.']
    },
    'sap-commerce': {
      'Extension and module changes': [`Extension/object references: ${objectText}.`, 'Document extension, module, spring configuration, and build/update steps.'],
      'Items XML and type system': [...codeDetails.persistence, 'Document item types, attributes, relations, indexes, and deployment/update impact.'],
      'Service/facade/populator logic': [...codeDetails.operations, 'Document service/facade/populator/converter changes and data flow between layers.'],
      'Impex and sample data': ['Document impex files, sample data, environment-specific values, and rollback approach.'],
      'Cronjobs and tasks': ['Document cronjob/service/facade behavior, schedule, triggers, and monitoring location if applicable.'],
      'Backoffice and HAC validation': [...evidence.slice(0, 2), 'Document Backoffice screens, HAC scripts, FlexibleSearch, and operational validation.'],
      'Deployment and system update': ['Document system update, initialization impact, build pipeline, cloud hot folder/media migration, and rollback.']
    },
    'sap-rap': {
      'RAP data model': [...codeDetails.persistence, `Root/projection objects detected or referenced: ${objectText}.`],
      'Behavior definition and implementation': [...codeDetails.operations, ...codeDetails.validations, 'Document managed/unmanaged behavior, actions, determinations, validations, and behavior pool methods.'],
      'Projection and service exposure': [...codeDetails.integrations, 'Document projection views, service definition, service binding, publication status, and protocol.'],
      'Fiori Elements annotations': ['Document UI annotations, facets, line items, identification, field groups, actions, side effects, and value helps.'],
      'Draft and locking behavior': ['Document draft enablement, locks, ETags, numbering, save/activate flow, and concurrent edit behavior.'],
      'Authorization and feature control': [...codeDetails.security, 'Document authorization master, instance authorization, feature control, and business role dependencies.'],
      'Service binding and publication': ['Document binding type, preview app, published service URL, transport, and activation/deployment steps.']
    },
    'sap-bw': {
      'Source system and extraction': ['Document source system, extractor/connection, delta method, and source dependencies.'],
      'Data model/provider': [...codeDetails.persistence, `Provider/model references: ${objectText}.`],
      'Transformations and business rules': [...codeDetails.operations, 'Document transformation rules, routines, currency/unit handling, and semantic mappings.'],
      'Queries and consumption model': ['Document query/view, variables, restricted/calculated key figures, hierarchies, and consuming reports.'],
      'Scheduling and dependencies': ['Document process chain, task chain, schedule, dependencies, restart point, and SLA.'],
      'Reconciliation and data quality': ['Document record counts, totals, duplicate checks, exception reports, and reconciliation evidence.', ...evidence.slice(0, 2)],
      'Authorization and transport': [...codeDetails.security, 'Document analysis authorizations, spaces/roles, transport path, and post-import validation.']
    },
    'sap-mdg': {
      'Master data object and scope': [`Master data/entity references: ${objectText}.`, 'Document object scope, create/change/display behavior, and governance domain.'],
      'Change request type': ['Document CR type, steps, priorities, statuses, and triggering business scenario.'],
      'MDG data model and UI': [...codeDetails.persistence, 'Document entity type, attributes, UI configuration, feeder classes, and field properties.'],
      'Workflow and approvals': ['Document workflow path, approver roles, agent determination, escalation, and rejection/rework behavior.'],
      'Validations and derivations': [...codeDetails.validations, ...codeDetails.operations, 'Document BRF+ rules, derivations, duplicate checks, and error messages.'],
      'Replication and key mapping': [...codeDetails.integrations, 'Document target systems, DRF/replication model, key mapping, and outbound status handling.'],
      'Governance roles and audit trail': [...codeDetails.security, 'Document governance roles, authorization, audit fields, change history, and compliance evidence.']
    }
  };

  return base[area.id] || {};
}

function buildSectionInsights(area, section, form, screenshots) {
  const codeDetails = inferCodeDetails(form.codeSnippet, area);
  const specific = areaSpecificDetails(area, codeDetails, screenshots)[section] || [];
  const evidence = collectEvidenceSummary(screenshots);
  const generic = [
    `${section} is part of the ${area.name} delivery scope for "${safeLine(form.title) || 'this technical specification'}".`,
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
  const codeDetails = inferCodeDetails(form.codeSnippet, area);
  const signals = detectCodeSignals(form.codeSnippet, area);
  const evidence = collectEvidenceSummary(screenshots);
  const summary = [
    `This specification documents ${safeLine(form.title) || 'the delivered change'} for ${area.name}.`,
    safeLine(form.businessProcess) ? `Business process covered: ${safeLine(form.businessProcess)}` : '',
    codeDetails.objects.length ? `Key technical objects or identifiers inferred from the snippet: ${codeDetails.objects.join(', ')}.` : '',
    signals[0],
    evidence.length ? `Primary screenshot evidence reviewed: ${evidence[0]}.` : '',
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
  const describedSteps = extractBusinessProcessSteps(form.businessProcess);
  if (describedSteps.length) {
    return describedSteps;
  }

  const code = form.codeSnippet || '';
  const hasEvidence = safeLine(code) || screenshots.length || safeLine(form.overview);
  if (!hasEvidence) return [];

  const context = [
    code,
    form.businessProcess,
    form.overview,
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
    `Template source: FAIR standard technical specification structure for ${area.name}.`,
    'The document has been organized for developer handover, support readiness, and beta-test review.'
  ];
}

function buildTemplateAlignmentContent(form, area) {
  return bulletList(buildTemplateAlignmentItems(form, area));
}

function buildCodeUnderstanding(form, area) {
  const signals = detectCodeSignals(form.codeSnippet, area);
  return bulletList(signals);
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
  const evidence = collectEvidenceSummary(screenshots);
  const base = profile?.testing || ['Validate happy path, failure path, authorization, deployment, and support monitoring for this solution area.'];
  return [
    ...base,
    safeLine(form.testingNotes) ? `Project-specific testing note: ${safeLine(form.testingNotes)}` : '',
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

function buildUnitTestingPlan(area, form) {
  const profile = getValidationProfile(area);
  const codeDetails = inferCodeDetails(form.codeSnippet, area);
  return [
    safeLine(form.testingNotes) ? `Project testing scope: ${safeLine(form.testingNotes)}` : '',
    codeDetails.validations.length ? 'Unit tests should cover the validation and exception branches identified in the supplied code.' : '',
    codeDetails.operations.length ? 'Unit tests should cover the processing rules identified in the supplied code.' : '',
    !safeLine(form.testingNotes) && safeLine(form.codeSnippet) ? profile.unit[0] : ''
  ].filter(Boolean);
}

function buildIntegrationTestingPlan(area, form, screenshots) {
  const profile = getValidationProfile(area);
  const evidence = collectEvidenceSummary(screenshots);
  return [
    safeLine(form.businessProcess) ? `End-to-end test path: ${safeLine(form.businessProcess)}` : '',
    evidence.length ? `Evidence to attach: ${evidence[0]}` : '',
    !safeLine(form.businessProcess) && !evidence.length && safeLine(form.testingNotes) ? profile.integration[0] : ''
  ].filter(Boolean);
}

function buildRegressionTestingPlan(area, form) {
  return [
    safeLine(form.testingNotes) ? `Regression coverage should include the scenarios called out in testing notes: ${safeLine(form.testingNotes)}` : '',
    safeLine(form.businessProcess) ? `Regression should verify adjacent user journeys and integrations touched by: ${safeLine(form.businessProcess)}` : '',
    safeLine(form.risks) ? `Include risk-based regression for: ${safeLine(form.risks)}` : '',
    !safeLine(form.testingNotes) && !safeLine(form.businessProcess) ? getValidationProfile(area).regression[0] : ''
  ].filter(Boolean);
}

function buildDeploymentPlan(area, form) {
  return [
    safeLine(form.configNotes) ? `Deployment/configuration notes: ${safeLine(form.configNotes)}` : '',
    safeLine(form.system) ? `Target landscape: ${safeLine(form.system)}.` : '',
    'Record release owner, version/transport, deployment date, rollback approach, and post-deployment smoke-test result.'
  ].filter(Boolean);
}

function buildMonitoringSupportPlan(area, form, screenshots) {
  const evidence = collectEvidenceSummary(screenshots);
  return [
    safeLine(form.risks) ? `Support watch items: ${safeLine(form.risks)}` : '',
    evidence.length ? `Support evidence/reference: ${evidence[0]}` : '',
    safeLine(form.businessProcess) ? `Support should validate the documented process outcome: ${safeLine(form.businessProcess)}` : '',
    !safeLine(form.risks) && !evidence.length ? buildAreaSupportNotes(area)[0] : ''
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

function buildDocxDocument(form, area, screenshots, fairLogoBytes) {
  const selectedFormat = docFormats.find((format) => format.id === form.format) ?? docFormats[1];
  const templateRows = getTemplateMode(form) === 'upload'
    ? [
      ['Template source', 'Customer-provided template'],
      ...(safeLine(form.templateName) ? [['Template file', safeLine(form.templateName)]] : [])
    ]
    : [['Template source', 'FAIR standard technical specification']];
  const logoChildren = [
    new Paragraph({
      children: [
        new ImageRun({
          type: 'png',
          data: fairLogoBytes,
          transformation: { width: 245, height: 77 }
        })
      ]
    }),
    docParagraph('Technical documentation generated by FAIR Consulting Group', { size: 18 })
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
    new Paragraph({ text: safeLine(form.title) || 'Technical Documentation', heading: HeadingLevel.TITLE }),
    docInfoTable([
      ['Document type', selectedFormat.name],
      ['Solution area', area.name],
      ['Owner', safeLine(form.owner) || 'TBD'],
      ['Systems', safeLine(form.system) || 'TBD'],
      ['Generated', new Date().toLocaleString()],
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

  addSection('Purpose', [docParagraph(form.overview, { fallback: 'Explain why this technical specification is being created, which solution or change it documents, who will use it, and how it supports design review, testing, deployment, support, and handover.' })]);
  addSection('Generated Implementation Summary', docBullets(buildImplementationSummary(form, area, screenshots)));
  addSection('Process Flow', docNumbered(buildProcessFlowSteps(form, area, screenshots)), { skipWhenEmpty: true });
  addSection('Business Process', [docParagraph(form.businessProcess, { fallback: 'Describe the end-to-end process, trigger, users/systems, and expected result.' })]);
  addSection('Template Alignment', docBullets(buildTemplateAlignmentItems(form, area)));
  addSection('Solution Area Checklist', [docInfoTable(getChecklistRows(area).map((row) => [row.item, row.detail]))]);
  addSection('Technical Design', area.sections.flatMap((section) => [
    docHeading(section, HeadingLevel.HEADING_3),
    ...docBullets(buildSectionInsights(area, section, form, screenshots))
  ]));
  addSection('Configuration Notes', [docParagraph(form.configNotes, { fallback: 'List configuration, destinations, roles, communication arrangements, feature flags, and environment-specific values.' })]);

  if (safeLine(form.codeSnippet)) {
    addSection('Code Understanding', docBullets(detectCodeSignals(form.codeSnippet, area)));
    addSection('Code Snippet', [docCodeBlock(form.codeSnippet)]);
  }

  if (screenshots.length) {
    addSection('Screenshot Evidence', screenshots.flatMap((shot, index) => [
      docHeading(`Figure ${index + 1}: ${safeLine(shot.caption) || shot.name}`, HeadingLevel.HEADING_3),
      ...(shot.dataUrl ? [new Paragraph({ children: [new ImageRun({ type: imageTypeFromDataUrl(shot.dataUrl), data: dataUrlToBytes(shot.dataUrl), transformation: { width: 520, height: 292 } })] })] : []),
      docInfoTable([
        ['Type', shot.screenType],
        ['File', `${shot.name} (${formatBytes(shot.size)})`],
        ['Visible text', safeLine(shot.extractedText)],
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
  return [
    ...(profile?.risks || ['Confirm solution-specific operational, security, transport, and data risks.']),
    safeLine(form.risks) ? `Project-specific risk/open item: ${safeLine(form.risks)}` : ''
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

  if (shot.screenType) observations.push(`Screenshot type: ${shot.screenType}.`);
  if (safeLine(shot.caption)) observations.push(`Caption reviewed: ${safeLine(shot.caption)}.`);
  if (safeLine(shot.note)) observations.push(`Reviewer note: ${safeLine(shot.note)}.`);
  if (safeLine(shot.extractedText)) observations.push(`Visible text captured: ${safeLine(shot.extractedText)}.`);

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

function buildDocumentation(form, area, screenshots) {
  const selectedFormat = docFormats.find((format) => format.id === form.format) ?? docFormats[1];
  const areaPrompts = getChecklistRows(area).map((row) => `- ${row.item}: ${row.detail}`).join('\n');
  const sectionDetails = area.sections.map((section) => {
    const insights = buildSectionInsights(area, section, form, screenshots);
    return `### ${section}\n${bulletList(insights)}`;
  }).join('\n\n');
  const implementationSummary = bulletList(buildImplementationSummary(form, area, screenshots));
  const processFlow = buildProcessFlowText(form, area, screenshots);
  const unitTesting = bulletList(buildUnitTestingPlan(area, form));
  const integrationTesting = bulletList(buildIntegrationTestingPlan(area, form, screenshots));
  const regressionTesting = bulletList(buildRegressionTestingPlan(area, form));
  const deploymentPlan = bulletList(buildDeploymentPlan(area, form));
  const monitoringSupport = bulletList(buildMonitoringSupportPlan(area, form, screenshots));
  const areaRisks = bulletList(buildAreaRiskControls(area, form));
  const sections = [
    ['Purpose', safeLine(form.overview) || 'Explain why this technical specification is being created, which solution or change it documents, who will use it, and how it supports design review, testing, deployment, support, and handover.'],
    ['Generated Implementation Summary', implementationSummary],
    ['Process Flow', processFlow],
    ['Business Process', safeLine(form.businessProcess) || 'Describe the end-to-end process, trigger, users/systems, and expected result.'],
    ['Template Alignment', buildTemplateAlignmentContent(form, area)],
    ['Solution Area Checklist', areaPrompts],
    ['Technical Design', sectionDetails],
    ['Configuration Notes', safeLine(form.configNotes) || 'List configuration, destinations, roles, communication arrangements, feature flags, and environment-specific values.'],
    ...(safeLine(form.codeSnippet)
      ? [
        ['Code Understanding', buildCodeUnderstanding(form, area)],
        ['Code Snippet', `\`\`\`\n${form.codeSnippet}\n\`\`\``]
      ]
      : []),
    ...(screenshots.length
      ? [
        ['Screenshot Evidence', screenshots.map((shot, index) => `- Figure ${index + 1}: ${safeLine(shot.caption) || shot.name} (${shot.screenType})${shot.note ? ` - ${safeLine(shot.note)}` : ''}`).join('\n')],
        ['Screenshot Review And Technical Interpretation', screenshots.map((shot, index) => buildScreenshotUnderstanding(shot, area, index)).join('\n\n')]
      ]
      : []),
    ['Unit Testing', unitTesting],
    ['Integration Testing', integrationTesting],
    ['Regression Testing And UAT', regressionTesting],
    ['Deployment And Transport', deploymentPlan],
    ['Monitoring And Support', monitoringSupport],
    ['Risks, Assumptions, And Open Items', areaRisks],
    ['Approval And Handover', `${bulletList(buildApprovalHandoverPlan(area))}\n\n| Field | Detail |\n| --- | --- |\n${buildApprovalRows().map(([field, value]) => `| ${field} | ${value} |`).join('\n')}`]
  ].filter(([, content]) => safeLine(content));

  const body = sections
    .map(([title, content], index) => `## ${index + 1}. ${title}\n${content}`)
    .join('\n\n');

  return `${buildBrandingMarkdown(form)}\n\n# ${safeLine(form.title) || 'Technical Documentation'}\n\n` +
    `| Field | Detail |\n| --- | --- |\n| Document type | ${selectedFormat.name} |\n| Solution area | ${area.name} |\n| Owner | ${safeLine(form.owner) || 'TBD'} |\n| Systems | ${safeLine(form.system) || 'TBD'} |\n| Generated | ${new Date().toLocaleString()} |\n\n` +
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

function markdownToConfluenceHtml(markdown) {
  const lines = String(markdown || '').split('\n');
  const html = [];
  let paragraph = [];
  let listType = '';
  let listItems = [];
  let tableLines = [];
  let codeLines = [];
  let inCode = false;

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
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        flushOpenBlocks();
        inCode = true;
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
    html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }
  flushOpenBlocks();

  return `<div>${html.join('\n')}</div>`;
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

  const selectedArea = capabilityAreas.find((area) => area.id === form.areaId) ?? capabilityAreas[0];
  const generatedDoc = useMemo(
    () => buildDocumentation(form, selectedArea, screenshots),
    [form, selectedArea, screenshots]
  );

  const stats = useMemo(() => {
    const words = generatedDoc.split(/\s+/).filter(Boolean).length;
    const completedFields = ['title', 'owner', 'system', 'overview', 'businessProcess', 'codeSnippet', 'testingNotes']
      .filter((field) => safeLine(form[field])).length;
    return {
      words,
      screenshots: screenshots.length,
      completedFields,
      sections: (generatedDoc.match(/^##\s+\d+\./gm) || []).length
    };
  }, [form, generatedDoc, screenshots.length]);

  useEffect(() => {
    window.localStorage.setItem('techdoc-studio-workspace', JSON.stringify({ form }));
  }, [form]);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function setTemplateMode(mode) {
    setForm((current) => ({ ...current, templateMode: mode }));
    showToast(mode === 'upload' ? 'Use my template selected' : 'Automatic template selected');
  }

  async function handleScreenshotUpload(event) {
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
      setScreenshots((current) => [...current, ...records]);
      showToast(`${imageFiles.length} screenshot${imageFiles.length === 1 ? '' : 's'} added`);
    } catch {
      showToast('Could not load screenshot image');
    } finally {
      event.target.value = '';
    }
  }

  async function handleCustomerLogoUpload(event) {
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
    const shot = screenshots.find((item) => item.id === id);
    if (!shot?.dataUrl) {
      showToast('No image available for OCR');
      return;
    }

    setOcrActiveId(id);
    setOcrStatus('Preparing OCR');

    let worker;
    try {
      worker = await createWorker('eng', 1, {
        logger: (message) => {
          if (!message?.status) return;
          const progress = typeof message.progress === 'number' ? ` ${Math.round(message.progress * 100)}%` : '';
          setOcrStatus(`${message.status}${progress}`);
        }
      });
      await worker.setParameters({ preserve_interword_spaces: '1' });

      const result = await worker.recognize(shot.dataUrl);
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
      setLastAction(`OCR extracted ${text.length.toLocaleString()} characters from ${shot.name}. Review the visible text field, then click Review image or Download Word.`);
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
    setScreenshots((current) =>
      current.map((shot, index) => {
        if (shot.id !== id) return shot;
        const review = buildScreenshotUnderstanding(shot, selectedArea, index)
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
    const textToCopy = generatedDoc || buildDocumentation(form, selectedArea, screenshots);
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
    const textToCopy = generatedDoc || buildDocumentation(form, selectedArea, screenshots);
    const htmlToCopy = markdownToConfluenceHtml(textToCopy);
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
    const [file] = Array.from(event.target.files || []);
    if (!file) return;

    try {
      const text = await file.text();
      updateForm('codeSnippet', text);
      showToast(`Code loaded from ${file.name}`);
    } catch {
      showToast('Could not read code file');
    } finally {
      event.target.value = '';
    }
  }

  async function handleTemplateUpload(event) {
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
      const text = await file.text();
      const readableText = text
        .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2500);

      if (readableText.length > 120 && !['pdf', 'docx'].includes(extension)) {
        updateForm('templateOutline', readableText);
        showToast('Template text loaded and will be used');
      } else {
        showToast('Template uploaded. Paste key headings if needed.');
      }
    } catch {
      showToast('Template uploaded. Paste key headings if needed.');
    } finally {
      event.target.value = '';
    }
  }

  async function exportWord() {
    const filename = buildTechSpecFilename(form.title);
    const fairLogoBytes = await loadFairLogoBytes();
    const wordDocument = buildDocxDocument(form, selectedArea, screenshots, fairLogoBytes);
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
      setLastAction(`Started download for ${filename}. This is a real .docx file with embedded FAIR and customer logos. If the in-app browser blocks it, open this app in Chrome or Edge and click Download Word again.`);
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
        <div><strong>{stats.completedFields}/7</strong><span>Inputs filled</span></div>
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
                onClick={() => updateForm('areaId', area.id)}
              >
                <span>{area.name}</span>
                <small>{area.tag}</small>
              </button>
            ))}
          </div>

          <label className="format-picker">
            Document format
            <select value={form.format} onChange={(event) => updateForm('format', event.target.value)}>
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
            <strong>{selectedArea.name} sections</strong>
            <ul>
              {selectedArea.sections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ul>
          </div>

          <div className="area-sections">
            <strong>Testing focus</strong>
            <ul>
              {[...buildUnitTestingPlan(selectedArea, form), ...buildIntegrationTestingPlan(selectedArea, form, screenshots)].slice(0, 4).map((item) => (
                <li key={item}>{item}</li>
              ))}
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

          {activeTab === 'compose' ? (
            <div className="compose-grid">
              <section className="input-section">
                <h3>Core Details</h3>
                <div className="field-grid">
                  <label>
                    Document title
                    <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
                  </label>
                  <label>
                    Owner/team
                    <input value={form.owner} onChange={(event) => updateForm('owner', event.target.value)} />
                  </label>
                  <label className="wide-field">
                    Systems and landscape
                    <input value={form.system} onChange={(event) => updateForm('system', event.target.value)} />
                  </label>
                </div>
              </section>

              <section className="input-section">
                <div className="section-row">
                  <div>
                    <h3>Document Branding</h3>
                    <p className="helper-copy">FAIR CONSULTING GROUP is included automatically. Add a customer logo if required.</p>
                  </div>
                  <label className="upload-button">
                    Upload customer logo
                    <input type="file" accept="image/*" onChange={handleCustomerLogoUpload} />
                  </label>
                </div>
                <div className="brand-preview">
                  <div className="fair-preview">
                    <img src={fairLogoPath} alt="FAIR Consulting Group logo" />
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
                  >
                    <strong>Create automatically</strong>
                    <span>Generate a standard tech-spec template from the selected area, code snippet, screenshots, and process notes.</span>
                  </button>
                  <button
                    type="button"
                    className={`template-choice ${getTemplateMode(form) === 'upload' ? 'selected' : ''}`}
                    onClick={() => setTemplateMode('upload')}
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
                        />
                      </label>
                    </div>
                    <label>
                      Template guidance
                      <textarea
                        rows={5}
                        value={form.templateOutline}
                        onChange={(event) => updateForm('templateOutline', event.target.value)}
                        placeholder="Paste template headings, section order, style requirements, mandatory tables, approval fields, or acceptance criteria here."
                      />
                    </label>
                  </>
                ) : (
                  <div className="analysis-box">
                    <strong>Automatic template that will be used</strong>
                    <pre>{buildAutomaticTemplateOutline(form, selectedArea)}</pre>
                  </div>
                )}
              </section>

              <section className="input-section">
                <h3>Process And Design Notes</h3>
                <label>
                  Purpose
                  <textarea rows={4} value={form.overview} onChange={(event) => updateForm('overview', event.target.value)} />
                </label>
                <label>
                  Business process
                  <textarea rows={5} value={form.businessProcess} onChange={(event) => updateForm('businessProcess', event.target.value)} />
                </label>
                <label>
                  Configuration notes
                  <textarea rows={4} value={form.configNotes} onChange={(event) => updateForm('configNotes', event.target.value)} />
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
                    />
                  </label>
                </div>
                <textarea
                  className="code-input"
                  rows={12}
                  value={form.codeSnippet}
                  onChange={(event) => updateForm('codeSnippet', event.target.value)}
                  spellCheck="false"
                />
                <div className="analysis-box">
                  <strong>Code understanding</strong>
                  <ul>
                    {detectCodeSignals(form.codeSnippet, selectedArea).map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="input-section">
                <div className="section-row">
                  <h3>Screenshot Evidence</h3>
                  <label className="upload-button">
                    Add screenshots
                    <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} />
                  </label>
                </div>

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
                  <textarea rows={5} value={form.testingNotes} onChange={(event) => updateForm('testingNotes', event.target.value)} />
                </label>
                <label>
                  Risks and open items
                  <textarea rows={4} value={form.risks} onChange={(event) => updateForm('risks', event.target.value)} />
                </label>
              </section>
            </div>
          ) : (
            <section className="preview-panel">
              <div className="preview-toolbar">
                <div>
                  <h3>Generated Document Text</h3>
                  <p>{selectedArea.name} | {docFormats.find((format) => format.id === form.format)?.name}</p>
                </div>
                <div className="toolbar-actions">
                  <button type="button" onClick={copyDocumentation}>Copy</button>
                  <button type="button" className="secondary-button" onClick={copyConfluenceDocumentation}>Copy for Confluence</button>
                  <button type="button" className="secondary-button" onClick={exportWord}>Download Word</button>
                  <button type="button" className="danger-button" onClick={resetWorkspace}>Reset</button>
                </div>
              </div>
              {lastAction ? <div className="action-status" role="status">{lastAction}</div> : null}
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
