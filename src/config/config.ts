// src/config/config.ts

interface Config {
  privateKey: string;
  savedAddresses: string[];
}

export const defaultConfig = (): Config => ({
  privateKey: "to-be-generated",
  savedAddresses: ["ipv4/"],
});
