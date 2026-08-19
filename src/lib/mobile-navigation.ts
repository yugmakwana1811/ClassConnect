export function splitMobileNavigation<T>(items: readonly T[], primaryCount = 4) {
  const safePrimaryCount = Math.max(0, Math.floor(primaryCount));
  return {
    primary: items.slice(0, safePrimaryCount),
    overflow: items.slice(safePrimaryCount),
  };
}
