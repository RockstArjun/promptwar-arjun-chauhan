export class PIIScrubber {
  private static readonly PATTERNS = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  };

  public static scrub(text: string): string {
    let scrubbed = text;
    for (const [key, pattern] of Object.entries(this.PATTERNS)) {
      scrubbed = scrubbed.replace(pattern, `[REDACTED ${key.toUpperCase()}]`);
    }
    return scrubbed;
  }
}
