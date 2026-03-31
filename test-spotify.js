const clientId = "0b088af783414c3a9eb709012b936626";
const clientSecret = "0bb43de0f17d4bf2b6614521749ac6f4";

async function test() {
  console.log("Getting token...");
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  });
  
  const tokenData = await tokenRes.json();
  console.log("Token response:", tokenData);
  
  if (!tokenData.access_token) return;
  
  console.log("\nFetching albums...");
  const albumsRes = await fetch('https://api.spotify.com/v1/search?q=tag:new&type=album&limit=5', {
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`
    }
  });
  
  const albumsData = await albumsRes.json();
  console.log("Albums response status:", albumsRes.status);
  console.log("Found albums:", albumsData.albums?.items?.length || 0);
}

test();
