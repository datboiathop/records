async function test() {
  const token = "BQC6-3k2dYAzT1UHpRpeKM-ZzEXUFdPwiLTh-SQImge6krQUv8Ww5rYl-j0GvVfwTyKC0rKiw1BeD8YzulSgGUSyflNmmV15_33mwYuajwI3Ch4xYdrE-OuBNDYr9SSKkuZLuvAwrvI";
  
  // Let's test different limits to see where it breaks
  for (let limit of [20, 30, 40, 50]) {
    const res = await fetch(`https://api.spotify.com/v1/search?q=tag:new&type=album&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log(`Limit ${limit}: Status ${res.status}`);
  }
}
test();
