import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    console.log('Registration attempt:', { email });
    if (!email || !password) {
      console.log('Missing email or password');
      return new Response(JSON.stringify({ message: 'Email and password are required' }), { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', email);
      return new Response(JSON.stringify({ message: 'User already exists' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    console.log('User registered successfully:', email);

    return new Response(JSON.stringify({ message: 'User registered successfully' }), { status: 201 });
  } catch (error) {
    console.log('Registration error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
} 