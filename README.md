# Basilisk

A chat app built on top of libp2p, using TypeScript.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v18 or higher)
* npm

### Installing

1. Clone the repo:

   ```sh
   git clone https://github.com/your-username/basilisk.git
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

### CLI

The CLI is the main interface for the chat app. To run the CLI, use the following command:

```sh
npm run cli
```

## Available Scripts

* `build`: Builds the project.
* `prep`: Installs dependencies and builds the project.
* `cli`: Runs the CLI app.
* `relay`: Runs the relay.
* `debug-cli`: Runs the CLI app with debug logs.
* `debug-relay`: Runs the relay with debug logs.
* `clean`: Removes the log files.
* `reset`: Removes the config files.

## Project Structure

This project is a monorepo, with the following structure:

* `apps`: Contains the `cli` and `relay` applications.
* `packages`: Contains the `core` and `utils` packages.
  * `core`: Contains the core logic of the application.
  * `utils`: Contains utility functions used by the other packages.
