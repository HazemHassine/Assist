import { destroySession } from '../../../../lib/serverAuth';

export async function POST() {
  try {
    await destroySession();
    return new Response(JSON.stringify({ message: 'Logged out successfully' }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Logout error:', error);
    return new Response(JSON.stringify({ message: 'Error during logout' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 