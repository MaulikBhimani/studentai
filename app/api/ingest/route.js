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
      return NextResponse.json({ error: 'Missing Data' }, { status: 400 });
    }

    // Upsert portal session using unique composite key [deviceId, portalUrl] if relying on it,
    // or we can search for the existing record and update it safely using Prisma.
    // However, Prisma upsert relies on a unique field or composite field.
    // The schema has @@unique([deviceId, portalUrl]).
    
    // Check if the unique identifier works
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

    // We drop existing subjects for this session and insert fresh ones.
    await prisma.subject.deleteMany({
      where: { portalSessionId: portalSession.id }
    });

    for (const sub of subjects) {
      await prisma.subject.create({
        data: {
          name: sub.name,
          portalSessionId: portalSession.id,
          files: {
            create: sub.files.map(f => ({
              title: f.title,
              url: f.url,
              date: f.date
            }))
          },
          assignments: {
            create: sub.assignments.map(a => ({
              title: a.title,
              dueDate: a.dueDate
            }))
          }
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Data ingested successfully.' });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
