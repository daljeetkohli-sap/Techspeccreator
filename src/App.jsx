import React, { useEffect, useMemo, useState } from 'react';

const capabilityAreas = [
  {
    id: 'sap-abap',
    name: 'SAP ABAP',
    tag: 'Backend',
    sections: ['Object overview', 'Selection logic', 'Data model', 'Enhancements', 'Error handling'],
    prompts: ['Report/program name', 'Tables/CDS views', 'BAPI/FM/classes', 'Transport/request']
  },
  {
    id: 'sap-integration',
    name: 'SAP Integration Suite / CPI',
    tag: 'Integration',
    sections: ['Integration flow', 'Adapters', 'Mappings', 'Security', 'Monitoring'],
    prompts: ['Sender/receiver systems', 'iFlow name', 'Message mapping', 'Credential alias']
  },
  {
    id: 'sap-btp-fiori',
    name: 'SAP BTP Fiori App',
    tag: 'Frontend',
    sections: ['App intent', 'UI5 components', 'OData services', 'Launchpad setup', 'Authorizations'],
    prompts: ['App ID', 'Semantic object/action', 'Service endpoint', 'Role collection']
  },
  {
    id: 'sap-cap',
    name: 'SAP CAP App',
    tag: 'Cloud',
    sections: ['Domain model', 'Services', 'Handlers', 'Persistence', 'Deployment'],
    prompts: ['Entities', 'Service definitions', 'Event handlers', 'MTA/Cloud Foundry target']
  },
  {
    id: 'azure-logic-apps',
    name: 'Azure Logic Apps',
    tag: 'Azure',
    sections: ['Trigger', 'Actions', 'Connectors', 'Retry policy', 'Run history'],
    prompts: ['Workflow name', 'Trigger type', 'Connectors', 'Key expressions']
  },
  {
    id: 'sap-spartacus',
    name: 'SAP Spartacus',
    tag: 'Commerce UI',
    sections: ['Feature module', 'CMS mapping', 'Occ calls', 'Storefront behavior', 'Testing'],
    prompts: ['Component/module', 'CMS slot', 'OCC endpoint', 'Route/config']
  },
  {
    id: 'sap-commerce',
    name: 'SAP Commerce Cloud',
    tag: 'Commerce',
    sections: ['Extension changes', 'Items XML', 'Impex', 'Cronjobs', 'Backoffice/HAC'],
    prompts: ['Extension', 'Item types', 'Impex files', 'Cronjob/facade/service']
  },
  {
    id: 'sap-rap',
    name: 'SAP RAP / Fiori Elements',
    tag: 'S/4HANA',
    sections: ['Behavior definition', 'Projection', 'Annotations', 'Draft handling', 'Authorization'],
    prompts: ['Root entity', 'Behavior pool', 'Annotations', 'Service binding']
  },
  {
    id: 'sap-bw',
    name: 'SAP BW / Datasphere',
    tag: 'Analytics',
    sections: ['Data source', 'Transformations', 'Queries', 'Scheduling', 'Reconciliation'],
    prompts: ['Provider/model', 'Transformation logic', 'Query name', 'Load schedule']
  },
  {
    id: 'sap-mdg',
    name: 'SAP MDG',
    tag: 'Master Data',
    sections: ['Change request', 'Data model', 'Workflow', 'Validations', 'Replication'],
    prompts: ['Entity type', 'CR type', 'BRF+ rules', 'Replication target']
  }
];

const docFormats = [
  { id: 'functional', name: 'Functional Spec', description: 'Business process, scope, rules, and expected behavior.' },
  { id: 'technical', name: 'Technical Spec', description: 'Objects, services, logic, configuration, and deployment notes.' },
  { id: 'runbook', name: 'Support Runbook', description: 'Monitoring, troubleshooting, recovery, and ownership.' },
  { id: 'handover', name: 'Handover Pack', description: 'Implementation summary, evidence, risks, and next steps.' }
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

const initialForm = {
  title: 'Customer Account Update Interface',
  owner: 'SAP Delivery Team',
  system: 'S/4HANA, SAP BTP, Azure',
  format: 'technical',
  areaId: 'sap-integration',
  overview:
    'Documents the delivered change using screenshots, implementation notes, and code snippets so support and project teams can understand the solution quickly.',
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
  templateName: '',
  templateType: '',
  templateOutline: ''
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

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

function slugify(value) {
  return (safeLine(value) || 'technical-specification')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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

  if (!safeLine(text)) {
    signals.push('No code snippet supplied yet; attach or paste the relevant ABAP, CDS, XML, JSON, JavaScript, Groovy, or configuration snippet.');
  }

  return [...new Set(signals)];
}

function buildCodeUnderstanding(form, area) {
  const signals = detectCodeSignals(form.codeSnippet, area);
  return bulletList(signals);
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
  const templateReference = safeLine(form.templateName)
    ? `- Template file: ${safeLine(form.templateName)} (${safeLine(form.templateType) || 'uploaded template'})\n- Template guidance:\n${safeLine(form.templateOutline) || '_Paste the required headings, document structure, style notes, or acceptance criteria from the template._'}`
    : '- No template uploaded. Use the generated standard technical specification structure.';
  const evidence = screenshots.length
    ? screenshots.map((shot, index) => `- Figure ${index + 1}: ${safeLine(shot.caption) || shot.name} (${shot.screenType})${shot.note ? ` - ${safeLine(shot.note)}` : ''}`).join('\n')
    : '- Add screenshots of the app screen, SAP transaction, BTP cockpit page, workflow run, or code review evidence.';
  const screenshotReview = screenshots.length
    ? screenshots.map((shot, index) => buildScreenshotUnderstanding(shot, area, index)).join('\n\n')
    : '- No screenshots attached yet. Add screenshots and capture visible text/notes so the generated document can describe what each image proves.';

  const areaPrompts = area.prompts.map((prompt) => `- ${prompt}: _Add detail_`).join('\n');
  const sectionDetails = area.sections.map((section) => `### ${section}\n- Current state: _Describe what was built or configured._\n- Evidence: _Reference screenshot, object name, or code line._`).join('\n\n');

  return `# ${safeLine(form.title) || 'Technical Documentation'}\n\n` +
    `| Field | Detail |\n| --- | --- |\n| Document type | ${selectedFormat.name} |\n| Solution area | ${area.name} |\n| Owner | ${safeLine(form.owner) || 'TBD'} |\n| Systems | ${safeLine(form.system) || 'TBD'} |\n| Generated | ${new Date().toLocaleString()} |\n\n` +
    `## 1. Purpose\n${safeLine(form.overview) || 'Describe why this documentation exists and what work was completed.'}\n\n` +
    `## 2. Business Process\n${safeLine(form.businessProcess) || 'Describe the end-to-end process, trigger, users/systems, and expected result.'}\n\n` +
    `## 3. Template Reference\n${templateReference}\n\n` +
    `## 4. Solution Area Checklist\n${areaPrompts}\n\n` +
    `## 5. Technical Design\n${sectionDetails}\n\n` +
    `## 6. Configuration Notes\n${safeLine(form.configNotes) || 'List configuration, destinations, roles, communication arrangements, feature flags, and environment-specific values.'}\n\n` +
    `## 7. Code Understanding\n${buildCodeUnderstanding(form, area)}\n\n` +
    `## 8. Code Snippet\n\`\`\`\n${form.codeSnippet || 'Paste ABAP, JavaScript, CDS, XML, JSON, Groovy, or configuration code here.'}\n\`\`\`\n\n` +
    `## 9. Screenshot Evidence\n${evidence}\n\n` +
    `## 10. Screenshot Review And Technical Interpretation\n${screenshotReview}\n\n` +
    `## 11. Testing And Validation\n${safeLine(form.testingNotes) || 'Document test scenarios, test data, expected results, actual results, and linked defects.'}\n\n` +
    `## 12. Risks, Assumptions, And Open Items\n${safeLine(form.risks) || 'List risks, assumptions, dependencies, and follow-up actions.'}\n\n` +
    `## 13. Support Notes\n${bulletList([
      'Primary support team: _Add team or queue_',
      'Monitoring location: _Add SAP app, BTP cockpit, Azure run history, or commerce console path_',
      'Recovery action: _Add restart, reprocess, rollback, or manual correction steps_',
      'Escalation path: _Add technical owner and business owner_'
    ])}\n`;
}

function buildWordDocument(form, area, screenshots) {
  const selectedFormat = docFormats.find((format) => format.id === form.format) ?? docFormats[1];
  const codeSignals = detectCodeSignals(form.codeSnippet, area);
  const templateRows = safeLine(form.templateName)
    ? `
      <tr><th>Template file</th><td>${escapeHtml(form.templateName)}</td></tr>
      <tr><th>Template type</th><td>${escapeHtml(form.templateType || 'Uploaded template')}</td></tr>
      <tr><th>Template guidance</th><td>${escapeHtml(safeLine(form.templateOutline) || 'No headings or format guidance pasted yet.')}</td></tr>
    `
    : '<tr><th>Template</th><td>No template uploaded. Standard technical specification structure used.</td></tr>';
  const areaPromptRows = area.prompts.map((prompt) => `<tr><td>${escapeHtml(prompt)}</td><td>Add detail</td></tr>`).join('');
  const technicalSections = area.sections.map((section) => `
    <h3>${escapeHtml(section)}</h3>
    <ul>
      <li>Current state: Describe what was built or configured.</li>
      <li>Evidence: Reference screenshot, object name, or code line.</li>
    </ul>
  `).join('');
  const screenshotBlocks = screenshots.length
    ? screenshots.map((shot, index) => {
      const observations = getScreenshotObservations(shot, area);
      return `
        <div class="figure">
          <h3>Figure ${index + 1}: ${escapeHtml(safeLine(shot.caption) || shot.name)}</h3>
          ${shot.dataUrl ? `<img src="${shot.dataUrl}" alt="${escapeHtml(shot.caption || shot.name)}">` : ''}
          <table>
            <tr><th>Type</th><td>${escapeHtml(shot.screenType)}</td></tr>
            <tr><th>File</th><td>${escapeHtml(shot.name)} (${formatBytes(shot.size)})</td></tr>
            <tr><th>Visible text</th><td>${escapeHtml(safeLine(shot.extractedText) || 'Not captured')}</td></tr>
            <tr><th>Reviewer notes</th><td>${escapeHtml(safeLine(shot.note) || 'Not captured')}</td></tr>
          </table>
          <h4>Technical Interpretation</h4>
          ${htmlList(observations)}
        </div>
      `;
    }).join('')
    : '<p>No screenshots attached yet. Add screenshots and capture visible text/notes so the generated document can describe what each image proves.</p>';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(safeLine(form.title) || 'Technical Documentation')}</title>
    <style>
      body { font-family: Calibri, Arial, sans-serif; color: #1f2933; line-height: 1.45; }
      h1 { color: #12343b; font-size: 26pt; margin-bottom: 8px; }
      h2 { color: #1f5d6c; border-bottom: 1px solid #b7c7cf; padding-bottom: 4px; margin-top: 24px; }
      h3 { color: #243b4a; margin-top: 16px; }
      table { width: 100%; border-collapse: collapse; margin: 10px 0 16px; }
      th, td { border: 1px solid #c8d4da; padding: 8px; vertical-align: top; text-align: left; }
      th { background: #e8f2f4; width: 28%; }
      pre { background: #f4f7f8; border: 1px solid #c8d4da; padding: 12px; white-space: pre-wrap; font-family: Consolas, monospace; }
      img { max-width: 620px; width: 100%; height: auto; border: 1px solid #c8d4da; margin: 8px 0 12px; }
      .figure { page-break-inside: avoid; margin-bottom: 22px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(safeLine(form.title) || 'Technical Documentation')}</h1>
    <table>
      <tr><th>Document type</th><td>${escapeHtml(selectedFormat.name)}</td></tr>
      <tr><th>Solution area</th><td>${escapeHtml(area.name)}</td></tr>
      <tr><th>Owner</th><td>${escapeHtml(safeLine(form.owner) || 'TBD')}</td></tr>
      <tr><th>Systems</th><td>${escapeHtml(safeLine(form.system) || 'TBD')}</td></tr>
      <tr><th>Generated</th><td>${escapeHtml(new Date().toLocaleString())}</td></tr>
      ${templateRows}
    </table>

    <h2>1. Purpose</h2>
    ${htmlParagraph(form.overview, 'Describe why this documentation exists and what work was completed.')}

    <h2>2. Business Process</h2>
    ${htmlParagraph(form.businessProcess, 'Describe the end-to-end process, trigger, users/systems, and expected result.')}

    <h2>3. Template Alignment</h2>
    ${safeLine(form.templateOutline)
      ? htmlParagraph(form.templateOutline, 'Template headings and style guidance were supplied.')
      : htmlParagraph('', safeLine(form.templateName) ? 'Template uploaded. Paste headings or key format rules into Template Guidance for stronger alignment.' : 'No uploaded template was supplied. Standard format used.')}

    <h2>4. Solution Area Checklist</h2>
    <table><tr><th>Item</th><th>Detail</th></tr>${areaPromptRows}</table>

    <h2>5. Technical Design</h2>
    ${technicalSections}

    <h2>6. Configuration Notes</h2>
    ${htmlParagraph(form.configNotes, 'List configuration, destinations, roles, communication arrangements, feature flags, and environment-specific values.')}

    <h2>7. Code Understanding</h2>
    ${htmlList(codeSignals)}

    <h2>8. Code Snippet</h2>
    <pre>${escapeHtml(form.codeSnippet || 'Paste ABAP, JavaScript, CDS, XML, JSON, Groovy, or configuration code here.')}</pre>

    <h2>9. Screenshot Evidence And Technical Interpretation</h2>
    ${screenshotBlocks}

    <h2>10. Testing And Validation</h2>
    ${htmlParagraph(form.testingNotes, 'Document test scenarios, test data, expected results, actual results, and linked defects.')}

    <h2>11. Risks, Assumptions, And Open Items</h2>
    ${htmlParagraph(form.risks, 'List risks, assumptions, dependencies, and follow-up actions.')}

    <h2>12. Support Notes</h2>
    ${htmlList([
      'Primary support team: Add team or queue',
      'Monitoring location: Add SAP app, BTP cockpit, Azure run history, or commerce console path',
      'Recovery action: Add restart, reprocess, rollback, or manual correction steps',
      'Escalation path: Add technical owner and business owner'
    ])}
  </body>
</html>`;
}

function App() {
  const savedWorkspace = loadSavedWorkspace();
  const [form, setForm] = useState(savedWorkspace?.form ?? initialForm);
  const [screenshots, setScreenshots] = useState([]);
  const [activeTab, setActiveTab] = useState('compose');
  const [toast, setToast] = useState('');

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
      sections: selectedArea.sections.length + 9
    };
  }, [form, generatedDoc, screenshots.length, selectedArea.sections.length]);

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

  function updateScreenshot(id, field, value) {
    setScreenshots((current) =>
      current.map((shot) => (shot.id === id ? { ...shot, [field]: value } : shot))
    );
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
    await navigator.clipboard.writeText(generatedDoc);
    showToast('Documentation text copied');
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
    updateForm('templateName', file.name);
    updateForm('templateType', templateType);

    try {
      const text = await file.text();
      const readableText = text
        .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2500);

      if (readableText.length > 120 && !['pdf', 'docx'].includes(extension)) {
        updateForm('templateOutline', readableText);
        showToast('Template text loaded');
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
    const filename = `${slugify(form.title)}.doc`;
    const wordDocument = buildWordDocument(form, selectedArea, screenshots);

    try {
      if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Word document',
              accept: { 'application/msword': ['.doc'] }
            }
          ]
        });
        const writable = await handle.createWritable();
        await writable.write(wordDocument);
        await writable.close();
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
      const blob = new Blob(['\ufeff', wordDocument], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
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
      showToast('Word download started');
    } catch {
      await copyDocumentation();
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

        <div className="hero-actions" aria-label="Documentation actions">
          <button type="button" onClick={copyDocumentation} title="Copy document text">
            Copy doc
          </button>
          <button type="button" className="secondary-button" onClick={exportWord} title="Download Word document">
            Download Word
          </button>
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
                    <h3>Template</h3>
                    <p className="helper-copy">Upload a PDF or Word template, then add the required headings or format rules for the generated Word spec.</p>
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
                <div className="template-summary">
                  <strong>{form.templateName || 'No template uploaded'}</strong>
                  <span>{form.templateType || 'PDF, DOC, or DOCX accepted'}</span>
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
                          placeholder="Paste visible screenshot text, object names, errors, message IDs, or status values"
                        />
                        <textarea
                          rows={3}
                          value={shot.note}
                          onChange={(event) => updateScreenshot(shot.id, 'note', event.target.value)}
                          placeholder="Reviewer notes and technical interpretation"
                        />
                        <div className="card-actions">
                          <button type="button" className="secondary-button" onClick={() => applyScreenshotReview(shot.id)}>
                            Review image
                          </button>
                          <button type="button" className="ghost-button" onClick={() => removeScreenshot(shot.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  )) : (
                    <div className="empty-state">Upload SAP GUI, Fiori, BTP cockpit, Azure, HAC, Backoffice, or code review screenshots. Add visible text or notes so the document can interpret what each image proves.</div>
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
                  <button type="button" className="secondary-button" onClick={exportWord}>Download Word</button>
                  <button type="button" className="danger-button" onClick={resetWorkspace}>Reset</button>
                </div>
              </div>
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
