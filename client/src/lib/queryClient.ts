import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  endpoint: string,
  options?: RequestInit | Record<string, any>
): Promise<any> {
  // Handle both formats:
  // apiRequest("/api/endpoint") 
  // apiRequest("/api/endpoint", { method: "POST", body: JSON.stringify({...}) })
  
  let url = endpoint;
  let config: RequestInit = { credentials: "include" };
  
  if (options) {
    if ('method' in options) {
      // This is already a RequestInit object
      config = { 
        ...config,
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json'
        }
      };
    } else {
      // This is data to be sent with POST
      config = {
        ...config,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      };
    }
  }

  const res = await fetch(url, config);
  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
