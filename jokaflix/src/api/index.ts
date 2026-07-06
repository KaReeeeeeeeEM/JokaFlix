import { useQuery, type UseQueryOptions, type QueryKey } from "@tanstack/react-query";

type FetchOptions = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  body?: unknown;
  enabled?: boolean | undefined;
  queryKey?: QueryKey;
  signal?: AbortSignal;
};

async function fetcher<T>(options: FetchOptions): Promise<T> {
  const { url, method = "GET", headers, params, body, signal } = options;
  let fetchUrl = url;
  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    fetchUrl += (url.includes("?") ? "&" : "?") + query;
  }
  const res = await fetch(fetchUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useFetch<T = unknown>(
  options: FetchOptions,
  queryOptions?: Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn">
) {
  const { queryKey, enabled = true, ...fetchOptions } = options;
  const key = queryKey ?? [fetchOptions.url, fetchOptions.params, fetchOptions.body, fetchOptions.headers, fetchOptions.method];
  const query = useQuery<T, Error>({
    queryKey: key,
    queryFn: ({ signal }) => fetcher<T>({ ...fetchOptions, signal }),
    enabled,
    ...queryOptions,
  });
  return {
    ...query,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
