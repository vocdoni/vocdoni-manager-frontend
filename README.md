# Vocdoni Manager

[![GitHub stars][stargazers badge]][stargazers]
[![GitHub issues][issues badge]][issues]
[![GitHub Workflow Status][actions badge]][actions]
[![i18n status][i18n badge]][weblate project]

Static web site project to manage Vocdoni entities and explore their contents. It also defines the mobile app settings for deep link handling and allows voting via web.

## Supported paths

Check the [`next.config.js`][next.config.js] file for a full list of the routes. You'll see them split in two:

- Public: those only accessible in read-only mode.
- Private: only accessible in write mode (and with the wallet already unlocked).

## Standalone Ethereum wallets

A few management workflows need the signature of multiple transactions and payloads, which may lead to a bad user experience.

To mitigate this, the frontend creates a Standalone Web3 Wallet that is present in memory only. For it to be restored, users need the seed and the passphrase to unlock it.

## Environment variables

Check the file [`env-config.js`][env-config.js] for a full featured list of the environment vars used when exporting the project.

## Dockerfile

The dockerfile provided builds and serves the static files of the manager.

With this dockerfile you can manually change any of the defined values to build your own manager, pointing wherever you want it to point:

```sh
docker build \
    --build-arg=VOCDONI_ENVIRONMENT=dev \
    --build-arg=ETH_NETWORK_ID=goerli \
    --build-arg=REGISTER_URL=https://manager.dev.vocdoni.net/api/registry \
    --build-arg=ACTION_VISIBILITY_URL=https://manager.dev.vocdoni.net/api/registry
    -t custom-manager-build
# serve it!
docker run --rm -it -p 8000:80 custom-manager-build
```

If you only plan on serving the project, we create a set of images from this Dockerfile:

- `latest` and `master`: These images are created from `master` branch and have the latest development updates. They point to our development environment and use goerli for the ethereum transactions.
- `stage`: these are created from `stage` and have a more stable version than `master`, but still not production ready. They point to our stage environment and use `xdai` for the ethereum transactions
- `release-*`: the most stable ones, used specifically for production environments. They point to our production infrastructure and use xdai for the ethereum transactions.
- All of the previous images have an `app-` alias, which is the same build but without the bootnodes RW url set, meaning you can't use those images for things that require writing things to the blockchain (so they're only for viewing data)

```sh
# Serve any of the alread built images with a single line
docker run --rm -it -p 8000:80 vocdoni/vocdoni-manager-frontend:app-latest
```

[actions badge]: https://img.shields.io/github/workflow/status/vocdoni/vocdoni-manager-frontend/Main.svg
[i18n badge]: https://hosted.weblate.org/widgets/vocdoni/-/manager-frontend/svg-badge.svg
[issues badge]: https://img.shields.io/github/issues/vocdoni/vocdoni-manager-frontend.svg
[stargazers badge]: https://img.shields.io/github/stars/vocdoni/vocdoni-manager-frontend.svg

[next.config.js]: ./next.config.js
[env-config.js]: ./env-config.js

[issues]: https://github.com/vocdoni/vocdoni-manager-frontend/issues
[stargazers]: https://github.com/vocdoni/vocdoni-manager-frontend/stargazers
[actions]: https://github.com/vocdoni/vocdoni-manager-frontend/actions
[weblate project]: https://hosted.weblate.org/projects/vocdoni/manager-frontend/
