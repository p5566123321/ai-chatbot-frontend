export interface SseFrame {
  event: string;
  data: string;
}

function parseFrame(rawEvent: string): SseFrame | null {
  let eventType = "message";
  const dataLines: string[] = [];

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      eventType = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }

  if (dataLines.length === 0) return null;
  return { event: eventType, data: dataLines.join("\n") };
}

// Parses a text/event-stream body into individual { event, data } frames as they arrive.
// SSE frames are separated by a blank line ("\n\n"); everything else is buffered until a
// full frame has been read, since chunk boundaries from the network rarely line up with frame
// boundaries.
export async function* parseSseStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SseFrame> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let sepIndex;
      while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIndex);
        buffer = buffer.slice(sepIndex + 2);
        const frame = parseFrame(rawEvent);
        if (frame) yield frame;
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      const frame = parseFrame(buffer);
      if (frame) yield frame;
    }
  } finally {
    reader.releaseLock();
  }
}
