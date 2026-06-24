# Permanent Development Workflow

Default behavior:
DO NOT automatically:
* Commit to Git
* Push to GitHub
* Trigger Vercel deployment

All development should stop after local implementation.

Required output after every phase:
1. Files modified
2. SQL required (if any)
3. Local build result
4. Testing checklist
5. Known risks

Deployment workflow:
Only commit and push when I explicitly say:
APPROVED FOR RELEASE

Only prepare production deployment when I explicitly say:
DEPLOY TO PRODUCTION

Until those commands are given, keep all changes local only.
