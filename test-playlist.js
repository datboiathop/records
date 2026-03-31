const clientId = "0b088af783414c3a9eb709012b936626";
const clientSecret = "0bb43de0f17d4bf2b6614521749ac6f4";

async function test() {
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const { access_token } = await tokenRes.json();
  
  // Top 50 USA playlist
  const playlistId = "37i9dQZEVXbLRQDuF5jeBp";
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  
  const data = await res.json();
  console.log("Status:", res.status);
  if (data.items) {
    console.log("Got tracks:", data.items.length);
    const albums = data.items.map(item => item.track.album.name);
    console.log("First 5 albums:", albums.slice(0, 5));
  } else {
    console.log(data);
  }
}
test();
