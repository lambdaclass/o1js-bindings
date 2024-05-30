import { ProvableBn254, ProvablePureBn254 } from '../../snarky.js';
import { FieldBn254 } from '../../lib/core-bn254.ts';
import {
    createDerivers,
    NonMethods,
    InferProvable as GenericInferProvable,
    InferJson,
    InferredProvable as GenericInferredProvable,
    IsPure as GenericIsPure,
    createHashInput,
    Constructor,
} from './provable-generic.ts';
import { Tuple } from '../../lib/util/types.ts';
import { GenericHashInput } from './generic.ts';

// external API
export {
    ProvableExtended,
    provable,
    provablePure,
    provableTuple,
    provableFromClass,
};

// internal API
export {
    NonMethods,
    HashInput,
    InferProvable,
    InferJson,
    InferredProvable,
    IsPure,
};

type ProvableExtension<T, TJson = any> = {
    toInput: (x: T) => { fields?: FieldBn254[]; packed?: [FieldBn254, number][] };
    toJSON: (x: T) => TJson;
    fromJSON: (x: TJson) => T;
    empty: () => T;
};
type ProvableExtended<T, TJson = any> = ProvableBn254<T> &
    ProvableExtension<T, TJson>;
type ProvablePureExtended<T, TJson = any> = ProvablePureBn254<T> &
    ProvableExtension<T, TJson>;

type InferProvable<T> = GenericInferProvable<T, FieldBn254>;
type InferredProvable<T> = GenericInferredProvable<T, FieldBn254>;
type IsPure<T> = GenericIsPure<T, FieldBn254>;

type HashInput = GenericHashInput<FieldBn254>;
const HashInput = createHashInput<FieldBn254>();

const { provable } = createDerivers<FieldBn254>();

function provablePure<A>(
    typeObj: A
): ProvablePureExtended<InferProvable<A>, InferJson<A>> {
    return provable(typeObj, { isPure: true }) as any;
}

function provableTuple<T extends Tuple<any>>(types: T): InferredProvable<T> {
    return provable(types) as any;
}

function provableFromClass<A, T extends InferProvable<A>>(
    Class: Constructor<T> & { check?: (x: T) => void; empty?: () => T },
    typeObj: A
): IsPure<A> extends true
    ? ProvablePureExtended<T, InferJson<A>>
    : ProvableExtended<T, InferJson<A>> {
    let raw = provable(typeObj);
    return {
        sizeInFields: raw.sizeInFields,
        toFields: raw.toFields,
        toAuxiliary: raw.toAuxiliary,
        fromFields(fields, aux) {
            return construct(Class, raw.fromFields(fields, aux));
        },
        check(value) {
            if (Class.check !== undefined) {
                Class.check(value);
            } else {
                raw.check(value);
            }
        },
        toInput: raw.toInput,
        toJSON: raw.toJSON,
        fromJSON(x) {
            return construct(Class, raw.fromJSON(x));
        },
        empty() {
            return Class.empty !== undefined
                ? Class.empty()
                : construct(Class, raw.empty());
        },
    } satisfies ProvableExtended<T, InferJson<A>> as any;
}

function construct<Raw, T extends Raw>(Class: Constructor<T>, value: Raw): T {
    let instance = Object.create(Class.prototype);
    return Object.assign(instance, value);
}
