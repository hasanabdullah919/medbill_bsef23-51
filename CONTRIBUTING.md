# MedBill Contribution Workflow

This workflow keeps MedBill development traceable and supports the FYDP requirement for a designated stable branch, feature branches, meaningful commits and review before release.

## Branches

- `main` is the stable branch used for published releases and submission documents.
- `testing` is the integration branch for work that is not yet ready for `main`.
- `feature/<story-id>-<short-name>` is used for a backlog story, for example `feature/USR-01-user-management`.
- `fix/<issue-id>-<short-name>` is used for a verified defect.

Do not commit new feature work directly to `main`.

## Change Procedure

1. Update the intended base branch from GitHub.
2. Create a feature or fix branch with a descriptive name.
3. Make one logical change at a time and avoid committing secrets, real patient data, dependencies or build output.
4. Run the checks relevant to the change:

   ```bash
   npm run lint
   npm run build
   npm test
   ```

5. Commit with a clear message such as `feat(claims): add patient search` or `fix(auth): reject expired sessions`.
6. Push the branch and open a pull request. Normal feature work targets `testing`; a release pull request promotes verified integration work from `testing` to `main`.
7. Record the linked story, acceptance criterion, test evidence and any remaining limitation in the pull request.
8. Merge only after review and successful checks. Keep the pull-request history as project evidence.

## Pull Request Checklist

- The change matches a backlog story or documented correction.
- The acceptance criterion is stated and verified.
- No credentials, secrets or real patient information are included.
- Documentation and synthetic fixtures are updated when behavior changes.
- Relevant lint, build, migration and browser checks pass.
- The target branch is correct and the diff contains no unrelated files.
