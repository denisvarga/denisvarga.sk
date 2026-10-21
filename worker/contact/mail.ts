interface ContactSwitch {
  readonly CONTACT_ENABLED?: string | undefined;
  readonly CONTACT_MAIL?: SendEmail | undefined;
}

/** The hand-off runs only with the flag set to "true" and the mail binding present. */
export function isContactEnabled(env: ContactSwitch): boolean {
  return env.CONTACT_ENABLED?.trim() === 'true' && env.CONTACT_MAIL !== undefined;
}
