async function test() {
  const res = await fetch('https://itunes.apple.com/us/rss/topalbums/limit=100/json');
  const data = await res.json();
  const entries = data.feed.entry;
  console.log("Got albums:", entries.length);
  console.log("First album:", entries[0]['im:name'].label, "by", entries[0]['im:artist'].label);
  console.log("Image URL:", entries[0]['im:image'][2].label); // [2] is usually the largest (170x170)
}
test();
