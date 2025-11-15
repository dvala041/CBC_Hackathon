// Hardcoded user ID for development (bypassing authentication)
export const HARDCODED_USER_ID = '887eb738-f3a0-4546-ad55-9faaa8e85d43';

export function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}
