import { findSolution } from '../lib/sha256';

interface WorkerScope {
  addEventListener(
    type: 'message',
    listener: (event: MessageEvent<{ challenge?: unknown; difficulty?: unknown }>) => void,
  ): void;
  postMessage(message: unknown): void;
}

const scope = self as unknown as WorkerScope;

scope.addEventListener('message', (event) => {
  const { challenge, difficulty } = event.data ?? {};
  if (
    typeof challenge !== 'string' ||
    challenge.length < 10 ||
    typeof difficulty !== 'number' ||
    !Number.isInteger(difficulty) ||
    difficulty < 1 ||
    difficulty > 6
  ) {
    scope.postMessage({ error: 'invalid_challenge' });
    return;
  }

  const solution = findSolution(challenge, difficulty, {
    onProgress: (attempts) => scope.postMessage({ progress: attempts }),
  });

  if (solution === null) {
    scope.postMessage({ error: 'not_found' });
    return;
  }
  scope.postMessage({ solution });
});
