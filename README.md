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

- Node.js (v22 or higher)
- npm
- docker(\*)

\*Makes setting up your own relay a lot easier

### Instructions

1. Clone the repo:

   ```sh
   git clone https://github.com/msadley/basilisk.git
   ```

2. Install the npm project dependencies:

   ```sh
   npm install
   ```

3. Build the project:

   ```sh
   npm run build
   ```

## Running

Before proceding, make sure to set the variables in the .env file as specified in the example:

```sh
# .env.example

# Specify the public DNS of the relay server here
PUBLIC_DNS="your-dns.com"

# Specify the relay address used by the frontend here
VITE_BOOTSTRAP_MULTIADDRS="/dns4/your-dns.com/tcp/443/wss/p2p/12D3KooWS..."
```

### Relay

To set up your own circuit-relay server, just start the docker file inside the apps/relay directory using:

```sh
$ docker compose up
```

The relay will then log its public addresses which can be used by the vite frontend.

### Frontend

To run the frontend in development mode, you can run:

```sh
npm run vite
```

To build the website files for deployment, navigate to apps/web and run:

```sh
npm run build
```

The build files will be located at _apps/web/dist_.
