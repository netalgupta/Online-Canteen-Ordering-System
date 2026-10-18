export function isSomaiyaEmail(email) {
  return /^[^\s@]+@somaiya\.edu$/i.test(email);
}

export function getPasswordPolicyError(password, label = 'Password') {
  if (password.length < 8) return `${label} must be at least 8 characters.`;
  if (!/[A-Z]/.test(password)) return `${label} must include at least one uppercase letter.`;
  if (!/[^A-Za-z0-9\s]/.test(password)) return `${label} must include at least one special character.`;
  return null;
}
