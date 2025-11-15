// Hardcoded user ID for development
// User: 887eb738-f3a0-4546-ad55-9faaa8e85d43
export const HARDCODED_USER_ID = '887eb738-f3a0-4546-ad55-9faaa8e85d43';

// Use this in API calls that need user authentication
export const getAuthHeaders = () => ({
  'x-user-id': HARDCODED_USER_ID,
});
