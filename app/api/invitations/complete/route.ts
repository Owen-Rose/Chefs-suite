import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InvitationService } from '@/services/invitationService';
import { CompleteInvitationDto } from '@/types/Invitation';

export async function POST(req: NextRequest) {
  const { token, firstName, lastName, password } = await req.json() as CompleteInvitationDto;
  if (!token || !firstName || !lastName || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  const { invitations, users, client } = await connectToDatabase();
  const invitationService = new InvitationService(invitations);
  const sessionDb = client.startSession();
  try {
    let result;
    await sessionDb.withTransaction(async () => {
      result = await invitationService.completeInvitation(
        { token, firstName, lastName, password },
        users,
        sessionDb
      );
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally {
    await sessionDb.endSession();
  }
} 