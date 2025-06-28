// Client-side session utilities
export function getClientSession() {
  if (typeof window === 'undefined') return null;
  
  try {
    const userEmail = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_email='))
      ?.split('=')[1];
    
    return userEmail ? { email: decodeURIComponent(userEmail) } : null;
  } catch (error) {
    console.error('Error getting client session:', error);
    return null;
  }
}

export function logout() {
  if (typeof window === 'undefined') return;
  
  // Clear client-side cookies
  document.cookie = 'user_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Call server-side logout
  fetch('/api/auth/logout', { method: 'POST' })
    .then(() => {
      window.location.href = '/';
    })
    .catch(console.error);
} 