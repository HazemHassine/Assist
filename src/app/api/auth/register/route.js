import dbConnect from '../../../../lib/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    console.log('Registration attempt:', { email, name });
    
    if (!email || !password) {
      console.log('Missing email or password');
      return new Response(JSON.stringify({ message: 'Email and password are required' }), { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ message: 'Invalid email format' }), { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return new Response(JSON.stringify({ message: 'Password must be at least 6 characters long' }), { status: 400 });
    }

    await dbConnect();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log('User already exists:', email);
      return new Response(JSON.stringify({ message: 'User already exists' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with enhanced data
    const userData = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name ? name.trim() : null,
      lastLogin: new Date(),
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: true
        },
        language: 'en'
      },
      storage: {
        used: 0,
        limit: 1073741824 // 1GB
      },
      googleDrive: {
        connected: false
      },
      subscription: {
        plan: 'free',
        status: 'active'
      }
    };

    const newUser = new User(userData);
    await newUser.save();
    
    console.log('User registered successfully:', email);

    // Return user data without password
    const userResponse = newUser.toJSON();
    
    return new Response(JSON.stringify({ 
      message: 'User registered successfully',
      user: userResponse
    }), { status: 201 });
  } catch (error) {
    console.log('Registration error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
} 