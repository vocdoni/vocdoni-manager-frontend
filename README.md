# Vocdoni Manager

[![GitHub stars](https://img.shields.io/github/stars/vocdoni/vocdoni-manager-frontend)][stargazers]
[![GitHub issues](https://img.shields.io/github/issues/vocdoni/vocdoni-manager-frontend)][issues]
[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/vocdoni/vocdoni-manager-frontend/Main)][actions]

Static web site project to manage Vocdoni entities and explore their contents. It also defines the mobile app settings for deep link handling and allows voting via web.

## Supported paths

Check the [`next.config.js`][next.config.js] file for a full list of the routes. You'll see them split in two:

- Public: those only accessible in read-only mode.
- Private: only accessible in write mode (and with the wallet already unlocked).

## Standalone Ethereum wallets

A few management workflows need the signature of multiple transactions and payloads, which may lead to a bad user experience.

To mitigate this, the frontend creates a Standalone Web3 Wallet that is present in memory only. For it to be restored, users need the seed and the passphrase to unlock it.

## Deep linking

- `public/.well-known` needs to contain the latest versions of the files contained on the repo `client-mobile > linking > *`

## Environment variables

At build time, the following env vars are read:

- `NODE_ENV`
    - When set to `production`, disabled the development mode
- `ETH_NETWORK_ID`
    - By default set to `xdai`
- `BOOTNODES_URL_READ_ONLY`
    - The bootnode URL used for regular user requests
- `BOOTNODES_URL_RW`
    - The bootnode URL used for entity related requests
    - App is set in **read only mode** when this field's empty
- `APP_LINKING_DOMAIN`
    - The domain used for universal links triggering the app (if available)
    - Set to `vocdoni.link` by default
- `REGISTER_URL`
    - The endpoint where new organizations will point app users to register to
- `ACTION_VISIBILITY_URL`
    - The endpoint where new organizations will tell app users to check their registration status

Check the file [`env-config.js`][env-config.js] for a full featured list of the environment vars.

## Dockerfile

A Dockerfile is provided for convenience. The image it creates is not meant to serve the frontend, but to **export** it.

Exportation allows to pass environment variables, which would not be available if the site was already exported.

```sh
# Pull the image
docker volume create manager-frontend
# Create a volume to hold the frontend files
docker pull vocdoni/manager-frontend:release
# Compile the frontend with your own settings
docker run --rm -it -e "REGISTER_URL=https://localhost:12345/registry" -v manager-frontend:/app/build vocdoni/manager-frontend:release
# Serve it
docker run --rm -it -v manager-frontend:/usr/share/nginx/html:ro -p 8000:80 nginx
```


[next.config.js]: ./next.config.js
[env-config.js]: ./env-config.js

[issues]: https://github.com/vocdoni/vocdoni-manager-frontend/issues
[stargazers]: https://github.com/vocdoni/vocdoni-manager-frontend/stargazers
[actions]: https://github.com/vocdoni/vocdoni-manager-frontend/actions
