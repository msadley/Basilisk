// apps/rest/src/profile/profile.controller.ts

import { type Request, type Response } from "express";
import { basilisk } from "../../index.js";
import { z } from "zod";

export const getProfile = async (_req: Request, res: Response) => {
  res.status(200).json(await basilisk.getProfile());
};

const updateProfileSchema = z.object({
  name: z.string().optional(),
  profilePicture: z.url().optional(),
});

export const setProfile = async (req: Request, res: Response) => {
  try {
    const { name, profilePicture } = updateProfileSchema.parse(req.body);

    if (name) {
      await basilisk.setName(name);
    }

    if (profilePicture) {
      await basilisk.setProfilePicture(profilePicture);
    }

    const updatedProfile = await basilisk.getProfile();
    res.status(200).json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.message });
    } else {
      throw error;
    }
  }
};
