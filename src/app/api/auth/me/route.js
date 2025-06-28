import { getSession } from '../../../../lib/serverAuth';
import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return new Response(JSON.stringify({ authenticated: false }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fetch complete user data from database
    await dbConnect();
    const user = await User.findOne({ email: session.email }).select('-password');
    
    if (!user) {
      return new Response(JSON.stringify({ authenticated: false }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      authenticated: true,
      user: user.toJSON()
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Session check error:', error);
    return new Response(JSON.stringify({ authenticated: false }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 