import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/db';
import { verifyDeviceId } from '../../../lib/auth';

export async function POST(req) {
  try {
    const deviceId = verifyDeviceId(req);
    if (!deviceId) {
      return NextResponse.json({ error: 'Unauthorized: Missing Device ID' }, { status: 401 });
    }

    const data = await req.json();
    const { portalUrl, subjects } = data;

    if (!portalUrl || !subjects) {
      return NextResponse.json({ error: 'Missing portalUrl or subjects' }, { status: 400 });
    }

    if (!Array.isArray(subjects)) {
      return NextResponse.json({ error: 'subjects must be an array' }, { status: 400 });
    }

    // Check if subjects array is empty
    if (subjects.length === 0) {
      return NextResponse.json({ success: true, message: 'No subjects to ingest' });
    }

    // Find or create portal session
    let portalSession = await prisma.portalSession.findUnique({
      where: {
        deviceId_portalUrl: {
          deviceId: deviceId,
          portalUrl: portalUrl
        }
      }
    });

    if (!portalSession) {
      portalSession = await prisma.portalSession.create({
        data: {
          deviceId: deviceId,
          portalUrl: portalUrl
        }
      });
    }

    // Delete existing subjects for this session
    await prisma.subject.deleteMany({
      where: { portalSessionId: portalSession.id }
    });

    // Insert new subjects
    for (const sub of subjects) {
      if (!sub.name) continue; // Skip subjects without names
      
      await prisma.subject.create({
        data: {
          name: sub.name,
          portalSessionId: portalSession.id,
          files: {
            create: (sub.files || []).map(f => ({
              title: f.title || 'Untitled',
              url: f.url || '',
              date: f.date || null
            }))
          },
          assignments: {
            create: (sub.assignments || []).map(a => ({
              title: a.title || 'Untitled Assignment',
              dueDate: a.dueDate || null
            }))
          }
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Data ingested successfully.' });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
