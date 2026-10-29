import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useOnline() {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

  const update = () => {
    online.value = navigator.onLine;
  };

  onMounted(() => {
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  });

  return { online };
}

export function useNow(intervalMs = 30_000) {
  const now = ref(new Date());
  let handle: ReturnType<typeof setInterval> | undefined;

  onMounted(() => {
    handle = setInterval(() => {
      now.value = new Date();
    }, intervalMs);
  });

  onBeforeUnmount(() => {
    if (handle) clearInterval(handle);
  });

  return now;
}
