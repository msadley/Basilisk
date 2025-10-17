// apps/rest/src/profile/profile.controller.ts

import { type Request, type Response } from "express";
import { basilisk } from "../../index.js";

export const getProfile = async (_req: Request, res: Response) => {
  res.status(200).json(await basilisk.getProfile());
};

export const setProfile = async (req: Request, res: Response) => {
  const { name, profilePicture } = req.body;

  if (name) {
    await basilisk.setName(name);
  }

  if (profilePicture) {
    await basilisk.setProfilePicture(profilePicture);
  }

  const updatedProfile = await basilisk.getProfile();
  res.status(200).json(updatedProfile);
};
