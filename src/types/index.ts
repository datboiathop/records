import { type SpotifyAlbum } from '@/lib/spotify';

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  trackComments: string | null;
  userId: string;
  albumId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    imageUrl: string | null;
    email: string;
  };
  album: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    releaseDate: string | null;
    tracks: string;
  };
}