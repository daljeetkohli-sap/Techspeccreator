import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const envPath = join(process.cwd(), 'server', '.env');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}

loadEnvFile(envPath);

const port = Number(process.env.PORT || 8787);
const jiraBaseUrl = (process.env.JIRA_BASE_URL || '').replace(/\/+$/, '');
const jiraEmail = process.env.JIRA_EMAIL || '';
const jiraToken = process.env.JIRA_API_TOKEN || '';
const acceptanceCriteriaField = process.env.JIRA_ACCEPTANCE_CRITERIA_FIELD || '';

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(JSON.stringify(payload, null, 2));
}

function adfToText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(adfToText).filter(Boolean).join('\n');
  if (typeof value !== 'object') return '';
  const ownText = typeof value.text === 'string' ? value.text : '';
  const children = Array.isArray(value.content) ? value.content.map(adfToText).filter(Boolean).join(value.type === 'paragraph' ? ' ' : '\n') : '';
  return [ownText, children].filter(Boolean).join(ownText && children ? ' ' : '').trim();
}

function fieldToText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(fieldToText).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    if (value.value) return String(value.value);
    if (value.name) return String(value.name);
    if (value.displayName) return String(value.displayName);
    return adfToText(value);
  }
  return String(value);
}

function normalizeJiraIssue(issue) {
  const fields = issue.fields || {};
  const comments = fields.comment?.comments || [];
  const acceptanceCriteria = acceptanceCriteriaField ? fieldToText(fields[acceptanceCriteriaField]) : '';
  const linkedIssues = (fields.issuelinks || [])
    .map((link) => link.outwardIssue || link.inwardIssue)
    .filter(Boolean)
    .map((linked) => `${linked.key}: ${linked.fields?.summary || ''}`.trim());

  return {
    key: issue.key,
    summary: fields.summary || '',
    status: fields.status?.name || '',
    issueType: fields.issuetype?.name || '',
    parent: fields.parent ? `${fields.parent.key}: ${fields.parent.fields?.summary || ''}`.trim() : '',
    labels: fields.labels || [],
    components: (fields.components || []).map((component) => component.name).filter(Boolean),
    description: adfToText(fields.description),
    acceptanceCriteria,
    linkedIssues,
    comments: comments.slice(-5).map((comment) => ({
      author: comment.author?.displayName || 'Unknown',
      created: comment.created || '',
      body: adfToText(comment.body)
    })).filter((comment) => comment.body),
    jiraContext: [
      `${issue.key}: ${fields.summary || ''}`,
      fields.status?.name ? `Status: ${fields.status.name}` : '',
      fields.issuetype?.name ? `Type: ${fields.issuetype.name}` : '',
      fields.parent ? `Parent: ${fields.parent.key}: ${fields.parent.fields?.summary || ''}` : '',
      acceptanceCriteria ? `Acceptance criteria: ${acceptanceCriteria}` : '',
      linkedIssues.length ? `Linked issues: ${linkedIssues.join('; ')}` : '',
      fields.labels?.length ? `Labels: ${fields.labels.join(', ')}` : '',
      fields.components?.length ? `Components: ${fields.components.map((component) => component.name).join(', ')}` : ''
    ].filter(Boolean).join('\n'),
    designContext: adfToText(fields.description),
    decisionContext: comments.slice(-5).map((comment) => {
      const body = adfToText(comment.body);
      return body ? `${comment.author?.displayName || 'Unknown'}: ${body}` : '';
    }).filter(Boolean).join('\n'),
    apiContext: ''
  };
}

async function fetchJiraIssue(issueKey) {
  if (!jiraBaseUrl || !jiraEmail || !jiraToken) {
    const missing = [
      !jiraBaseUrl ? 'JIRA_BASE_URL' : '',
      !jiraEmail ? 'JIRA_EMAIL' : '',
      !jiraToken ? 'JIRA_API_TOKEN' : ''
    ].filter(Boolean).join(', ');
    const error = new Error(`Jira server is not configured. Missing: ${missing}`);
    error.status = 500;
    throw error;
  }

  const fields = [
    'summary',
    'description',
    'status',
    'labels',
    'components',
    'issuetype',
    'parent',
    'issuelinks',
    'comment',
    acceptanceCriteriaField
  ].filter(Boolean).join(',');

  const url = `${jiraBaseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=${encodeURIComponent(fields)}&expand=renderedFields`;
  const auth = Buffer.from(`${jiraEmail}:${jiraToken}`).toString('base64');
  const response = await fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Jira request failed with ${response.status}: ${body.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }

  return normalizeJiraIssue(await response.json());
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true, jiraConfigured: Boolean(jiraBaseUrl && jiraEmail && jiraToken) });
    return;
  }

  const match = url.pathname.match(/^\/api\/jira\/issue\/([A-Za-z][A-Za-z0-9]+-\d+)$/);
  if (request.method === 'GET' && match) {
    try {
      const issue = await fetchJiraIssue(match[1].toUpperCase());
      sendJson(response, 200, issue);
    } catch (error) {
      sendJson(response, error.status || 500, { error: error.message || 'Unable to import Jira issue' });
    }
    return;
  }

  sendJson(response, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`Jira context server running at http://localhost:${port}`);
});
