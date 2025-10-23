import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { SystemEvent, Profile } from "@basilisk/core";

const worker = new Worker(new URL("../worker/worker.js", import.meta.url), {
  type: "module",
});

interface UserContextType {
  profile: Profile | null;
  isProfileLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoading, setIsLoading] = useState(true);

  useEffect(() => {
    worker.postMessage({
      type: "self-profile",
    });
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<SystemEvent>) => {
      const { type, payload } = event.data;

      switch (type) {
        case "self-profile-sent":
          setProfile(payload.profile);
          setIsLoading(false);
          break;

        default:
          break;
      }
    };
    worker.addEventListener("message", handleMessage);

    return () => {
      worker.removeEventListener("message", handleMessage);
    };
  });

  const value = useMemo(
    () => ({
      profile,
      isProfileLoading,
    }),
    [profile, isProfileLoading]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
