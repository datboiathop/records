const clientId = "0b088af783414c3a9eb709012b936626";
const clientSecret = "0bb43de0f17d4bf2b6614521749ac6f4";

async function test() {
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
  console.log("\n===========================================");
  console.log("YOUR FRESH POSTMAN TOKEN:");
  console.log("===========================================\n");
  console.log(tokenData.access_token);
  console.log("\n===========================================\n");
}

test();
