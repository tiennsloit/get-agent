/**
 * Creates a throttled function that only invokes `fn`
 * at most once per every `delay` milliseconds.
 *
 * @param fn - The function to throttle.
 * @param delay - The number of milliseconds to throttle invocations to.
 * @returns A new throttled function.
 */
export function throttle<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let lastCall = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        const now = Date.now();

        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        } else if (timeoutId === null) {
            // Schedule the next allowed invocation
            timeoutId = setTimeout(() => {
                lastCall = Date.now();
                fn(...args);
                timeoutId = null;
            }, delay - (now - lastCall));
        }
    };
}