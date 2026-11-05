export interface PasswordResetEmail {
  to: string;
  token: string;
}

/**
 * Placeholder for the email provider (a later phase). Intentionally a no-op:
 * raw reset tokens must never be logged. Tests spy on this to capture the token.
 */
export const mailer = {
  async sendPasswordReset(_email: PasswordResetEmail): Promise<void> {
    // no provider configured in Phase 3
  },
};