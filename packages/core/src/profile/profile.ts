// packages/core/src/profile/profile.ts

import { getConfigField, overrideConfigField } from "./config.js";

export async function getNickname(): Promise<string> {
  return await getConfigField("nickname");
}

export async function setNickname(nickname: string) {
  await overrideConfigField("nickname", nickname);
}

export async function getProfilePicture(): Promise<string> {
  return await getConfigField("profilePicture");
}

export async function setProfilePicture(picture: string) {
  await overrideConfigField("profilePicture", picture);
}