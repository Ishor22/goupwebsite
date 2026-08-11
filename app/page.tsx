import { prisma } from '@/lib/prisma';
import HomeExperience from './HomeExperience';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let brothers: { id: string; name: string }[] = [];
  let loadError = false;

  try {
    brothers = await prisma.brother.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true },
    });
  } catch {
    loadError = true;
  }

  return <HomeExperience brothers={brothers} loadError={loadError} />;
}
