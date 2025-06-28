import { cookies } from 'next/headers';
import dbConnect from './dbConnect';
import User from '../models/User';

// Server-side session management utilities
export async function createSession(userId, email) {
  const cookieStore = await cookies();
  
  // Create a session token (in production, use JWT or similar)
  const sessionToken = Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString('base64');
  
  cookieStore.set('session_token', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
  
  cookieStore.set('user_email', email, {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
  
  return sessionToken;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token');
    const userEmail = cookieStore.get('user_email');
    
    if (!sessionToken || !userEmail) {
      return null;
    }
    
    // In a real app, you'd validate the session token against a database
    // For now, we'll just return the user email if the token exists
    await dbConnect();
    const user = await User.findOne({ email: userEmail.value });
    
    if (!user) {
      return null;
    }
    
    return {
      id: user._id.toString(),
      email: user.email,
      sessionToken: sessionToken.value
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete('session_token');
  cookieStore.delete('user_email');
} 