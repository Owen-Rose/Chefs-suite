import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hash } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Permission, hasPermission } from '@/types/Permission';
import { UserRole } from '@/types/Roles';

function isAllowedToCreateRole(currentRole: UserRole, targetRole: UserRole): boolean {
  switch (currentRole) {
    case UserRole.ADMIN:
      return true;
    case UserRole.CHEF:
      return (
        targetRole === UserRole.CHEF ||
        targetRole === UserRole.MANAGER ||
        targetRole === UserRole.STAFF
      );
    case UserRole.MANAGER:
      return targetRole === UserRole.MANAGER || targetRole === UserRole.STAFF;
    default:
      return false;
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.VIEW_USERS)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { db } = await connectToDatabase();
  const users = await db
    .collection('users')
    .find({}, { projection: { password: 0 } })
    .toArray();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.CREATE_USERS)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { db } = await connectToDatabase();
  const { email, password, FirstName, LastName, role } = await req.json();
  const currentUserRole = session.user.role as UserRole;
  if (!currentUserRole) {
    return NextResponse.json({ error: 'User role not found' }, { status: 401 });
  }
  if (!email || !password || !FirstName || !LastName || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!isAllowedToCreateRole(currentUserRole, role as UserRole)) {
    return NextResponse.json({ error: 'You do not have permission to create a user with this role' }, { status: 403 });
  }
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
    role: role as UserRole,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection('users').insertOne(newUser);
  return NextResponse.json({
    message: 'User created successfully',
    user: { ...newUser, _id: result.insertedId, password: undefined },
  }, { status: 201 });
} 