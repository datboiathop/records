'use server';

import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import { type SpotifyAlbum } from '@/lib/spotify';

export async function getRecentReviews() {
  return await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { user: true, album: true }
  });
}

export async function getUserReviews(userId: string) {
  return await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { user: true, album: true }
  });
}

export async function saveReview(albumData: SpotifyAlbum, rating: number, comment: string, trackComments: Record<number, string>) {
  const user = await currentUser();
  if (!user) throw new Error("Not authenticated");

  const email = user.emailAddresses[0]?.emailAddress || '';
  const name = user.fullName || user.firstName || 'Anonymous';

  // Ensure user exists in DB
  await prisma.user.upsert({
    where: { id: user.id },
    update: {
      name,
      imageUrl: user.imageUrl,
      email
    },
    create: {
      id: user.id,
      name,
      imageUrl: user.imageUrl,
      email
    }
  });

  // Ensure album exists
  await prisma.album.upsert({
    where: { id: albumData.id },
    update: {},
    create: {
      id: albumData.id,
      title: albumData.title,
      artist: albumData.artist,
      coverUrl: albumData.coverUrl,
      releaseDate: albumData.releaseDate || '',
      tracks: JSON.stringify(albumData.tracks)
    }
  });

  // Save review
  await prisma.review.upsert({
    where: {
      userId_albumId: {
        userId: user.id,
        albumId: albumData.id
      }
    },
    update: {
      rating,
      comment,
      trackComments: JSON.stringify(trackComments)
    },
    create: {
      userId: user.id,
      albumId: albumData.id,
      rating,
      comment,
      trackComments: JSON.stringify(trackComments)
    }
  });
}