async function test() {
  const res = await fetch('https://itunes.apple.com/us/rss/topalbums/limit=100/json');
  const data = await res.json();
  const entries = data.feed.entry;
  const img = entries[0]['im:image'][2].label;
  console.log("Original:", img);
  console.log("High-res:", img.replace('170x170bb', '600x600bb'));
}
test();
