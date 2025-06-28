import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';
import { createSession } from '../../../../lib/serverAuth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    console.log('Login attempt:', { email });
    if (!email || !password) {
      console.log('Missing email or password');
      return new Response(JSON.stringify({ message: 'Email and password are required' }), { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found:', email);
      return new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.log('Invalid password for:', email);
      return new Response(JSON.stringify({ message: 'Invalid email or password' }), { status: 400 });
    }

    console.log('User logged in successfully:', email);
    
    // Create session
    await createSession(user._id.toString(), user.email);
    
    return new Response(JSON.stringify({ 
      message: 'Login successful',
      user: { id: user._id.toString(), email: user.email }
    }), { status: 200 });
  } catch (error) {
    console.log('Login error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
} 