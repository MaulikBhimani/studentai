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

    console.log('Ask API: Fetching data for deviceId:', deviceId, 'portalUrl:', portalUrl);

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
      console.log('Ask API: No data found for this portal');
      return NextResponse.json({ 
        error: 'No data found for this portal. Please visit your portal pages first to extract data.' 
      }, { status: 404 });
    }

    if (!sessionData.subjects || sessionData.subjects.length === 0) {
      return NextResponse.json({ 
        error: 'No subjects found. Please visit course pages with files and assignments.' 
      }, { status: 404 });
    }

    console.log('Ask API: Found', sessionData.subjects.length, 'subjects');

    // Build context
    const context = buildContextString(sessionData);
    console.log('Ask API: Context built, length:', context.length);

    // Call Gemini
    const answer = await askGemini(question, context);
    console.log('Ask API: Answer received from Gemini');

    return NextResponse.json({ success: true, answer: answer });
  } catch (error) {
    console.error('Ask API error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
