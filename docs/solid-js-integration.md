# Basic SolidJS Integration

Create a simple useObservable hook:

```ts
import type { Observable, ObservableComputed, ObservablePrimitive } from '@legendapp/state';

import type { Accessor } from 'solid-js';

import { createMemo, from } from 'solid-js';

export function useObservable<T = any>(
  obs: Observable<T> | ObservableComputed<T> | ObservablePrimitive<T>,
): [get: Accessor<T>] {
  const signaled = from<T>((set) => {
    const val = obs.get();
    set(val as any);
    const dispose = obs.onChange(set);
    return () => dispose();
  });

  const memo = createMemo(() => {
    return signaled()!;
  });

  return [memo];
}
```

Use it in your component:

```tsx
import { createSignal, For, Show } from 'solid-js';

import { store } from './store'; // <- your tabular-state store instance

import { useObservable } from './useObservable';

function MyComponent() {
  const [rowsObs] = store.queryRows('users', {
    query: {
      age: {
        $gte: 18,
      },
    },
  });
  const [rows] = useObservable(rowsObs);

  return (
    <div>
      <For each={rows()}>
        {(user) => (
          <div>
            {user.firstName} {user.lastName}
          </div>
        )}
      </For>
    </div>
  );
}
```
