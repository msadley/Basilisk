// packages/core/src/profile/profile.ts

import { log } from "@basilisk/utils";
import { getConfigField, overrideConfigField } from "./config.js";

export async function getId() {
  await log("INFO", "Getting profile id...");
  return await getConfigField("profile.id");
}

export async function setId(id: string) {
  await overrideConfigField("profile.id", id);
}

async function getName(): Promise<string> {
  return await getConfigField("profile.name");
}

async function setName(name: string) {
  await overrideConfigField("profile.name", name);
}

async function getAvatar(): Promise<string> {
  return await getConfigField("profile.avatar");
}

async function setAvatar(picture: string) {
  await overrideConfigField("profile.avatar", picture);
}

export async function getProfile() {
  return {
    id: await getId(),
    name: await getName(),
    avatar: await getAvatar(),
  };
}

export async function setProfile(name?: string, avatar?: string) {
  if (name) await setName(name);
  if (avatar) await setAvatar(avatar);
}
