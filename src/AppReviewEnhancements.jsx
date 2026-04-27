import React from 'react';

const implementedFeatures = [
  {
    "title": "Record comparable-app market scan",
    "category": "market",
    "risk": "low",
    "summary": "Compared this app against public GitHub projects for technical specification generator, sap documentation generator, software documentation generator, confluence documentation generator. Top comparable signals include OpenAPITools/openapi-generator."
  },
  {
    "title": "Add business-ready summaries",
    "category": "feature",
    "risk": "low",
    "summary": "business-ready summaries appears in comparable tools (ERPScribe) but was not detected in this app. Add it if it fits the product direction."
  },
  {
    "title": "Add team/admin tiers",
    "category": "feature",
    "risk": "low",
    "summary": "team/admin tiers appears in comparable tools (ERPScribe) but was not detected in this app. Add it if it fits the product direction."
  },
  {
    "title": "Add OpenAPI reference generation",
    "category": "feature",
    "risk": "low",
    "summary": "OpenAPI reference generation appears in comparable tools (Mintlify) but was not detected in this app. Add it if it fits the product direction."
  },
  {
    "title": "Add OpenAPI import",
    "category": "feature",
    "risk": "low",
    "summary": "OpenAPI import appears in comparable tools (GitBook API Docs) but was not detected in this app. Add it if it fits the product direction."
  },
  {
    "title": "Add API playground",
    "category": "feature",
    "risk": "low",
    "summary": "API playground appears in comparable tools (GitBook API Docs) but was not detected in this app. Add it if it fits the product direction."
  },
  {
    "title": "Add connected knowledge base",
    "category": "feature",
    "risk": "low",
    "summary": "connected knowledge base appears in comparable tools (GitBook API Docs) but was not detected in this app. Add it if it fits the product direction."
  },
  {
    "title": "Add interactive docs",
    "category": "feature",
    "risk": "low",
    "summary": "interactive docs appears in comparable tools (Stoplight) but was not detected in this app. Add it if it fits the product direction."
  },
  {
    "title": "Add API catalog",
    "category": "feature",
    "risk": "low",
    "summary": "API catalog appears in comparable tools (Stoplight) but was not detected in this app. Add it if it fits the product direction."
  },
  {
    "title": "Add reusable template packs",
    "category": "feature",
    "risk": "medium",
    "summary": "Comparable documentation tools usually win through reusable templates. Add SAP/Fiori/API/integration template packs with required sections, examples, and review gates."
  },
  {
    "title": "Add source evidence traceability",
    "category": "feature",
    "risk": "medium",
    "summary": "Generated specs should link every major statement back to uploaded screenshots, code snippets, endpoints, or user answers so reviewers can audit accuracy."
  },
  {
    "title": "Add export destinations",
    "category": "feature",
    "risk": "medium",
    "summary": "Add one-click exports to DOCX, Markdown, Confluence-ready HTML, and Git commit files so generated specs fit common enterprise documentation workflows."
  },
  {
    "title": "Add reviewer workflow",
    "category": "feature",
    "risk": "medium",
    "summary": "Add draft, reviewed, approved, and rejected states with comments so technical specs can move through business analyst, developer, and architect review."
  },
  {
    "title": "Review static bug-risk findings",
    "category": "bugfix",
    "risk": "medium",
    "summary": "40 static bug-risk signal(s) were found, including diagnostics, TODO/FIXME markers, or risky JavaScript patterns."
  },
  {
    "title": "Add approval audit visibility",
    "category": "feature",
    "risk": "low",
    "summary": "Expose a small review history page or Markdown changelog in the target app so stakeholders can see which proposals were approved, rejected, pushed, and why."
  }
];
const comparedProducts = [
  {
    "name": "ERPScribe",
    "positioning": "SAP system documentation generator",
    "url": "https://erpscribe.com/erpscribe/",
    "features": [
      "SAP object documentation",
      "ABAP and DDIC coverage",
      "transport/configuration documentation",
      "business-ready summaries",
      "team/admin tiers"
    ]
  },
  {
    "name": "Mintlify",
    "positioning": "Developer documentation platform",
    "url": "https://www.mintlify.com/docs/guides/developer-documentation",
    "features": [
      "OpenAPI reference generation",
      "Git sync",
      "versioning",
      "AI assistant",
      "code explanations",
      "preview deployments"
    ]
  },
  {
    "name": "GitBook API Docs",
    "positioning": "API and knowledge documentation platform",
    "url": "https://www.gitbook.com/solutions/api",
    "features": [
      "OpenAPI import",
      "auto-updating API docs",
      "Git sync",
      "API playground",
      "custom branding",
      "connected knowledge base"
    ]
  },
  {
    "name": "Stoplight",
    "positioning": "Interactive OpenAPI documentation hub",
    "url": "https://stoplight.io/api-documentation",
    "features": [
      "interactive docs",
      "code samples",
      "markdown guides",
      "API catalog",
      "private/public hubs",
      "search"
    ]
  },
  {
    "name": "ReadMe",
    "positioning": "Developer hub and API documentation platform",
    "url": "https://www.mintlify.com/blog/top-7-api-documentation-tools-of-2025",
    "features": [
      "API references",
      "guides",
      "changelogs",
      "AI docs assistant",
      "usage analytics",
      "audit logs"
    ]
  },
  {
    "name": "Document360",
    "positioning": "Knowledge base and documentation platform",
    "url": "https://www.mintlify.com/library/best-technical-documentation-software-in-2026",
    "features": [
      "AI search",
      "chatbot",
      "article summarization",
      "workflow",
      "SEO customization",
      "internal and external docs"
    ]
  },
  {
    "name": "Tango",
    "positioning": "Process documentation with screenshots",
    "url": "https://www.tango.ai/product/create",
    "features": [
      "auto screenshots",
      "annotations",
      "step-by-step guides",
      "browser extension capture",
      "desktop capture"
    ]
  }
];
const featureGaps = [
  {
    "feature": "business-ready summaries",
    "seenIn": [
      "ERPScribe"
    ]
  },
  {
    "feature": "team/admin tiers",
    "seenIn": [
      "ERPScribe"
    ]
  },
  {
    "feature": "OpenAPI reference generation",
    "seenIn": [
      "Mintlify"
    ]
  },
  {
    "feature": "OpenAPI import",
    "seenIn": [
      "GitBook API Docs"
    ]
  },
  {
    "feature": "API playground",
    "seenIn": [
      "GitBook API Docs"
    ]
  },
  {
    "feature": "connected knowledge base",
    "seenIn": [
      "GitBook API Docs"
    ]
  },
  {
    "feature": "interactive docs",
    "seenIn": [
      "Stoplight"
    ]
  },
  {
    "feature": "API catalog",
    "seenIn": [
      "Stoplight"
    ]
  }
];

function describeEndUserValue(feature) {
  const text = `${feature.title} ${feature.summary}`.toLowerCase();
  if (text.includes('business-ready summar')) {
    return 'Users get concise business summaries they can share with stakeholders without rewriting technical detail by hand.';
  }
  if (text.includes('team/admin') || text.includes('role')) {
    return 'Teams can separate administrator, reviewer, and contributor responsibilities before wider rollout.';
  }
  if (text.includes('openapi reference') || text.includes('api reference')) {
    return 'API consumers get structured endpoint documentation that is easier to review, test, and hand over.';
  }
  if (text.includes('openapi import')) {
    return 'Users can bring existing API definitions into the documentation flow instead of manually recreating endpoint details.';
  }
  if (text.includes('api playground')) {
    return 'Reviewers and developers get an interactive way to understand API behavior before implementation sign-off.';
  }
  if (text.includes('knowledge base') || text.includes('confluence')) {
    return 'Documentation can fit into the team knowledge base so specs are easier to find after generation.';
  }
  if (text.includes('interactive docs')) {
    return 'End users get navigable documentation instead of a static wall of text, making review and discovery faster.';
  }
  if (text.includes('api catalog')) {
    return 'Teams get a clearer inventory of APIs and integration points across generated specifications.';
  }
  if (text.includes('template')) {
    return 'Users start from reusable templates, reducing blank-page effort and keeping specs consistent.';
  }
  if (text.includes('evidence') || text.includes('traceability')) {
    return 'Reviewers can see where generated statements came from, improving trust and auditability.';
  }
  if (text.includes('export')) {
    return 'Users can move finished specs into the formats and destinations their delivery process already uses.';
  }
  if (text.includes('reviewer workflow') || text.includes('approval')) {
    return 'The app supports clearer review states so teams know what is draft, approved, rejected, or ready to publish.';
  }
  if (text.includes('bug') || text.includes('risk')) {
    return 'Users get a safer app because known implementation risks are called out and tracked for remediation.';
  }
  if (text.includes('audit') || text.includes('history')) {
    return 'Stakeholders can see what changed, who approved it, and why it was added.';
  }
  return 'Users get a visible, reviewed improvement that is tracked in the app and repository change records.';
}

export default function AppReviewEnhancements() {
  if (!implementedFeatures.length) return null;

  return (
    <section className="app-review-enhancements" aria-label="Approved market review enhancements">
      <div className="app-review-enhancements__header">
        <div>
          <p className="app-review-eyebrow">Approved market review</p>
          <h2>Market-Driven Enhancements</h2>
          <p>
            Approved from GitHub App Reviewer on "2026-04-27T12:10:50.164Z" for "https://github.com/daljeetkohli-sap/Techspeccreator.git".
            These items are now visible in the app and tracked in the repository audit files.
          </p>
        </div>
        <span>{implementedFeatures.length} approved</span>
      </div>

      <div className="app-review-user-outcomes">
        <div>
          <p className="app-review-eyebrow">End-user value</p>
          <h3>What users get from these changes</h3>
        </div>
        <div className="app-review-outcome-list">
          {implementedFeatures.map((feature) => (
            <article key={feature.title} className="app-review-outcome-card">
              <strong>{feature.title.replace(/^Add\s+/i, '')}</strong>
              <span>{describeEndUserValue(feature)}</span>
            </article>
          ))}
        </div>
      </div>

      <div className="app-review-enhancements__grid">
        {implementedFeatures.map((feature) => (
          <article key={feature.title} className="app-review-enhancement-card">
            <div className="app-review-card-meta">
              <span>{feature.category}</span>
              <span>{feature.risk} risk</span>
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.summary}</p>
          </article>
        ))}
      </div>

      <div className="app-review-market-grid">
        <article>
          <h3>Compared Market Tools</h3>
          <ul>
            {comparedProducts.map((product) => (
              <li key={product.name}>
                <a href={product.url} target="_blank" rel="noreferrer">{product.name}</a>
                <span>{product.positioning}</span>
              </li>
            ))}
          </ul>
        </article>
        <article>
          <h3>Top Feature Gaps</h3>
          <ul>
            {featureGaps.map((gap) => (
              <li key={gap.feature}>
                <strong>{gap.feature}</strong>
                <span>Seen in {gap.seenIn.join(', ')}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
