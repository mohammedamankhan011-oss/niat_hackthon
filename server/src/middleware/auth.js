import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { findUserById } from '../services/db.service.js';
import { AppError } from '../utils/AppError.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

export async function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw AppError.unauthorized('Please log in to continue', 'NO_TOKEN');
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw AppError.unauthorized('Invalid session. Please log in again.', 'INVALID_TOKEN');
  }

  if (typeof payload.sub !== 'string') {
    throw AppError.unauthorized('Invalid session. Please log in again.', 'INVALID_TOKEN');
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw AppError.unauthorized('This account no longer exists', 'USER_NOT_FOUND');
  }

  req.user = user;
  next();
}
