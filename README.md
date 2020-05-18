# Vocdoni Manager

Static web site project to manage Vocdoni entities and explore their contents. It also defines the mobile app settings for deep link handling.

## Supported paths

Important: The URL paths must not end with `/` or NextJS will trigger full reloads and the current wallet will be lost.

- `/entities#/<entity-id>`
- `/entities/edit#/<entity-id>`
- `/entities/new`
- `/posts#/<entity-id>`
- `/posts/edit#/<entity-id>/<post-id>`
- `/posts/new`
- `/processes#/<entity-id>/<process-id>`
- `/processes/active#/<entity-id>`
- `/processes/ended#/<entity-id>`
- `/processes/new`

## Standalone Ethereum wallets

A few management workflows need the signature of multiple transactions and payloads, which may lead to a bad user experience.

To mitigate this, the frontend creates a Standalone Web3 Wallet that is present in memory only. For it to be restored, users need the seed and the passphrase to unlock it.

## Deep linking

- `public/.well-known` needs to contain the latest versions of the files contained on the repo `client-mobile > linking > *`
