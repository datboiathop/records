async function test() {
  const token = "BQC6-3k2dYAzT1UHpRpeKM-ZzEXUFdPwiLTh-SQImge6krQUv8Ww5rYl-j0GvVfwTyKC0rKiw1BeD8YzulSgGUSyflNmmV15_33mwYuajwI3Ch4xYdrE-OuBNDYr9SSKkuZLuvAwrvI";
  
  // Let's test if we can get more than 10 by using offsets
  let allAlbums = [];
  
  for (let offset of [0, 10, 20, 30, 40]) {
    const res = await fetch(`https://api.spotify.com/v1/search?q=tag:new&type=album&limit=10&offset=${offset}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      const count = data.albums?.items?.length || 0;
      console.log(`Offset ${offset}: Found ${count} albums`);
      if (count > 0) {
        allAlbums = allAlbums.concat(data.albums.items);
      }
    } else {
      console.log(`Offset ${offset}: Failed with status ${res.status}`);
    }
  }
  
  console.log(`Total unique albums found: ${new Set(allAlbums.map(a => a.id)).size}`);
}
test();
