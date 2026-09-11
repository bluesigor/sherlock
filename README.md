# Sherlock

Search and explore code across your repositories, on your own infrastructure.

Sherlock indexes the repositories you point it at and makes them searchable by
regular expression and by symbol, across every branch you choose to index. It
runs entirely on your own hardware: no repository content, no query, and no
telemetry leaves the machine you deploy it on.

Sherlock is an independent project originating from **Sourcebot v3.0.4**, the
last release before Enterprise licensing was introduced. The original MIT
copyright and permission notice remain in [LICENSE](LICENSE). Third-party
components retain their own licenses, inventoried in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Exact revisions are recorded
in [FORK.md](FORK.md).

## What it does

- **Code hosts.** GitHub, GitLab, Gitea and Gerrit, each self-hosted or cloud.
  Whole groups and organizations sync recursively, filtered by topic, and with
  forks or archived repositories excluded.
- **Search.** Regular expressions, symbol lookup and filters over repository,
  language and file path, answered by a vendored
  [Zoekt](https://github.com/sourcebot-dev/zoekt).
- **Authentication.** Microsoft Entra ID, GitHub, Google, email codes, or email
  and password. Off by default; a single environment variable turns it on.
- **Configuration as a file.** Connections can live in a JSON file under version
  control instead of being clicked together in the UI. Sherlock re-reads it when
  it changes.

## Run locally

1. Install Node.js (at least 21.1.0), Yarn, Go, Universal Ctags, PostgreSQL, and
   a free-license Redis-compatible server. Use a separate database for Sherlock.
2. Run `make` to install the locked dependencies and build the vendored Zoekt
   search engine.
3. Copy `.env.development` to `.env.development.local`. Configure your database,
   Redis URL, authentication, and a private encryption key.
4. Configure repositories in `default-config.json`, or set `CONFIG_PATH` to your
   own file. The default configuration indexes no repositories.
5. Run `yarn dev` and open http://localhost:3000.

See [CONTRIBUTING.md](CONTRIBUTING.md) and the
[configuration documentation](docs/self-hosting/configuration.mdx).

## Connect a code host

A declarative configuration file describes what to index. To follow every
project in a GitLab group, including its subgroups:

```json
{
  "connections": {
    "my-gitlab": {
      "type": "gitlab",
      "url": "https://gitlab.example.com",
      "groups": ["my-group"],
      "token": { "env": "GITLAB_TOKEN" },
      "exclude": { "archived": true, "forks": true }
    }
  }
}
```

Point `CONFIG_PATH` at that file and provide `GITLAB_TOKEN` in the environment.
The token decides the scope of the index, and everything it can read becomes
searchable for every signed-in user — Sherlock does not mirror per-user
permissions from the code host. Use a dedicated service account with exactly the
read access you intend to expose, never a personal token.

Other code hosts follow the same shape; see
[declarative config](docs/self-hosting/more/declarative-config.mdx).

## Authentication

Set `SOURCEBOT_AUTH_ENABLED=true` and configure at least one provider. For
Microsoft Entra ID:

```
AUTH_ENTRA_CLIENT_ID=...
AUTH_ENTRA_CLIENT_SECRET=...
AUTH_ENTRA_TENANT_ID=...
AUTH_URL=https://sherlock.example.com
```

Register `<AUTH_URL>/api/auth/callback/microsoft-entra-id` as a redirect URI in
your application, and grant the delegated Microsoft Graph permissions `openid`,
`profile`, `email` and `User.Read`.

The first user to sign in owns the organization. Everyone who follows and was
vouched for by an identity provider joins as a member, which makes the identity
provider your access boundary — restrict who may sign in there. Email and
password accounts are the exception: that sign-up verifies no identity, so such
an account gains no access on its own and must be invited. Set
`AUTH_CREDENTIALS_LOGIN_ENABLED=false` to turn it off entirely.

Details in [authentication](docs/self-hosting/more/authentication.mdx).

## Build your own image

```sh
docker build -t sherlock:local .
```

Deploy that image with your own configuration and persistent storage. It starts
a PostgreSQL and a Redis instance internally unless external services are
configured, and keeps the index, the database and the cache under `/data` — mount
a volume there, or an update discards the index and re-clones everything.

Do not use upstream Sourcebot images for Sherlock. Fly templates require your own
unique application name. Registry publishing is manual.

## Identity and integrations

Sherlock has no configured public cloud, support mailbox, community server, or
update feed. The app links to local help. Analytics are disabled by default;
optional telemetry, error reporting and mail integrations require the operator's
own configuration. No upstream documentation analytics key is included. The
subscription and billing code of the hosted upstream product has been removed.

Internal `@sourcebot/*` package names, `SOURCEBOT_*` / `NEXT_PUBLIC_SOURCEBOT_*`
environment variables, and `.sourcebot` storage paths are retained for
compatibility. These are implementation identifiers, not product branding.
Database migration history and vendored source are intentionally preserved.

Documentation screenshots are inherited historical examples and may show upstream
branding; they are not Sherlock product screenshots. Before public distribution,
review third-party license obligations and your deployment's policies.
