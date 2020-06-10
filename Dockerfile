FROM node:12 AS builder
ARG BOOTNODES_URL_READ_ONLY
ENV BOOTNODES_URL_READ_ONLY=${BOOTNODES_URL_READ_ONLY}
ARG BOOTNODES_URL_RW
ENV BOOTNODES_URL_RW=${BOOTNODES_URL_RW}
ARG ETH_NETWORK_ID=goerli
ENV ETH_NETWORK_ID=${ETH_NETWORK_ID}
ADD . /app
WORKDIR /app
RUN npm install && npm run export

FROM nginx
RUN rm -Rf /usr/share/nginx/html
WORKDIR /usr/share/nginx/html
COPY --from=builder /app/build /usr/share/nginx/html
