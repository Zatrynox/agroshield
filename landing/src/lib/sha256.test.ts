import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { findSolution, meetsDifficulty, sha256Hex } from './sha256';

const nodeHash = (value: string): string =>
  createHash('sha256').update(value, 'utf8').digest('hex');

describe('sha256Hex', () => {
  it('matches the published vectors', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(sha256Hex('The quick brown fox jumps over the lazy dog')).toBe(
      'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
    );
  });

  it('matches Node across padding boundaries and non-ASCII input', () => {
    const inputs = [
      'a'.repeat(55),
      'a'.repeat(56),
      'a'.repeat(64),
      'ñandú 🌱 suelo vivo',
      '1234567890'.repeat(30),
    ];
    for (const input of inputs) {
      expect(sha256Hex(input), `input length ${input.length}`).toBe(nodeHash(input));
    }
  });
});

describe('meetsDifficulty', () => {
  it('requires the exact number of leading hexadecimal zeroes', () => {
    expect(meetsDifficulty('abc', 0)).toBe(true);
    expect(meetsDifficulty('0abc', 1)).toBe(true);
    expect(meetsDifficulty('00abc', 2)).toBe(true);
    expect(meetsDifficulty('0aabc', 2)).toBe(false);
    expect(meetsDifficulty('00abc', 3)).toBe(false);
  });
});

describe('findSolution', () => {
  it('returns a solution whose hash satisfies the challenge', () => {
    const challenge = '1780000000000.nonce.signature';
    const solution = findSolution(challenge, 2, { maxAttempts: 200_000 });

    expect(solution).not.toBeNull();
    expect(solution).toMatch(/^[A-Za-z0-9]{1,64}$/);
    expect(meetsDifficulty(sha256Hex(`${challenge}:${solution}`), 2)).toBe(true);
  });

  it('returns null when the attempt budget is exhausted or stopped', () => {
    expect(findSolution('challenge', 6, { maxAttempts: 0 })).toBeNull();
    expect(
      findSolution('challenge', 1, { maxAttempts: 100_000, shouldStop: () => true }),
    ).toBeNull();
  });
});
