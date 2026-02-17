import { useAuth } from "@clerk/clerk-react";
import { useMemo } from "react";
import {
  createBooksApi,
  createCheckoutsApi,
  createSearchApi,
  createAuthApi,
  createAiApi,
} from "../lib/api";

export function useApi() {
  const { getToken } = useAuth();
  const getTokenFn = useMemo(() => () => getToken(), [getToken]);
  return useMemo(
    () => ({
      books: createBooksApi(getTokenFn),
      checkouts: createCheckoutsApi(getTokenFn),
      search: createSearchApi(getTokenFn),
      auth: createAuthApi(getTokenFn),
      ai: createAiApi(getTokenFn),
    }),
    [getTokenFn]
  );
}
