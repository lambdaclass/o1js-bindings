/**
 * This file contains bindings for JSOO written in TS and integrated with our normal code base.
 * It is exposed to JSOO by populating a global variable with an object.
 * It gets imported as the first thing in ../../snarky.js so that the global variable is ready by the time JSOO code gets executed.
 */
import { prefixHashes, prefixHashesLegacy } from '../crypto/constants.ts';
import { Bigint256Bindings } from './bindings/bigint256.ts';
import { PallasBindings, VestaBindings, Bn254Bindings } from './bindings/curve.ts';
import { FpBindings, FqBindings, Bn254FpBindings, Bn254FqBindings } from './bindings/field.ts';
import { FpVectorBindings, FqVectorBindings, Bn254FpVectorBindings, Bn254FqVectorBindings } from './bindings/vector.ts';
import type * as wasmNamespace from '../compiled/node_bindings/plonk_wasm.cjs';
import {
  fieldsFromRustFlat,
  fieldsToRustFlat,
} from './bindings/conversion-base.ts';
import { proofConversion } from './bindings/conversion-proof.ts';
import { conversionCore } from './bindings/conversion-core.ts';
import { verifierIndexConversion } from './bindings/conversion-verifier-index.ts';
import { oraclesConversion } from './bindings/conversion-oracles.ts';
import { jsEnvironment } from './bindings/env.ts';
import { srs } from './bindings/srs.ts';

export { getRustConversion, RustConversion, Wasm };

const tsBindings = {
  jsEnvironment,
  prefixHashes,
  prefixHashesLegacy,
  ...Bigint256Bindings,
  ...FpBindings,
  ...FqBindings,
  ...Bn254FpBindings,
  ...Bn254FqBindings,
  ...VestaBindings,
  ...PallasBindings,
  ...Bn254Bindings,
  ...FpVectorBindings,
  ...FqVectorBindings,
  ...Bn254FpVectorBindings,
  ...Bn254FqVectorBindings,
  rustConversion: createRustConversion,
  srs: (wasm: Wasm) => srs(wasm, getRustConversion(wasm)),
};

// this is put in a global variable so that mina/src/lib/crypto/kimchi_bindings/js/bindings.js finds it
(globalThis as any).__snarkyTsBindings = tsBindings;

type Wasm = typeof wasmNamespace;

function createRustConversion(wasm: Wasm) {
  let core = conversionCore(wasm);
  let verifierIndex = verifierIndexConversion(wasm, core);
  let oracles = oraclesConversion(wasm);
  let proof = proofConversion(wasm, core);

  return {
    fp: { ...core.fp, ...verifierIndex.fp, ...oracles.fp, ...proof.fp },
    fq: { ...core.fq, ...verifierIndex.fq, ...oracles.fq, ...proof.fq },
    bn254Fp: { ...core.bn254Fp, ...verifierIndex.bn254Fp, ...proof.bn254Fp },
    fieldsToRustFlat,
    fieldsFromRustFlat,
    wireToRust: core.wireToRust,
    mapMlArrayToRustVector: core.mapMlArrayToRustVector,
  };
}

type RustConversion = ReturnType<typeof createRustConversion>;

let rustConversion: RustConversion | undefined;

function getRustConversion(wasm: Wasm) {
  return rustConversion ?? (rustConversion = createRustConversion(wasm));
}
