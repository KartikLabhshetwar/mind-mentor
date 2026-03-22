import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectMongoDB } from '@/lib/mongodb';
import StudyPlan from '@/models/studyPlan';
import PdfDocument from '@/models/PdfDocument';
import CuratedResource from '@/models/curatedResource';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  await connectMongoDB();
  const userId = session.user.id;

  const [studyPlans, pdfs, resources] = await Promise.all([
    StudyPlan.find({ userId }).select('overview isActive createdAt').sort({ createdAt: -1 }).limit(20).lean(),
    PdfDocument.find({ userId }).select('title pageCount createdAt').sort({ createdAt: -1 }).limit(20).lean(),
    CuratedResource.find({ userId }).select('topic createdAt').sort({ createdAt: -1 }).limit(20).lean(),
  ]);

  return Response.json({
    studyPlans: studyPlans.map((p: any) => ({ ...p, _id: p._id.toString() })),
    pdfs: pdfs.map((p: any) => ({ ...p, _id: p._id.toString() })),
    resources: resources.map((r: any) => ({ ...r, _id: r._id.toString() })),
  });
}
