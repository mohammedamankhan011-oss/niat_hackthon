export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    preferred_language: user.preferred_language,
  };
}

export function toGuardianItem(row) {
  return {
    id: row.id,
    status: row.status,
    created_at: row.created_at,
    other_user: row.other_user
      ? { id: row.other_user.id, name: row.other_user.name, email: row.other_user.email }
      : null,
  };
}

export function toInvite(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    guardian_id: row.guardian_id,
    status: row.status,
    created_at: row.created_at,
  };
}
