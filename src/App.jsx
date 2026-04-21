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
    'Confirm production credential rotation process. Align retry handling with business tolerance for duplicate updates.'
};

function loadSavedWorkspace() {
  try {
    const saved = window.localStorage.getItem('techdoc-studio-workspace');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function createScreenshotRecord(file) {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    url: URL.createObjectURL(file),
    caption: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
    note: ''
  };
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

function buildDocumentation(form, area, screenshots) {
  const selectedFormat = docFormats.find((format) => format.id === form.format) ?? docFormats[1];
  const evidence = screenshots.length
    ? screenshots.map((shot, index) => `- Figure ${index + 1}: ${safeLine(shot.caption) || shot.name}${shot.note ? ` - ${safeLine(shot.note)}` : ''}`).join('\n')
    : '- Add screenshots of the app screen, SAP transaction, BTP cockpit page, workflow run, or code review evidence.';

  const areaPrompts = area.prompts.map((prompt) => `- ${prompt}: _Add detail_`).join('\n');
  const sectionDetails = area.sections.map((section) => `### ${section}\n- Current state: _Describe what was built or configured._\n- Evidence: _Reference screenshot, object name, or code line._`).join('\n\n');

  return `# ${safeLine(form.title) || 'Technical Documentation'}\n\n` +
    `| Field | Detail |\n| --- | --- |\n| Document type | ${selectedFormat.name} |\n| Solution area | ${area.name} |\n| Owner | ${safeLine(form.owner) || 'TBD'} |\n| Systems | ${safeLine(form.system) || 'TBD'} |\n| Generated | ${new Date().toLocaleString()} |\n\n` +
    `## 1. Purpose\n${safeLine(form.overview) || 'Describe why this documentation exists and what work was completed.'}\n\n` +
    `## 2. Business Process\n${safeLine(form.businessProcess) || 'Describe the end-to-end process, trigger, users/systems, and expected result.'}\n\n` +
    `## 3. Solution Area Checklist\n${areaPrompts}\n\n` +
    `## 4. Technical Design\n${sectionDetails}\n\n` +
    `## 5. Configuration Notes\n${safeLine(form.configNotes) || 'List configuration, destinations, roles, communication arrangements, feature flags, and environment-specific values.'}\n\n` +
    `## 6. Code Snippet\n\`\`\`\n${form.codeSnippet || 'Paste ABAP, JavaScript, CDS, XML, JSON, Groovy, or configuration code here.'}\n\`\`\`\n\n` +
    `## 7. Screenshot Evidence\n${evidence}\n\n` +
    `## 8. Testing And Validation\n${safeLine(form.testingNotes) || 'Document test scenarios, test data, expected results, actual results, and linked defects.'}\n\n` +
    `## 9. Risks, Assumptions, And Open Items\n${safeLine(form.risks) || 'List risks, assumptions, dependencies, and follow-up actions.'}\n\n` +
    `## 10. Support Notes\n${bulletList([
      'Primary support team: _Add team or queue_',
      'Monitoring location: _Add SAP app, BTP cockpit, Azure run history, or commerce console path_',
      'Recovery action: _Add restart, reprocess, rollback, or manual correction steps_',
      'Escalation path: _Add technical owner and business owner_'
    ])}\n`;
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
      sections: selectedArea.sections.length + 6
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

  function handleScreenshotUpload(event) {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) {
      showToast('Choose screenshot image files');
      return;
    }
    setScreenshots((current) => [...current, ...imageFiles.map(createScreenshotRecord)]);
    event.target.value = '';
    showToast(`${imageFiles.length} screenshot${imageFiles.length === 1 ? '' : 's'} added`);
  }

  function updateScreenshot(id, field, value) {
    setScreenshots((current) =>
      current.map((shot) => (shot.id === id ? { ...shot, [field]: value } : shot))
    );
  }

  function removeScreenshot(id) {
    setScreenshots((current) => {
      const target = current.find((shot) => shot.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return current.filter((shot) => shot.id !== id);
    });
    showToast('Screenshot removed');
  }

  async function copyDocumentation() {
    await navigator.clipboard.writeText(generatedDoc);
    showToast('Documentation copied as Markdown');
  }

  function exportMarkdown() {
    const blob = new Blob([generatedDoc], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(safeLine(form.title) || 'technical-documentation').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Markdown exported');
  }

  function resetWorkspace() {
    screenshots.forEach((shot) => URL.revokeObjectURL(shot.url));
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
            structured Markdown document for project handover, support, and audits.
          </p>
        </div>

        <div className="hero-actions" aria-label="Documentation actions">
          <button type="button" onClick={copyDocumentation} title="Copy Markdown">
            Copy doc
          </button>
          <button type="button" className="secondary-button" onClick={exportMarkdown} title="Export Markdown">
            Export .md
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
                <h3>Code Snippet</h3>
                <textarea
                  className="code-input"
                  rows={12}
                  value={form.codeSnippet}
                  onChange={(event) => updateForm('codeSnippet', event.target.value)}
                  spellCheck="false"
                />
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
                        <input
                          value={shot.caption}
                          onChange={(event) => updateScreenshot(shot.id, 'caption', event.target.value)}
                          aria-label="Screenshot caption"
                        />
                        <textarea
                          rows={3}
                          value={shot.note}
                          onChange={(event) => updateScreenshot(shot.id, 'note', event.target.value)}
                          placeholder="What should the reader notice?"
                        />
                        <button type="button" className="ghost-button" onClick={() => removeScreenshot(shot.id)}>
                          Remove
                        </button>
                      </div>
                    </article>
                  )) : (
                    <div className="empty-state">Upload SAP GUI, Fiori, BTP cockpit, Azure, HAC, Backoffice, or code review screenshots.</div>
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
                  <h3>Generated Markdown</h3>
                  <p>{selectedArea.name} | {docFormats.find((format) => format.id === form.format)?.name}</p>
                </div>
                <div className="toolbar-actions">
                  <button type="button" onClick={copyDocumentation}>Copy</button>
                  <button type="button" className="secondary-button" onClick={exportMarkdown}>Export</button>
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
