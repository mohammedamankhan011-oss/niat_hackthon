import { getTrends } from '../services/db.service.js';

export async function trends(_req, res) {
  const data = await getTrends();
  res.set('Cache-Control', 'public, max-age=60');
  res.json(data);
}
