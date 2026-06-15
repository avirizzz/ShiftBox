const fetch = require('node-fetch');
(async () => {
  const cats = await fetch('http://localhost:3001/api/categories').then(r => r.json());
  const catId = cats[0].id;
  const res = await fetch('http://localhost:3001/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId: catId, itemName: 'Samsung TV' })
  });
  console.log(res.status, await res.text());
})();
