# MVP Demo Deployment

## Demo Hosting

The current MVP is a frontend-only React/Vite app. It does not need a backend for the demo because these capabilities run in the browser:

- Solution-area selection
- Screenshot upload and OCR
- Technical spec generation
- Technical flow diagram generation
- Word `.docx` export
- ABC Consulting/customer logo embedding
- Template guidance capture
- Confluence-friendly copy
- Local form persistence

## GitHub Pages Deployment

This repo includes a GitHub Actions workflow:

```text
.github/workflows/deploy-demo.yml
```

The workflow builds the Vite app with `npm run build:pages` and deploys `dist/` to GitHub Pages whenever `main` is pushed. The Pages build uses relative asset paths so the demo works under the repository URL path. It can also be run manually from the GitHub Actions tab.

Expected demo URL after Pages is enabled:

```text
https://daljeetkohli-sap.github.io/Techspeccreator/
```

## One-Time GitHub Setup

In the GitHub repo, confirm:

1. Go to **Settings > Pages**.
2. Set **Build and deployment** source to **GitHub Actions**.
3. Go to **Actions** and confirm workflows are allowed.
4. Push to `main` or run **Deploy Demo** manually.

If the repo remains private, testers will need permission to access the repo and the GitHub Pages site may require GitHub authentication depending on organization/account settings.

## Backend Status

No backend is deployed for the MVP demo. Future backend/API work should be added when the app needs:

- Shared team workspaces
- Authentication
- Direct Confluence publishing
- Jira task creation
- GitHub/Azure DevOps repository scanning
- Persistent document/version storage
- Server-side AI or OCR processing

## Local Demo Fallback

If GitHub Pages is not enabled yet, testers can still run the app locally:

```bash
npm ci
npm run dev
```

Then open the local Vite URL shown in the terminal.

To test the GitHub Pages build locally:

```bash
npm run build:pages
```
