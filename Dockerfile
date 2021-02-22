# Static web site compiler
FROM node:12 as build

ARG COMMIT_SHA
ENV COMMIT_SHA=${COMMIT_SHA}
ARG ETH_NETWORK_ID=goerli
ENV ETH_NETWORK_ID=${ETH_NETWORK_ID}
ARG BOOTNODES_URL_READ_ONLY
ENV BOOTNODES_URL_READ_ONLY=${BOOTNODES_URL_READ_ONLY}
ARG BOOTNODES_URL_RW
ENV BOOTNODES_URL_RW=${BOOTNODES_URL_RW}
ARG EXPLORER_URL
ENV EXPLORER_URL=${EXPLORER_URL}
ARG VOCDONI_ENVIRONMENT=dev
ENV VOCDONI_ENVIRONMENT=${VOCDONI_ENVIRONMENT}
ARG APP_LINKING_DOMAIN
ENV APP_LINKING_DOMAIN=${APP_LINKING_DOMAIN}
ARG REGISTER_URL
ENV REGISTER_URL=${REGISTER_URL}
ARG ACTION_VISIBILITY_URL
ENV ACTION_VISIBILITY_URL=${ACTION_VISIBILITY_URL}
ARG MANAGER_BACKEND_URI
ENV MANAGER_BACKEND_URI=${MANAGER_BACKEND_URI}
ARG MANAGER_BACKEND_PUB_KEY
ENV MANAGER_BACKEND_PUB_KEY=${MANAGER_BACKEND_PUB_KEY}

ADD . /app
WORKDIR /app
RUN npm install && npm run export

FROM node:12

RUN apt update && apt install nginx -y && apt clean

COPY --from=build /app /app

WORKDIR /app

ENTRYPOINT [ "/app/entrypoint.sh" ]
