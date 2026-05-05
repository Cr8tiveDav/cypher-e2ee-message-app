import { API_BASE_URL, STORAGE_KEYS } from "./constants";

/**
 * Custom error class for API-related failures.
 * Includes HTTP status code and optional error details from the server.
 */
class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: any) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Helper to process the fetch response.
 * Parses JSON body and throws an ApiError if the response is not OK (2xx).
 */
async function handleResponse(response: Response) {
  // Safely parse JSON or default to empty object if parsing fails
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new ApiError(
      response.status, 
      data.message || response.statusText, 
      data.detail
    );
  }
  return data;
}

/**
 * Main API client object containing wrapper methods for common HTTP verbs.
 */
export const api = {
  /**
   * Performs a GET request to the specified endpoint.
   */
  get: async (endpoint: string, token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add Bearer token to headers if provided
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
    });
    
    return handleResponse(response);
  },

  /**
   * Performs a POST request with a JSON body.
   */
  post: async (endpoint: string, body: any, token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    // Add Bearer token to headers if provided
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body), // Stringify the body object for the request
    });
    
    return handleResponse(response);
  },

  /**
   * Performs a PUT request with a JSON body.
   */
  put: async (endpoint: string, body: any, token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  /**
   * Performs a PATCH request with a JSON body.
   */
  patch: async (endpoint: string, body: any, token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  /**
   * Performs a DELETE request.
   */
  delete: async (endpoint: string, token?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
    });
    return handleResponse(response);
  },
};
