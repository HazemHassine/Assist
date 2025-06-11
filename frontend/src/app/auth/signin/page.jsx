'use client' // Required for client-side components in App Router

import { getProviders, signIn } from 'next-auth/react'
import { useState, useEffect } from 'react'

export default function SignIn() {
  const [providers, setProviders] = useState(null)

  useEffect(() => {
    (async () => {
      const res = await getProviders()
      setProviders(res)
    })()
  }, [])

  if (!providers) {
    return <div>Loading...</div> // Or some other loading indicator
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <h1>Sign In</h1>
      {Object.values(providers).map((provider) => {
        if (provider.name === 'Credentials') {
          return (
            <div key={provider.name} style={{ marginBottom: '10px', border: '1px solid #ccc', padding: '20px', borderRadius: '5px', width: '300px' }}>
              <h2>Sign in with Email and Password</h2>
              <form method="post" action="/api/auth/callback/credentials">
                <div>
                  <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                  <input name="email" id="email" type="email" required style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '3px', border: '1px solid #ddd' }} />
                </div>
                <div>
                  <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password</label>
                  <input name="password" id="password" type="password" required style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '3px', border: '1px solid #ddd' }} />
                </div>
                <button type="submit" style={{ backgroundColor: '#0070f3', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>Sign In</button>
              </form>
            </div>
          );
        }
        return (
          <div key={provider.name} style={{ margin: '10px' }}>
            <button onClick={() => signIn(provider.id)} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
              Sign in with {provider.name}
            </button>
          </div>
        );
      })}
    </div>
  )
}
