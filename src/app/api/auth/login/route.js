import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

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
    // You may want to set a cookie or return a token here
    return new Response(JSON.stringify({ message: 'Login successful' }), { status: 200 });
  } catch (error) {
    console.log('Login error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
} 