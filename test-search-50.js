async function test() {
  const token = "BQC6-3k2dYAzT1UHpRpeKM-ZzEXUFdPwiLTh-SQImge6krQUv8Ww5rYl-j0GvVfwTyKC0rKiw1BeD8YzulSgGUSyflNmmV15_33mwYuajwI3Ch4xYdrE-OuBNDYr9SSKkuZLuvAwrvI";
  
  const res = await fetch('https://api.spotify.com/v1/search?q=tag:new&type=album&limit=50', {
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
