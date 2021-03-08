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

## Environment variables

Check the file [`env-config.js`][env-config.js] for a full featured list of the environment vars used when exporting the project.

## Dockerfile

The dockerfile provided builds and serves the static files of the manager.

With this dockerfile you can manually change any of the defined values to build your own manager, pointing wherever you want it to point:

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

If you only plan on serving the project, we create a set of images from this Dockerfile:

- `latest` and `master`: These images are created from `master` branch and have the latest development updates. They point to our development environment and use goerli for the ethereum transactions.
- `stage`: these are created from `stage` and have a more stable version than `master`, but still not production ready. They point to our stage environment and use `xdai` for the ethereum transactions
- `release-*`: the most stable ones, used specifically for production environments. They point to our production infrastructure and use xdai for the ethereum transactions.
- All of the previous images have an `app-` alias, which is the same build but without the bootnodes RW url set, meaning you can't use those images for things that require writing things to the blockchain (so they're only for viewing data)


[next.config.js]: ./next.config.js
[env-config.js]: ./env-config.js

[issues]: https://github.com/vocdoni/vocdoni-manager-frontend/issues
[stargazers]: https://github.com/vocdoni/vocdoni-manager-frontend/stargazers
[actions]: https://github.com/vocdoni/vocdoni-manager-frontend/actions
