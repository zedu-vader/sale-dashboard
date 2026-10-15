/** Joins class names, skipping falsy values. No conflict resolution: a passed className adds to the defaults. */
export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
