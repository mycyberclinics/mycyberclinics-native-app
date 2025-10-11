export function getPasswordRequirements(password: string) {
  return {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
    hasLetter: /[A-Za-z]/.test(password),
  };
}