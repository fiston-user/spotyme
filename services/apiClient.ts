import AsyncStorage from "@react-native-async-storage/async-storage";
import useAuthStore from "../stores/authStore";
import useUIStore from "../stores/uiStore";

const API_BASE_URL = "https://piranha-coherent-usefully.ngrok-free.app";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

interface QueuedRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  request: () => Promise<Response>;
}

class UnifiedApiClient {
  private isRefreshing = false;
  private refreshQueue: QueuedRequest[] = [];
  private maxRetries = 3;
  private retryDelay = 1000;
  private lastAuthFailure = 0;
  private authFailureThreshold = 5000; // 5 seconds between auth failures

  private async getStoredTokens() {
    const [accessToken, refreshToken] = await Promise.all([
      AsyncStorage.getItem("spotify_access_token"),
      AsyncStorage.getItem("spotify_refresh_token"),
    ]);
    return { accessToken, refreshToken };
  }

  private async storeTokens(accessToken: string, refreshToken?: string) {
    const items: [string, string][] = [["spotify_access_token", accessToken]];
    if (refreshToken) {
      items.push(["spotify_refresh_token", refreshToken]);
    }
    await AsyncStorage.multiSet(items);
  }

  private async clearAuthData() {
    await AsyncStorage.multiRemove([
      "spotify_access_token",
      "spotify_refresh_token",
      "is_authenticated",
      "user_info",
    ]);

    // Use setState to clear auth store without triggering logout
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoggingOut: false,
      isLoading: false,
      error: null,
    });
  }

  private async executeRefreshToken(): Promise<boolean> {
    try {
      const { refreshToken } = await this.getStoredTokens();
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Token refresh failed");
      }

      const data = await response.json();

      if (!data.accessToken) {
        throw new Error("No access token received from refresh");
      }

      await this.storeTokens(data.accessToken, data.refreshToken);

      // Update auth store with new tokens
      const authStore = useAuthStore.getState();
      authStore.setTokens(data.accessToken, data.refreshToken || refreshToken);

      return true;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  private async refreshTokenAndRetryQueue() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({
          resolve,
          reject,
          request: async () => new Response(),
        });
      });
    }

    this.isRefreshing = true;

    try {
      const success = await this.executeRefreshToken();

      if (success) {
        // Process queued requests with new token
        const queue = [...this.refreshQueue];
        this.refreshQueue = [];

        queue.forEach(({ resolve }) => resolve(true));
        return true;
      } else {
        // Refresh failed, reject all queued requests
        const queue = [...this.refreshQueue];
        this.refreshQueue = [];

        queue.forEach(({ reject }) =>
          reject(new Error("Token refresh failed"))
        );

        // Clear auth and redirect to login
        await this.handleAuthFailure();
        return false;
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  private async handleAuthFailure() {
    const uiStore = useUIStore.getState();
    const authStore = useAuthStore.getState();

    // Don't show auth failure during logout
    if (authStore.isLoggingOut) {
      return;
    }

    // Rate limit auth failures to prevent rapid retries
    const now = Date.now();
    if (now - this.lastAuthFailure < this.authFailureThreshold) {
      console.log("Auth failure rate limited, skipping UI update");
      return;
    }
    this.lastAuthFailure = now;

    // Clear all auth data
    await this.clearAuthData();

    // Show session expired modal instead of toast
    uiStore.showSessionExpiredModal();
  }

  private async makeRequest(
    url: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<Response> {
    // Check if we're logging out - don't make any requests
    const authStore = useAuthStore.getState();
    if (authStore.isLoggingOut) {
      throw new Error("Logout in progress");
    }

    const { accessToken } = await this.getStoredTokens();

    if (!accessToken && !url.includes("/auth/")) {
      // Check if we're still initializing
      if (!authStore.isHydrated) {
        // Wait for auth store to hydrate
        await new Promise((resolve) => setTimeout(resolve, 100));
        return this.makeRequest(url, options, retryCount);
      }
      throw new Error("No authentication token available");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401 && !url.includes("/auth/")) {
        // Don't handle 401 during logout
        if (authStore.isLoggingOut) {
          throw new Error("Logout in progress");
        }

        // Wait if another refresh is in progress
        if (this.isRefreshing) {
          await new Promise((resolve, reject) => {
            this.refreshQueue.push({
              resolve,
              reject,
              request: async () => this.makeRequest(url, options),
            });
          });

          // Retry with new token
          return this.makeRequest(url, options);
        }

        // Try to refresh token
        const refreshSuccess = await this.refreshTokenAndRetryQueue();

        if (refreshSuccess) {
          // Retry request with new token
          return this.makeRequest(url, options);
        } else {
          // Refresh failed, auth failure already handled
          throw new Error("Authentication failed");
        }
      }

      // Handle other server errors with retry
      if (response.status >= 500 && retryCount < this.maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount))
        );
        return this.makeRequest(url, options, retryCount + 1);
      }

      return response;
    } catch (error) {
      // Network errors
      if (retryCount < this.maxRetries && error instanceof TypeError) {
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * Math.pow(2, retryCount))
        );
        return this.makeRequest(url, options, retryCount + 1);
      }
      throw error;
    }
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const uiStore = useUIStore.getState();
    const authStore = useAuthStore.getState();

    // Don't make requests during logout
    if (authStore.isLoggingOut) {
      return {
        success: false,
        error: "Logout in progress",
      };
    }

    try {
      const url = endpoint.startsWith("http")
        ? endpoint
        : `${API_BASE_URL}${endpoint}`;

      const response = await this.makeRequest(url, options);

      let data: any;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Extract error message
        const errorMessage =
          data?.error?.message ||
          data?.error ||
          data?.message ||
          `Request failed with status ${response.status}`;

        // Show user-friendly error for specific cases
        if (response.status === 401) {
          // Already handled in makeRequest
          return {
            success: false,
            error: "Authentication required. Please log in.",
          };
        } else if (response.status === 403) {
          uiStore.showToast(
            "You don't have permission to perform this action",
            "error",
            5000
          );
        } else if (response.status === 404) {
          uiStore.showToast(
            "The requested resource was not found",
            "warning",
            5000
          );
        } else if (response.status >= 500) {
          uiStore.showToast(
            "Server error. Please try again later.",
            "error",
            5000,
            {
              label: "Retry",
              onPress: () => {
                // Retry the request
                this.request(endpoint, options);
              },
            }
          );
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      // Don't log errors during logout
      if (!authStore.isLoggingOut) {
        console.error("API Request Error:", error);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("Network")) {
        // Only show toast if not logging out
        if (!authStore.isLoggingOut) {
          uiStore.showToast(
            "Network error. Please check your connection.",
            "error",
            5000
          );
        }

        return {
          success: false,
          error: "Network error. Please check your connection.",
        };
      }

      // Handle other errors
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      // Don't show error messages during logout
      if (errorMessage.includes("Logout in progress")) {
        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Convenience methods
  async get<T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      ...(body && { body: JSON.stringify(body) }),
    });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      ...(body && { body: JSON.stringify(body) }),
    });
  }

  async delete<T = any>(
    endpoint: string,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }

  // Auth-specific methods
  async logout() {
    const uiStore = useUIStore.getState();

    // Set logging out flag first
    useAuthStore.setState({ isLoggingOut: true, isLoading: true });

    try {
      // Show loading state
      uiStore.showToast("Logging out...", "info", 2000);

      // Try to call backend logout endpoint (don't use this.post to avoid recursion)
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (e) {
        // Ignore backend logout errors
      }
    } catch (error) {
      console.error("Backend logout error:", error);
    } finally {
      // Always clear local auth data
      await this.clearAuthData();

      // Show success briefly
      uiStore.hideToast();
      setTimeout(() => {
        uiStore.showToast("Logged out successfully", "success", 2000);
      }, 100);
    }
  }

  async checkTokenExpiry(): Promise<boolean> {
    try {
      const { accessToken } = await this.getStoredTokens();
      if (!accessToken) return false;

      // Decode JWT to check expiry (basic check without library)
      const payload = accessToken.split(".")[1];
      if (!payload) return false;

      const decoded = JSON.parse(atob(payload));
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;

      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        return await this.executeRefreshToken();
      }

      return true;
    } catch (error) {
      console.error("Token expiry check error:", error);
      return false;
    }
  }
}

export const apiClient = new UnifiedApiClient();
