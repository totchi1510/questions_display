import crypto from 'crypto';

function getSalt(): string {
  return process.env.IP_HASH_SALT || process.env.SESSION_SECRET || '';
}

export function hashIp(ip: string): string {
  const salt = getSalt();
  // If no salt configured, return an opaque fallback to avoid storing raw IP
  if (!salt) return 'ip:unset-salt';
  return crypto.createHash('sha256').update(salt + ':' + ip).digest('hex');
}

