import { Ref } from 'vue';

export function mockStream(ref: Ref<string>, text: string, interval: number = 100) {
  let index = 0;
  
  const intervalId = setInterval(() => {
    if (index < text.length) {
      // Append a chunk of text (50 characters at a time for a natural streaming feel)
      const chunkSize = Math.min(50, text.length - index);
      ref.value += text.slice(index, index + chunkSize);
      index += chunkSize;
    } else {
      // Clear the interval when all text has been appended
      clearInterval(intervalId);
    }
  }, interval);
  
  // Return the interval ID so it can be cleared externally if needed
  return intervalId;
}