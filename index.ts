/// <reference types="@alvancamp/test-nodecg-types/augment-window" />
import NodeCG from '@alvancamp/test-nodecg-types';
import clone from 'clone';
import { computed, DeepReadonly, isRef, reactive, readonly, ref, Ref, watch } from 'vue-demi';

interface ReactiveReplicant<T> {
    data: T | undefined,
    oldData: DeepReadonly<T | undefined>,
    changed: boolean,
    save: () => void,
    revert: () => void,
    loadDefault: () => void
}

export function useReplicant<T>(name: string, namespace: string | undefined, opts: NodeCG.Replicant.Options<T> = {}) {
    return useReplicantRaw(name, namespace, opts).reactiveReplicant
}

function useReplicantRaw<T>(name: string, namespace: string | NodeCG.Replicant.Options<T> | undefined, opts: NodeCG.Replicant.Options<T> | undefined) {
	if (isRef(name)) {
		console.warn(`Tried to create a StaticReplicant using a reactive name (${name.value})`)
        throw Error(`Tried to create a StaticReplicant using a reactive name (${name.value})`)
	}

	if (opts === undefined && typeof namespace !== 'string') {
		opts = namespace;
	}

    let rep = typeof namespace === 'string' ? nodecg.Replicant<T>(name, namespace, opts) : nodecg.Replicant<T>(name, opts)

    // Vue wants to unwrap nested objects when declared in refs
    const newVal = ref<T>();
    const oldVal = ref<T>();
    newVal.value = clone(opts && "defaultValue" in opts ? opts.defaultValue : undefined)
    oldVal.value = clone(opts && "defaultValue" in opts ? opts.defaultValue : undefined)

    const changed = ref(false)
    const upToDate = ref(true)

    function checkChanged() {
        changed.value = JSON.stringify(newVal.value) !== JSON.stringify(oldVal.value)
    }
    
    watch(newVal, checkChanged, { deep: true })

    const listener = (newRepVal: T | undefined, oldRepVal: T | undefined) => {
        oldVal.value = clone(newRepVal)

        if (!oldRepVal) changed.value = false
                
        if (changed.value) {
            checkChanged()
            upToDate.value = !changed.value
        } else {
            newVal.value = clone(oldVal.value)
            upToDate.value = true
        }
    }

    rep.on('change', listener)

    function save() {
        rep.value = newVal.value
    }
    function revert() {
        newVal.value = clone(oldVal.value)
    }
    function loadDefault() {
        newVal.value = clone(opts && "defaultValue" in opts ? opts.defaultValue : undefined)
    }

    const reactiveReplicant: ReactiveReplicant<T> = reactive({
        data: newVal,
        oldData: readonly(oldVal),
        changed,
        save,
        revert,
        loadDefault
    })

    return {
        reactiveReplicant,
        listener
    }
}

export function useDynamicReplicant<T>(name: Ref<string>, namespace: string, opts: NodeCG.Replicant.Options<T> | undefined) {
	if (!isRef(name)) {
		console.warn(`Tried to create a DynamicReplicant using a static name (${name})`)
        throw Error(`Tried to create a DynamicReplicant using a static name (${name})`)
	}

    const repRef: Ref<{ reactiveReplicant: ReactiveReplicant<T>, listener: (newRepVal: T | undefined, oldRepVal: T | undefined) => void } | null> = ref(null)

    function setReplicant(oldName?: string) {
        // remove old listeners when we change the name to prevent potential memory leaks
        if (oldName && repRef.value) nodecg.Replicant<T>(oldName).removeListener('change', repRef.value.listener)

        if (!(typeof name.value === 'string' || typeof name.value === 'number')) {
            repRef.value = null
        } else {
            repRef.value = useReplicantRaw<T>(name.value, namespace, opts)
        }
    }

    setReplicant()
    watch(name, (_, oldName) => {
        setReplicant(oldName)
    })

    return computed(() => repRef.value?.reactiveReplicant)
}

export interface Asset {
    base: string,
    namespace: string,
    category: string,
    ext: string,
    name: string,
    sum: string,
    url: string
}

export function useAssetReplicant(name: string, namespace: string) {
    const rep = nodecg.Replicant<Asset[]>(`assets:${name}`, namespace)
    const newVal: Ref<Asset[]> = ref([])

    rep.on('change', (newRepVal: Asset[] | null | undefined) => {
        newVal.value = clone(newRepVal ?? [])
    })

    return newVal
}

/**
 * @deprecated Renamed to useReplicant
 */
export const ReactiveReplicant = useReplicant
/**
 * @deprecated Renamed to useDynamicReplicant
 */
export const DynamicReactiveReplicant = useDynamicReplicant
/**
 * @deprecated Renamed to useAssetReplicant
 */
export const AssetReplicant = useAssetReplicant
