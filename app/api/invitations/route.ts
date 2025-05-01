import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { Permission, hasPermission } from '@/types/Permission';
import { InvitationStatus } from '@/types/Invitation';
import { InvitationService } from '@/services/invitationService';
import { createMailService } from '@/services/email/email-service-factory';
import { UserRole } from '@/types/Roles';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.VIEW_USERS)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { invitations } = await connectToDatabase();
  const emailService = createMailService();
  const invitationService = new InvitationService(invitations, emailService);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as InvitationStatus | undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const result = await invitationService.listInvitations(status, page, limit);
  return NextResponse.json({
    invitations: result.invitations,
    total: result.total,
    page,
    totalPages: Math.ceil(result.total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!hasPermission(session.user.role, Permission.CREATE_USERS)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  const { invitations } = await connectToDatabase();
  const emailService = createMailService();
  const invitationService = new InvitationService(invitations, emailService);
  const { email, role } = await req.json();
  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }
  if (!Object.values(UserRole).includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }
  try {
    const invitation = await invitationService.createInvitation({
      email,
      role,
      invitedBy: new ObjectId(session.user.id),
    });
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const magicLink = invitationService.generateMagicLink(invitation.token, baseUrl);
    return NextResponse.json({ invitation, magicLink }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
} 