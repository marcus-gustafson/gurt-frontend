export async function readStreamToCallback(
  body: ReadableStream<Uint8Array>,
  onText: (txt: string) => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) onText(chunk);
  }
}
