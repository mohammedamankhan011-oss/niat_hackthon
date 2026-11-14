import {
  acceptGuardianLink,
  createGuardianInvite,
  deleteGuardianLink,
  findUserByEmail,
  getGuardianLink,
  listLinksWhereIAmGuardian,
  listMyGuardians,
} from '../services/db.service.js';
import { AppError } from '../utils/AppError.js';
import { toGuardianItem, toInvite } from '../utils/serializers.js';

export async function invite(req, res) {
  const { email } = req.valid.body;

  if (email === req.user.email) {
    throw AppError.badRequest('You cannot invite yourself as a guardian', 'CANNOT_INVITE_SELF');
  }

  const guardian = await findUserByEmail(email);
  if (!guardian) {
    throw AppError.notFound(
      'No ScamShield account uses this email. Ask them to sign up first.',
      'USER_NOT_FOUND',
    );
  }

  const link = await createGuardianInvite(req.user.id, guardian.id);
  res.status(201).json({
    invite: { ...toInvite(link), other_user: { id: guardian.id, name: guardian.name, email: guardian.email } },
  });
}

export async function list(req, res) {
  const [mine, asGuardian] = await Promise.all([
    listMyGuardians(req.user.id),
    listLinksWhereIAmGuardian(req.user.id),
  ]);

  res.json({
    my_guardians: mine.map(toGuardianItem),
    people_i_protect: asGuardian.filter((row) => row.status === 'accepted').map(toGuardianItem),
    pending_invites_for_me: asGuardian.filter((row) => row.status === 'pending').map(toGuardianItem),
  });
}

export async function accept(req, res) {
  const link = await getGuardianLink(req.valid.params.id);
  if (!link || (link.guardian_id !== req.user.id && link.user_id !== req.user.id)) {
    throw AppError.notFound('Guardian invite not found', 'INVITE_NOT_FOUND');
  }
  if (link.guardian_id !== req.user.id) {
    throw AppError.forbidden('Only the invited guardian can accept this invite', 'NOT_INVITED_GUARDIAN');
  }
  if (link.status === 'accepted') {
    throw AppError.conflict('This invite has already been accepted', 'ALREADY_ACCEPTED');
  }

  const guardian = await acceptGuardianLink(link.id, req.user.id);
  res.json({ guardian: toInvite(guardian) });
}

export async function remove(req, res) {
  const link = await getGuardianLink(req.valid.params.id);
  // Either side of the link may remove it; others get a 404 so ids are not leaked.
  if (!link || (link.guardian_id !== req.user.id && link.user_id !== req.user.id)) {
    throw AppError.notFound('Guardian link not found', 'GUARDIAN_NOT_FOUND');
  }

  await deleteGuardianLink(link);
  res.json({ success: true });
}
