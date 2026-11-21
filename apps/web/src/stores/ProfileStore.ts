import type { Profile } from "@basilisk/core";
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { workerController } from "../worker/workerController";
import { queryKeys } from "./keys";

export type PatchProfileInput = {
  name?: string | null;
  avatar?: Uint8Array | null;
};

/** Updates cached profile entries across the single-profile and profile-list caches. */
export const upsertProfileInCache = (
  client: QueryClient,
  profile: Profile,
) => {
  client.setQueryData(queryKeys.profile(profile.id), profile);
  client.setQueryData<Profile[]>(queryKeys.profiles, (old) => {
    if (!old) return old;
    const exists = old.some((existing) => existing.id === profile.id);
    return exists
      ? old.map((existing) =>
          existing.id === profile.id ? profile : existing,
        )
      : [...old, profile];
  });
};

export const useProfiles = () => {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: async (): Promise<Profile[]> => {
      return workerController.services.profileService.list();
    },
  });
};

export const useUserProfile = () => {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: async (): Promise<Profile> => {
      return workerController.services.profileService.getUserProfile();
    },
  });
};

export const isResolvedProfile = (
  profile?: Profile | null,
): profile is Profile =>
  Boolean(profile && (Boolean(profile.name?.trim()) || profile.avatar !== null));

export const useProfile = (peerId?: string) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.profile(peerId ?? ""),
    enabled: Boolean(peerId),
    queryFn: async (): Promise<Profile | null> => {
      if (!peerId) return null;

      const local =
        await workerController.services.profileService.getById(peerId);
      if (isResolvedProfile(local)) {
        return local;
      }

      try {
        return await workerController.services.profileService.fetchPeerProfile(
          peerId,
        );
      } catch {
        return local ?? null;
      }
    },
    initialData: () => {
      if (!peerId) return undefined;
      const cached = queryClient
        .getQueryData<Profile[]>(queryKeys.profiles)
        ?.find((profile) => profile.id === peerId);
      return isResolvedProfile(cached) ? cached : undefined;
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PatchProfileInput) => {
      return workerController.services.profileService.update(
        data.avatar,
        data.name,
      );
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.userProfile, updatedProfile);
      upsertProfileInCache(queryClient, updatedProfile);
    },
  });
};
