/**
 * Hands a prompt from the landing page to the editor. Lives in sessionStorage
 * (not the store) so it survives a full page load between the two routes and
 * is consumed exactly once.
 */
const PREFIX = "pb:queued-prompt:";

export function queuePrompt(deckId: string, prompt: string) {
  try {
    sessionStorage.setItem(PREFIX + deckId, prompt);
  } catch {
    // Storage unavailable: the editor simply opens without sending.
  }
}

export function takeQueuedPrompt(deckId: string): string | null {
  try {
    const key = PREFIX + deckId;
    const prompt = sessionStorage.getItem(key);
    if (prompt !== null) sessionStorage.removeItem(key);
    return prompt;
  } catch {
    return null;
  }
}
