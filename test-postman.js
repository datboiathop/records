const clientId = "0b088af783414c3a9eb709012b936626";
const clientSecret = "0bb43de0f17d4bf2b6614521749ac6f4";

async function test() {
  console.log("Testing Postman-style request...");
  
  // This is how Postman sends it when you use x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params
  });
  
  const tokenData = await tokenRes.json();
  console.log("Token response:", tokenData);
}

test();
