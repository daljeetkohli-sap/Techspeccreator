const implementedFeatures = [
  {
    "title": "Add business-ready summaries",
    "category": "feature",
    "risk": "low",
    "summary": "business-ready summaries appears in comparable tools (ERPScribe) but was not detected in this app. Add it if it fits the product direction."
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

export default function AppReviewEnhancements() {
  if (!implementedFeatures.length) return null;

  return (
    <section className="app-review-enhancements" aria-label="Approved market review enhancements">
      <div className="app-review-enhancements__header">
        <div>
          <p className="app-review-eyebrow">Approved market review</p>
          <h2>Market-Driven Enhancements</h2>
          <p>
            Approved from GitHub App Reviewer on "2026-04-27T10:56:25.581Z" for "https://github.com/daljeetkohli-sap/Techspeccreator".
            These items are now visible in the app and tracked in the repository audit files.
          </p>
        </div>
        <span>{implementedFeatures.length} approved</span>
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
