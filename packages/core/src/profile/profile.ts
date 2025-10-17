// packages/core/src/profile/profile.ts

import { getConfigField, overrideConfigField } from "./config.js";

export async function getName(): Promise<string> {
  return await getConfigField("name");
}

export async function setName(name: string) {
  await overrideConfigField("name", name);
}

export async function getProfilePicture(): Promise<string> {
  return await getConfigField("profilePicture");
}

export async function setProfilePicture(picture: string) {
  await overrideConfigField("profilePicture", picture);
}
