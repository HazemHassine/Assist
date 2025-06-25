'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess('Account created! Redirecting to sign in...');
      setTimeout(() => router.push('/signin'), 1500);
    } else {
      setError(data.message || 'Error creating account');
    }
  };  

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-900">
      <form onSubmit={handleSubmit} className="bg-zinc-800 p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-6 font-bold text-center">Sign Up</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {success && <div className="mb-4 text-green-500">{success}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-zinc-700 text-white"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 mb-6 rounded bg-zinc-700 text-white"
          required
        />
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Sign Up</button>
        <div className="mt-4 text-center">
          <a href="/signin" className="text-blue-400 hover:underline">Already have an account? Sign In</a>
        </div>
      </form>
    </div>
  );
} 