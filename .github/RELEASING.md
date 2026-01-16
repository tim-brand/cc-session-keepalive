# Release Process

This project uses automated semantic versioning and releases based on conventional commits.

## How It Works

When you push commits to the `main` or `master` branch, the release workflow automatically:

1. **Analyzes commits** since the last release using conventional commit format
2. **Determines version bump**:
   - `major` (X.0.0): Breaking changes (e.g., `feat!:`, `BREAKING CHANGE:`)
   - `minor` (0.X.0): New features (e.g., `feat:`)
   - `patch` (0.0.X): Bug fixes and other changes (e.g., `fix:`, `chore:`, `docs:`)
3. **Creates a GitHub release** with auto-generated changelog
4. **Tags the release** (e.g., `v1.2.3`)
5. **Builds and pushes Docker images** with multiple tags:
   - `ghcr.io/<owner>/<repo>:1.2.3` (full version)
   - `ghcr.io/<owner>/<repo>:1.2` (major.minor)
   - `ghcr.io/<owner>/<repo>:1` (major)
   - `ghcr.io/<owner>/<repo>:latest`

## Conventional Commit Format

Use these prefixes in your commit messages:

- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build process or auxiliary tool changes
- `build:` - Build system changes

Add `!` after the type or include `BREAKING CHANGE:` in the commit body for breaking changes (triggers major version bump).

### Examples

```bash
# Minor version bump (new feature)
git commit -m "feat(keepalive): add retry logic for failed requests"

# Patch version bump (bug fix)
git commit -m "fix(auth): resolve token refresh race condition"

# Major version bump (breaking change)
git commit -m "feat(api)!: change response format to JSON:API spec"

# No version bump shown in changelog but included
git commit -m "docs: update deployment instructions"
```

## Manual Release

If you need to trigger a release manually:

1. Go to Actions tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Select the branch and run

## Checking Current Version

```bash
# Check the latest release tag
bun run version:check

# Or directly with git
git describe --tags --abbrev=0
```

## Docker Images

After each release, Docker images are automatically built for multiple platforms:
- `linux/amd64`
- `linux/arm64`

Pull the latest release:
```bash
docker pull ghcr.io/<owner>/<repo>:latest
```

Pull a specific version:
```bash
docker pull ghcr.io/<owner>/<repo>:1.2.3
```
