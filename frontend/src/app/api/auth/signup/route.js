import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb' // Adjust path as needed
import bcrypt from 'bcrypt'

export async function POST(request) {
  try {
    let { email, password, name } = await request.json();

    if (email) {
      email = email.toLowerCase();
    }

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db() // Or your specific database name if not default
    const usersCollection = db.collection('users')

    const existingUser = await usersCollection.findOne({ email }) // email is now lowercased
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10) // Salt rounds: 10

    const result = await usersCollection.insertOne({
      email, // email is now lowercased
      password: hashedPassword,
      name: name || '', // Store name, default to empty string if not provided
      createdAt: new Date(),
    })

    return NextResponse.json({ message: 'User created successfully', userId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}
