import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { verifyDeviceId } from '../../../lib/auth';
import { askGemini } from '../../../lib/gemini';
import { buildContextString } from '../../../lib/contextBuilder';

export async function POST(req) {
  try {
    const deviceId = verifyDeviceId(req);
    if (!deviceId) {
      return NextResponse.json({ error: 'Unauthorized: Missing Device ID' }, { status: 401 });
    }

    const { question, portalUrl } = await req.json();

    if (!question || !portalUrl) {
      return NextResponse.json({ error: 'Missing question or portalUrl' }, { status: 400 });
    }

    // Fetch the user's dataset for this portal using composite unique key
    const sessionData = await prisma.portalSession.findUnique({
      where: {
        deviceId_portalUrl: {
          deviceId: deviceId,
          portalUrl: portalUrl
        }
      },
      include: {
        subjects: {
          include: { files: true, assignments: true }
        }
      }
    });

    if (!sessionData) {
      return NextResponse.json({ error: 'No data found for this portal with your device ID.' });
    }

    // Build context
    const context = buildContextString(sessionData);

    // Call Gemini
    const answer = await askGemini(question, context);

    return NextResponse.json({ success: true, answer: answer });
  } catch (error) {
    console.error('Ask API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
