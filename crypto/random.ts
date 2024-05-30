import { randomBytes as randomBytesNode } from 'https://deno.land/std@0.224.0/crypto/mod.ts';
export { randomBytes };

function randomBytes(n: number) {
  return new Uint8Array(randomBytesNode(n));
}
