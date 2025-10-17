<img src="assets/banner.jpeg" alt="basilisk banner" align="center"/>

<br/>

A peer-to-peer chat app built on top of libp2p, using TypeScript.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v23 or higher)
- npm

### Installing

1. Clone the repo:

   ```sh
   git clone https://github.com/msadley/basilisk.git
   ```

2. Install NPM packages:

   ```sh
   npm install
   ```

3. Build the project:

   ```sh
   npm run build
   ```

## Usage

### Relay

The relay is a public node that other nodes can use to discover each other. To run the relay, use the following command:

```sh
npm run relay
```

## Available Scripts

- `build`: Builds the project.
- `cli`: Runs the CLI app.
- `relay`: Runs the relay.
- `clean`: Removes the log files.
