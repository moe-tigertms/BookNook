import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "./useApi";
import type { User } from "../types";

export function useUser() {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return;
    }
    api.auth
      .me()
      .then((u) => setUser(u as User))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [isSignedIn, api.auth]);

  return { user, loading };
}
