import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InvitationService } from '@/services/invitationService';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const { token } = params;
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }
  const { invitations } = await connectToDatabase();
  const invitationService = new InvitationService(invitations);
  const verifyResult = await invitationService.verifyInvitation(token);
  if (!verifyResult.valid) {
    return NextResponse.json({ error: verifyResult.error }, { status: 400 });
  }
  return NextResponse.json({ valid: true, invitation: verifyResult.invitation });
} 