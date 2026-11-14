import bcrypt from 'bcrypt';
import { signToken } from '../middleware/auth.js';
import { createUser, findUserByEmailWithPassword } from '../services/db.service.js';
import { AppError } from '../utils/AppError.js';
import { toPublicUser } from '../utils/serializers.js';

const BCRYPT_ROUNDS = 12;
// Compared against when the email does not exist, so response time does not
// reveal which emails are registered.
const DUMMY_HASH = '$2b$12$boQTWd7s4s8JqLEk1b6PSeTGS4p7ndYh7/3TRNLwjcmHXtK1NHfca';

export async function signup(req, res) {
  const { name, email, password, preferred_language: preferredLanguage } = req.valid.body;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await createUser({ name, email, passwordHash, preferredLanguage });
  res.status(201).json({ token: signToken(user), user: toPublicUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.valid.body;
  const user = await findUserByEmailWithPassword(email);
  const matches = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);

  if (!user || !matches) {
    throw AppError.unauthorized('Incorrect email or password', 'INVALID_CREDENTIALS');
  }
  res.json({ token: signToken(user), user: toPublicUser(user) });
}

export async function me(req, res) {
  res.json({ user: toPublicUser(req.user) });
}
