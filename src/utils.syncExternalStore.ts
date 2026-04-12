import React from 'react';

type Subscribe = (onStoreChange: () => void) => () => void;
type GetSnapshot<T> = () => T;
type UseSyncExternalStoreHook = <T>(
  subscribe: Subscribe,
  getSnapshot: GetSnapshot<T>,
  getServerSnapshot: GetSnapshot<T>,
) => T;

const reactUseSyncExternalStore = (
  React as typeof React & { useSyncExternalStore?: UseSyncExternalStoreHook }
).useSyncExternalStore;

const useClientSubscriptionEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export function useCompatSyncExternalStore<T>(
  subscribe: Subscribe,
  getSnapshot: GetSnapshot<T>,
  getServerSnapshot: GetSnapshot<T>,
): T {
  if (reactUseSyncExternalStore) {
    return reactUseSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  }

  const [snapshot, setSnapshot] = React.useState<T>(() => getServerSnapshot());
  const snapshotRef = React.useRef(snapshot);

  useClientSubscriptionEffect(() => {
    const updateSnapshot = () => {
      const nextSnapshot = getSnapshot();
      if (Object.is(snapshotRef.current, nextSnapshot)) {
        return;
      }

      snapshotRef.current = nextSnapshot;
      setSnapshot(nextSnapshot);
    };

    updateSnapshot();
    return subscribe(updateSnapshot);
  }, [subscribe, getSnapshot]);

  return snapshot;
}

export function getStableSnapshot<T>(
  ref: React.MutableRefObject<T>,
  nextSnapshot: T,
  isEqual: (current: T, next: T) => boolean,
): T {
  if (isEqual(ref.current, nextSnapshot)) {
    return ref.current;
  }

  ref.current = nextSnapshot;
  return nextSnapshot;
}
