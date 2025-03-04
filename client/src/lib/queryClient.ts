import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Sender ${method} anmodning til: ${url}`, data);
  
  // Bestem om vi kører på Netlify
  const isNetlify = window.location.hostname.includes('netlify.app') || 
                    window.location.hostname.includes('.replit.app') || 
                    window.location.hostname === 'localhost';
  
  const options: RequestInit = {
    method,
    headers: data ? { 
      "Content-Type": "application/json" 
    } : {},
    body: data ? JSON.stringify(data) : undefined,
    // Inkluder kun credentials hvis det ikke er Netlify (serverless functions)
    credentials: isNetlify && url.includes('netlify/functions') ? 'omit' : 'include',
  };
  
  console.log('Fetch options:', options);
  
  try {
    const res = await fetch(url, options);
    console.log(`Svar fra ${url}:`, {
      status: res.status,
      statusText: res.statusText,
      headers: Object.fromEntries([...res.headers.entries()])
    });
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API-anmodningsfejl:', error);
    throw error;
  }
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
