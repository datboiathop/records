const token = "BQBMlxW60g21f8kpTJnyDr_q6IcgQ9mMdX5ZAxgVLpdKWSDH5vCagdve-tGUsgOmsGzUZWBxYkk2C91sQ0w5GeeG9k_dzjVoP-1FFjsfbl87nx-gaEYY08LFumTvPtwgbbVOanZj7rc";

async function test() {
  console.log("Testing exact Postman request...");
  
  const res = await fetch('https://api.spotify.com/v1/search?q=tag:new&type=album&limit=10&offset=0', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log("Status:", res.status);
  if (!res.ok) {
    console.log("Error text:", await res.text());
  } else {
    const data = await res.json();
    console.log("Success! Found items:", data.albums?.items?.length);
  }
}

test();
