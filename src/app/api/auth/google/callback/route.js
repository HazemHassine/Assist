import { google } from 'googleapis';
import { cookies } from 'next/headers';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('Authorization code not found', { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in cookies (you might want to encrypt these in production)
    const cookieStore = await cookies();
    cookieStore.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });

    if (tokens.refresh_token) {
      cookieStore.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    }

    // Construct absolute URL for redirect
    const url = new URL(request.url);
    const redirectUrl = `${url.protocol}//${url.host}/`;
    
    return Response.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
} 