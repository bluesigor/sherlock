# Sherlock provenance

Sherlock starts from Sourcebot v3.0.4:

- Upstream: https://github.com/sourcebot-dev/sourcebot
- Sourcebot commit: c201a5e1a976002c565f21fb723c4ad51ef38000
- Zoekt commit: cf456394003dd9bfc9a885fdfcc8cc80230a261d
- Zoekt upstream: https://github.com/sourcebot-dev/zoekt

Sourcebot's original MIT license and copyright notice are preserved in LICENSE. Zoekt's Apache-2.0 license is preserved in vendor/zoekt/LICENSE. Other dependencies retain their respective licenses.

This repository has fresh Git history. The historical Sourcebot Enterprise code and later FSL changes were not imported. Zoekt is a vendored source snapshot, not a Git submodule; review licensing and record a new revision here before updating it.

The starting Makefile includes the local Go 1.23.4 toolchain pin and PATH quoting fix from the reviewed Sourcebot checkout. No local credentials, application data, installed dependencies, or compiled artifacts were copied. The upstream tracked .env.development template is included; keep private overrides in ignored .env.development.local.

## Development

Install prerequisites described in CONTRIBUTING.md, then run `make` to install dependencies and build Zoekt. Configure a separate development database and Redis instance before running `yarn dev`; do not reuse an existing newer Sourcebot database for this older version.

Before publishing a product, adapt branding and upstream deployment references, verify the exact dependencies and release image, and package the required third-party notices and applicable source materials. This historical source selection is not a complete dependency or trademark clearance.
