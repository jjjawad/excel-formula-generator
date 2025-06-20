const GUEST_LIMIT = 2;
const STORAGE_KEY = 'guest_usage_count';

// This function needs to be client-side only
export const getGuestUsage = (): number => {
  if (typeof window === 'undefined') return 0;
  const usage = window.localStorage.getItem(STORAGE_KEY);
  return usage ? parseInt(usage, 10) : 0;
};

export const incrementGuestUsage = (): number => {
  const currentUsage = getGuestUsage();
  const newUsage = currentUsage + 1;
  window.localStorage.setItem(STORAGE_KEY, newUsage.toString());
  return newUsage;
};

export const hasGuestCredits = (): boolean => {
  return getGuestUsage() < GUEST_LIMIT;
}; 