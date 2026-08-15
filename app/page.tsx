import { prisma } from '@/lib/prisma';
import { serializeProduct } from '@/lib/product';
import { getCurrentCustomer } from '@/lib/customerAuth';
import HomeExperience from './HomeExperience';

export const dynamic = 'force-dynamic';

const RECENT_LIMIT = 6;

export default async function HomePage() {
  const customer = await getCurrentCustomer();
  let brothers: { id: string; name: string }[] = [];
  let loadError = false;
  let recentProducts: ReturnType<typeof serializeProduct>[] = [];
  let recentVideos: ReturnType<typeof serializeProduct>[] = [];

  try {
    brothers = await prisma.brother.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, name: true },
    });

    const [products, videos] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        include: { brother: { select: { name: true } } },
      }),
      prisma.product.findMany({
        where: { status: 'PUBLISHED', videoUrl: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: RECENT_LIMIT,
        include: { brother: { select: { name: true } } },
      }),
    ]);

    recentProducts = products.map(serializeProduct);
    recentVideos = videos.map(serializeProduct);
  } catch {
    loadError = true;
  }

  return (
    <HomeExperience
      brothers={brothers}
      loadError={loadError}
      recentProducts={recentProducts}
      recentVideos={recentVideos}
      customerName={customer?.name ?? null}
    />
  );
}
