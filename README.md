# Sherlock

Search and explore code across your repositories, on your own infrastructure.

Sherlock is an independent project originating from **Sourcebot v3.0.4**, the last release before Enterprise licensing was introduced. The original MIT copyright and permission notice remain in [LICENSE](LICENSE). Third-party components retain their own licenses. Exact revisions are recorded in [FORK.md](FORK.md).

## Run locally

1. Install Node.js (at least 21.1.0), Yarn, Go, Universal Ctags, PostgreSQL, and a free-license Redis-compatible server. Use a separate database for Sherlock.
2. Run `make` to install the locked dependencies and build the vendored Zoekt search engine.
3. Copy `.env.development` to `.env.development.local`. Configure your database, Redis URL, authentication, and a private encryption key.
4. Configure repositories in `default-config.json`, or set `CONFIG_PATH` to your own file. The default configuration indexes no repositories.
5. Run `yarn dev` and open http://localhost:3000.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [configuration documentation](docs/self-hosting/configuration.mdx).

## Build your own image

```sh
docker build -t sherlock:local .
```

Deploy that image with your own configuration and persistent storage. The image starts a PostgreSQL and Redis instance unless external services are configured. Do not use upstream Sourcebot images for Sherlock. Fly templates require your own unique application name. Registry publishing is manual and targets the current GitHub repository.

## Identity and integrations

Sherlock has no configured public cloud, support mailbox, community server, or update feed. The app links to local help. Analytics are disabled by default; optional telemetry, error reporting, mail, and billing integrations require the operator’s own configuration. No upstream documentation analytics key is included.

Internal `@sourcebot/*` package names, `SOURCEBOT_*` / `NEXT_PUBLIC_SOURCEBOT_*` environment variables, and `.sourcebot` storage paths are retained for compatibility. These are implementation identifiers, not product branding. Database migration history and vendored source are intentionally preserved.

Documentation screenshots are inherited historical examples and may show upstream branding; they are not Sherlock product screenshots. Before public distribution, review third-party license obligations and your deployment’s policies.
