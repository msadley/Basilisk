import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { type Profile } from "../types";

interface UserContextType {
  profile: Profile | null;
  isProfileLoading: boolean;
  profileError: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileLoading, setIsLoading] = useState(true);
  const [profileError, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("http://localhost:3001/profile");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const profileData: Profile = await response.json();
        setProfile(profileData);
      } catch (e) {
        setError(
          e instanceof Error ? e : new Error("An unknown error occurred")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const value = useMemo(
    () => ({
      profile,
      isProfileLoading,
      profileError,
    }),
    [profile, isProfileLoading, profileError]
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
