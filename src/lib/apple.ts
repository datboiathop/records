 'use server';
 
 export interface Album {
   id: string;
   title: string;
   artist: string;
   coverUrl: string;
   releaseDate: string;
   tracks: string[];
 }
 
 type AppleChartAlbum = {
   id: string;
   name: string;
   artistName: string;
   releaseDate: string;
   artworkUrl100: string;
 };
 
 function to600(url100: string): string {
   return typeof url100 === 'string' ? url100.replace('/100x100bb.', '/600x600bb.') : '';
 }
 
 export async function getAppleMostPlayedAlbums100(): Promise<Album[]> {
  const res = await fetch('https://rss.marketingtools.apple.com/api/v2/us/music/most-played/100/albums.json', {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const items: AppleChartAlbum[] = (data.feed?.results as AppleChartAlbum[]) || [];
 
   // Dedupe by id, keep first occurrence
   const unique = Array.from(new Map(items.map((a) => [String(a.id), a])).values()).slice(0, 100);
 
   return unique.map((a) => ({
     id: String(a.id),
     title: a.name,
     artist: a.artistName,
     coverUrl: to600(a.artworkUrl100),
     releaseDate: a.releaseDate,
     tracks: [],
   }));
 }
 
 export async function searchAppleAlbums(term: string): Promise<Album[]> {
   if (!term.trim()) return [];
 
   const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=25`;
   const res = await fetch(url, { next: { revalidate: 3600 } });
   if (!res.ok) return [];
   const data = await res.json();
 
   const results = Array.isArray(data.results) ? data.results : [];
   return results.map((r: any) => ({
     id: String(r.collectionId),
     title: r.collectionName ?? 'Unknown',
     artist: r.artistName ?? 'Unknown',
     coverUrl: typeof r.artworkUrl100 === 'string' ? r.artworkUrl100.replace('100x100bb', '600x600bb') : '',
     releaseDate: typeof r.releaseDate === 'string' ? r.releaseDate.slice(0, 10) : 'Unknown',
     tracks: [],
   }));
 }
 
 export async function getAppleAlbumDetails(collectionId: string): Promise<Album | null> {
   const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(collectionId)}&entity=song`;
   const res = await fetch(url, { next: { revalidate: 3600 } });
   if (!res.ok) return null;
   const data = await res.json();
 
   const results = Array.isArray(data.results) ? data.results : [];
   const album = results.find((r: any) => r.wrapperType === 'collection');
   if (!album) return null;
   const tracks = results
     .filter((r: any) => r.wrapperType === 'track' && r.kind === 'song')
     .sort((a: any, b: any) => (a.trackNumber ?? 0) - (b.trackNumber ?? 0))
     .map((t: any) => t.trackName)
     .filter(Boolean);
 
   return {
     id: String(album.collectionId),
     title: album.collectionName ?? 'Unknown',
     artist: album.artistName ?? 'Unknown',
     coverUrl:
       typeof album.artworkUrl100 === 'string' ? album.artworkUrl100.replace('100x100bb', '600x600bb') : '',
     releaseDate: typeof album.releaseDate === 'string' ? album.releaseDate.slice(0, 10) : 'Unknown',
     tracks,
   };
 }
