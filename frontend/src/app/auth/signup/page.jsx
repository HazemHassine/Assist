'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation' // For redirection
import Link from 'next/link' // For linking to sign-in page

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (!email || !password) {
      setMessage('Email and password are required.')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Sign up successful! Redirecting to sign in...')
        // Optionally clear form: setName(''); setEmail(''); setPassword('');
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setMessage(data.message || 'Sign up failed.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
      console.error('Sign up error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Basic dark theme styling (inline for simplicity in this subtask, can be moved to CSS files later)
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
  const formStyle = {
    background: '#2d3748', // Slightly lighter card background
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
  }
  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    borderRadius: '4px',
    border: '1px solid #4a5568',
    background: '#1a202c',
    color: '#e2e8f0',
    boxSizing: 'border-box', // Ensure padding doesn't expand width
  }
  const buttonStyle = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '4px',
    border: 'none',
    background: '#3182ce', // Blue accent
    color: 'white',
    cursor: 'pointer',
    fontSize: '1rem',
    opacity: isLoading ? 0.7 : 1,
  }
   const linkStyle = {
    color: '#63b3ed', // Light blue for links
    marginTop: '1rem',
    textAlign: 'center',
    display: 'block',
  }
  const messageStyle = {
    marginTop: '1rem',
    color: message && message.startsWith('Sign up successful') ? '#38a169' : '#e53e3e', // Green for success, red for error
    textAlign: 'center',
  }


  return (
    <div style={pageBackgroundStyle}>
      <div style={formStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.875rem' }}>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>Name (Optional)</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
          </div>
          <button type="submit" style={buttonStyle} disabled={isLoading}>
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        {message && <p style={messageStyle}>{message}</p>}
        <Link href="/auth/signin" style={linkStyle}>
          Already have an account? Sign In
        </Link>
      </div>
    </div>
  )
}
