import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import { compare, hash } from 'bcryptjs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ message: 'User not found' }, { status: 404 });
  }
  const isPasswordValid = await compare(currentPassword, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
  }
  const hashedNewPassword = await hash(newPassword, 12);
  await db.collection('users').updateOne(
    { email: session.user.email },
    { $set: { password: hashedNewPassword } }
  );
  return NextResponse.json({ message: 'Password updated successfully' });
} 