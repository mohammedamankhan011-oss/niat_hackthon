import { updateUserLanguage } from '../services/db.service.js';
import { toPublicUser } from '../utils/serializers.js';

export async function updateMe(req, res) {
  const user = await updateUserLanguage(req.user.id, req.valid.body.preferred_language);
  res.json({ user: toPublicUser(user) });
}
