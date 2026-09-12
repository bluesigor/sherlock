# Security reporting

Please do not disclose credentials, private source code, or exploitable vulnerability details in public issues.

Use GitHub private vulnerability reporting on this repository if it is available. If it is unavailable, open an issue requesting a private contact channel without including vulnerability details.

Sherlock is currently under active development. Security fixes target the current main branch; there is no maintained historical release series yet. Operators should retain their own backups and review deployment changes before upgrading.

Authentication-disabled instances expose indexed repositories and configured AI usage to anyone who can reach them. Keep local instances bound to localhost. Shared installations should use authentication, HTTPS, and appropriate network access controls. AI request limits are per server process; enforce deployment-wide spending limits through your gateway and provider account.
