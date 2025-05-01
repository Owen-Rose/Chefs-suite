import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hash } from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Permission, hasPermission } from '@/types/Permission';
import { UserRole } from '@/types/Roles';

function canEditUser(currentRole: UserRole, targetRole: UserRole): boolean {
  if (currentRole === UserRole.ADMIN) return true;
  if (currentRole === UserRole.CHEF) return targetRole !== UserRole.ADMIN;
  if (currentRole === UserRole.MANAGER) return targetRole === UserRole.STAFF;
  return false;
}

function isAllowedToAssignRole(currentRole: UserRole, targetRole: UserRole): boolean {
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
      return targetRole === UserRole.STAFF;
    default:
      return false;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.VIEW_USERS)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { db } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }
  const user = await db
    .collection('users')
    .findOne({ _id: new ObjectId(id) }, { projection: { password: 0 } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.EDIT_USERS)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { db } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }
  const { email, password, FirstName, LastName, role } = await req.json();
  const currentUserRole = session.user.role as UserRole;
  const existingUser = await db.collection('users').findOne({ _id: new ObjectId(id) });
  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (!canEditUser(currentUserRole, existingUser.role)) {
    return NextResponse.json({ error: `You don't have permission to edit ${existingUser.role} users` }, { status: 403 });
  }
  if (!isAllowedToAssignRole(currentUserRole, role as UserRole)) {
    return NextResponse.json({ error: 'You do not have permission to assign this role' }, { status: 403 });
  }
  const updateData: any = {
    email,
    FirstName,
    LastName,
    role,
    updatedAt: new Date(),
  };
  if (password) {
    updateData.password = await hash(password, 12);
  }
  const result = await db.collection('users').updateOne({ _id: new ObjectId(id) }, { $set: updateData });
  if (result.matchedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'User updated successfully' });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.DELETE_USERS)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { db } = await connectToDatabase();
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }
  const userToDelete = await db.collection('users').findOne({ _id: new ObjectId(id) });
  if (!userToDelete) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const currentUserRole = session.user.role as UserRole;
  if (!canEditUser(currentUserRole, userToDelete.role)) {
    return NextResponse.json({ error: `You don't have permission to delete ${userToDelete.role} users` }, { status: 403 });
  }
  const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'User deleted successfully' });
} 