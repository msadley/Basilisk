<img src="assets/banner.jpeg" alt="basilisk banner" align="center"/>

<br/>

<div align="center">
  <a href="https://basilisk.ddns.net">
   <img src="https://img.shields.io/badge/LIVE_DEMO-Visit_Website-5e5e5e?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Live Demo" height="30">
  </a>
</div>

<br/>

A peer-to-peer chat app built on top of libp2p, using TypeScript.

## Building from source

### Requirements

- Node.js (`26.x`)
- pnpm

A `docker-compose.yaml` file is provided at the repository root to set up your own relay server.

### Instructions

1. Clone the repo:

   ```sh
   git clone https://github.com/msadley/basilisk.git
   ```

2. Install the project dependencies:

   ```sh
   pnpm install
   ```

3. Build the project:

   ```sh
   pnpm build
   ```

## Running

Before proceeding, make sure to set the variables in `.env` as specified in `.env.example`:

```sh
# .env.example

# Specify the public DNS of the relay server here
PUBLIC_DNS="your-dns.com"

# Specify the relay address used by the frontend here
VITE_RELAY_MULTIADDRESS="/dns4/your-dns.com/tcp/443/wss/p2p/12D3KooWS..."
```

### Relay

To set up your own circuit-relay server, start the relay service from the repository root using:

```sh
docker compose --profile relay up
```

The relay will then log its public addresses which can be used by the Vite frontend.

### Frontend

To run the frontend in development mode, you can run:

```sh
pnpm vite
```

To build the website files for deployment, run:

```sh
pnpm --filter web build
```

The build files will be located at _apps/web/dist_.
