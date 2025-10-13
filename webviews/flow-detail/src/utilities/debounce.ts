
/**
 * Creates a debounced function that delays invoking `fn` until after `delay` milliseconds
 * have elapsed since the last time the debounced function was invoked.
 *
 * @param fn - The function to debounce.
 * @param delay - The number of milliseconds to delay.
 * @returns A new debounced function.
 */
export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        // Clear the previous timeout if it exists
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        // Set a new timeout to invoke the function after the delay
        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    };
}
