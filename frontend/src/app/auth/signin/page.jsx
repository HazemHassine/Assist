'use client'

import { getProviders, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Github, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation' // Added import

export default function SignIn() {
  const [providers, setProviders] = useState(null)
  const [isLoading, setIsLoading] = useState({})
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter(); // Initialize router

  useEffect(() => {
    (async () => {
      const res = await getProviders()
      setProviders(res)
    })()
  }, [])

  const handleOAuthSignIn = async (providerId) => { // Renamed for clarity
    setIsLoading(prev => ({ ...prev, [providerId]: true }));
    await signIn(providerId, { callbackUrl: '/' });
    // setIsLoading(prev => ({ ...prev, [providerId]: false })); // Usually not reached
  }

  const handleCredentialsSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(prev => ({ ...prev, credentials: true }));

    const lowercasedEmail = email.toLowerCase(); // Ensure email is lowercase

    const result = await signIn('credentials', {
      redirect: false, // Important: handle redirect manually
      email: lowercasedEmail,
      password,
    });

    setIsLoading(prev => ({ ...prev, credentials: false }));

    if (result?.error) {
      setError(result.error === "CredentialsSignin" ? "Invalid email or password." : result.error);
    } else if (result?.ok && !result.error) {
      router.push('/'); // Redirect to homepage
    } else {
      setError('Sign in failed. Please try again.');
    }
  };

  // Styling objects (pageBackgroundStyle, cardStyle, inputStyle, etc.) remain the same as previous version
  const pageBackgroundStyle = {
    backgroundImage: 'radial-gradient(#2d3748 1px, #1a202c 1px)',
    backgroundSize: '10px 10px',
    color: '#e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
  };
  const cardStyle = {
    background: '#2d3748',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  }
  const inputStyle = {
    width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '4px',
    border: '1px solid #4a5568', background: '#1a202c', color: '#e2e8f0', boxSizing: 'border-box',
  }
  const buttonStyle = {
    width: '100%', padding: '0.75rem', borderRadius: '4px', border: 'none',
    color: 'white', cursor: 'pointer', fontSize: '1rem', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem',
  }
   const primaryButtonStyle = {
    ...buttonStyle,
    background: '#3182ce',
  }
  const githubButtonStyle = {
    ...buttonStyle,
    background: '#333',
  }
  const emailButtonStyle = {
      ...buttonStyle,
      background: '#4A5568',
  }
  const linkStyle = {
    color: '#63b3ed', marginTop: '1.5rem', display: 'block',
  }
  const titleStyle = {
    marginBottom: '1.5rem', fontSize: '1.875rem',
  }
  const errorStyle = { // Style for error messages
    color: '#e53e3e', // Red color for errors
    textAlign: 'center',
    marginTop: '10px',
    minHeight: '1.5em', // Reserve space for error message
  }


  if (!providers) {
    return <div style={pageBackgroundStyle}><div style={cardStyle}>Loading...</div></div>
  }

  return (
    <div style={pageBackgroundStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Sign In</h1>
        {Object.values(providers).map((provider) => {
          if (provider.name === 'Credentials') { // Or provider.id === 'credentials'
            return (
              <form onSubmit={handleCredentialsSignIn} key={provider.id}> {/* Changed to onSubmit */}
                <div>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>Email</label>
                  <input
                    name="email"
                    id="email"
                    type="email"
                    required
                    style={inputStyle}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} // Controlled component
                  />
                </div>
                <div>
                  <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', textAlign: 'left' }}>Password</label>
                  <input
                    name="password"
                    id="password"
                    type="password"
                    required
                    style={inputStyle}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} // Controlled component
                  />
                </div>
                {error && <p style={errorStyle}>{error}</p>} {/* Display error messages */}
                <button
                  type="submit"
                  style={primaryButtonStyle}
                  disabled={isLoading['credentials']}
                >
                  {isLoading['credentials'] ? 'Signing In...' : 'Sign In with Email'}
                </button>
              </form>
            );
          }

          // OAuth Providers
          let currentProviderButtonStyle = buttonStyle;
          let providerIcon = null;

          if (provider.id === 'github') {
            currentProviderButtonStyle = githubButtonStyle;
            providerIcon = <Github size={20} />;
          } else if (provider.id === 'email') {
            currentProviderButtonStyle = emailButtonStyle;
            providerIcon = <Mail size={20} />;
          }

          return (
            <div key={provider.id}>
              <button
                onClick={() => handleOAuthSignIn(provider.id)} // Changed to handleOAuthSignIn
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
