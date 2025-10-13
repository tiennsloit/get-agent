/**
 * Compares two version strings and returns a negative value if v1 is less than
 * v2, 0 if they are equal, and a positive value if v1 is greater than v2.
 * @example
 * compareVersions('4.5.6', '1.2.3') // returns 1
 * compareVersions('7.8.9', '7.8.10') // returns -1
 * compareVersions('11.12.13', '11.12.13') // returns 0
 */
export function compareVersions(v1: string, v2: string): number {
    const v2ToUse = v2 || "0.0.0";
    const toNumbers = (v: string) => v.split('.').map(num => parseInt(num, 10));
    const [a1, a2, a3] = toNumbers(v1);
    const [b1, b2, b3] = toNumbers(v2ToUse);

    if (a1 !== b1) { return a1 - b1; }
    if (a2 !== b2) { return a2 - b2; }
    return a3 - b3;
}
