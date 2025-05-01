import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  const { email, password, FirstName, LastName, role } = await req.json();
  if (!email || !password || !FirstName || !LastName || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const { db } = await connectToDatabase();
  const existingUser = await db.collection('users').findOne({ email });
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 400 });
  }
  const hashedPassword = await hash(password, 12);
  const newUser = {
    email,
    password: hashedPassword,
    FirstName,
    LastName,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection('users').insertOne(newUser);
  return NextResponse.json({
    message: 'User registered successfully',
    user: { ...newUser, _id: result.insertedId, password: undefined },
  }, { status: 201 });
} 