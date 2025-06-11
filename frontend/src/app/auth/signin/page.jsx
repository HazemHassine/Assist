'use client'

import { getProviders, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link' // Added for sign-up link
import { Github, Mail } from 'lucide-react' // Assuming Github icon from lucide-react, adding Mail for EmailProvider

export default function SignIn() {
  const [providers, setProviders] = useState(null)
  const [isLoading, setIsLoading] = useState({}) // For individual button loading

  useEffect(() => {
    (async () => {
      const res = await getProviders()
      setProviders(res)
    })()
  }, [])

  const handleSignIn = async (providerId) => {
    setIsLoading(prev => ({ ...prev, [providerId]: true }));
    await signIn(providerId, { callbackUrl: '/' }); // Explicitly set callbackUrl
    // setIsLoading(prev => ({ ...prev, [providerId]: false })); // Usually not reached due to redirect
  }

  // Basic dark theme styling (similar to signup page)
  const pageBackgroundStyle = {
    // For a subtle dot pattern:
    backgroundImage: 'radial-gradient(#2d3748 1px, #1a202c 1px)',
    backgroundSize: '10px 10px', // Adjust size for dot density
    color: '#e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
  };
  const cardStyle = { // Renamed from formStyle for clarity as it contains more than just a form
    background: '#2d3748',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center', // Center title and buttons
  }
  const inputStyle = {
    width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px',
    border: '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0', boxSizing: 'border-box',
  }
  const buttonStyle = { /* Base for provider buttons */
    width: '100%', padding: '0.75rem', borderRadius: '4px', border: 'none',
    color: 'white', cursor: 'pointer', fontSize: '1rem', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem',
  }
   const primaryButtonStyle = { // For credentials submit
    ...buttonStyle,
    background: '#3182ce', // Blue
  }
  const githubButtonStyle = {
    ...buttonStyle,
    background: '#333', // GitHub-like color
  }
  const emailButtonStyle = { // Style for Email provider button
      ...buttonStyle,
      background: '#4A5568', // A neutral dark gray
  }
  const linkStyle = {
    color: '#63b3ed', marginTop: '1.5rem', display: 'block',
  }
  const titleStyle = {
    marginBottom: '1.5rem', fontSize: '1.875rem',
  }

  if (!providers) {
    // Apply pageBackgroundStyle to loading state as well for consistent background
    return <div style={pageBackgroundStyle}><div style={cardStyle}>Loading...</div></div>
  }

  return (
    <div style={pageBackgroundStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Sign In</h1>
        {Object.values(providers).map((provider) => {
          if (provider.name === 'Credentials') {
            return (
              <form method="post" action="/api/auth/callback/credentials" key={provider.name}>
                {/* Consider adding CSRF token if not handled automatically by NextAuth */}
                <div>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>Email</label>
                  <input name="email" id="email" type="email" required style={inputStyle} />
                </div>
                <div>
                  <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>Password</label>
                  <input name="password" id="password" type="password" required style={inputStyle} />
                </div>
                <button
                  type="submit"
                  style={primaryButtonStyle}
                  disabled={isLoading['credentials']} // Use 'credentials' as key for this button
                >
                  {isLoading['credentials'] ? 'Signing In...' : 'Sign In with Email'}
                </button>
              </form>
            );
          }

          // Generic provider button
          let currentProviderButtonStyle = buttonStyle; // Default to base button style
          let providerIcon = null;

          if (provider.id === 'github') { // Check provider.id for more reliable identification
            currentProviderButtonStyle = githubButtonStyle;
            providerIcon = <Github size={20} />;
          } else if (provider.id === 'email') { // Check provider.id for EmailProvider
            currentProviderButtonStyle = emailButtonStyle;
            providerIcon = <Mail size={20} />;
          }
          // Add more else if blocks here for other providers if needed

          return (
            // Ensure this div has a key if it's the direct child of map, or the button itself if it's unique by provider.id
            <div key={provider.id}>
              <button
                onClick={() => handleSignIn(provider.id)}
                style={currentProviderButtonStyle}
                disabled={isLoading[provider.id]}
              >
                {providerIcon}
                {isLoading[provider.id] ? 'Redirecting...' : `Sign in with ${provider.name}`}
              </button>
            </div>
          );
        })}
        <Link href="/auth/signup" style={linkStyle}>
          Don't have an account? Sign Up
        </Link>
      </div>
    </div>
  )
}
