'use server';

// Helper function to get a Spotify Access Token using Client Credentials Flow
async function getSpotifyToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials are not set in environment variables.");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    next: { revalidate: 3600 } // Cache token for 1 hour
  });

  const data = await response.json();
  return data.access_token;
}

export interface SpotifyAlbum {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  releaseDate: string;
  tracks: string[];
}

export async function searchSpotifyAlbums(query: string): Promise<SpotifyAlbum[]> {
  if (!query) return [];
  
  const token = await getSpotifyToken();
  
  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=5`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  
  if (!data.albums || !data.albums.items) return [];

  return data.albums.items.map((album: any) => ({
    id: album.id,
    title: album.name,
    artist: album.artists.map((a: any) => a.name).join(', '),
    coverUrl: album.images[0]?.url || '',
    releaseDate: album.release_date ? album.release_date.substring(0, 4) : 'Unknown',
    tracks: [] // We fetch tracks only when an album is selected to save API calls
  }));
}

export async function getSpotifyAlbumDetails(albumId: string): Promise<SpotifyAlbum | null> {
  const token = await getSpotifyToken();
  
  const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) return null;

  const album = await response.json();

  return {
    id: album.id,
    title: album.name,
    artist: album.artists.map((a: any) => a.name).join(', '),
    coverUrl: album.images[0]?.url || '',
    releaseDate: album.release_date ? album.release_date.substring(0, 4) : 'Unknown',
    tracks: album.tracks.items.map((track: any) => track.name)
  };
}

export async function getNewReleases(): Promise<SpotifyAlbum[]> {
  try {
    const token = await getSpotifyToken();
    
    const response = await fetch('https://api.spotify.com/v1/browse/new-releases?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      next: { revalidate: 3600 * 12 } // Cache for 12 hours
    });

    if (!response.ok) {
      console.error("Spotify API error:", response.status, await response.text());
      return [];
    }

    const data = await response.json();
    
    if (!data.albums || !data.albums.items) return [];

    return data.albums.items.map((album: any) => ({
      id: album.id,
      title: album.name,
      artist: album.artists.map((a: any) => a.name).join(', '),
      coverUrl: album.images[0]?.url || '',
      releaseDate: album.release_date ? album.release_date.substring(0, 4) : 'Unknown',
      tracks: []
    }));
  } catch (error) {
    console.error("Failed to fetch new releases:", error);
    return [];
  }
}