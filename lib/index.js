import { ref, watch, isRef, reactive, computed, readonly } from 'vue-demi'
import clone from 'clone'

export function ReactiveReplicant(name, namespace, opts, returnListener = false) {
	if (isRef(name)) {
		console.warn(`Tried to create a StaticReplicant using a reactive name (${name.value})`)
		return null
	}

	if (!namespace || typeof namespace !== 'string') {
		opts = namespace;
	}

    const rep = nodecg.Replicant(name, namespace, opts)

    const newVal = ref(clone(opts?.defaultValue))
    const oldVal = ref(clone(opts?.defaultValue))
    const changed = ref(false)
    const upToDate = ref(true)

    function checkChanged() {
        changed.value = JSON.stringify(newVal.value) !== JSON.stringify(oldVal.value)
    }
    
    watch(newVal, checkChanged, { deep: true })

    const listener = (newRepVal, oldRepVal) => {
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
        newVal.value = clone(opts?.defaultValue)
    }

    const reactiveReplicant = reactive({
        data: newVal,
        oldData: readonly(oldVal),
        changed,
        save,
        revert,
        loadDefault
    })

    // TODO: find a better way of doing this.
    // It's important not to wrap a replicant in a reactive but this is ugly
    if (returnListener) {
        return {
            reactiveReplicant,
            listener
        }
    } else {
        return reactiveReplicant
    }
}

export function DynamicReactiveReplicant(name, namespace, opts) {
	if (!isRef(name)) {
		console.warn(`Tried to create a DynamicReplicant using a static name (${name})`)
		return null
	}

    const repRef = ref(null)

    function setReplicant(oldName) {
        // remove old listeners when we change the name to prevent potential memory leaks
        if (oldName && repRef.value) nodecg.Replicant(oldName).removeListener('change', repRef.value.listener)

        if (!(typeof name.value === 'string' || typeof name.value === 'number')) {
            repRef.value = null
        } else {
            repRef.value = ReactiveReplicant(name.value, namespace, opts, true)
        }
    }

    setReplicant()
    watch(name, (_, oldName) => {
        setReplicant(oldName)
    })

    return computed(() => repRef.value?.reactiveReplicant)
}

export function AssetReplicant(name, namespace) {
    const rep = nodecg.Replicant(`assets:${name}`, namespace)
    const newVal = ref([])

    rep.on('change', newVal => {
        newVal.value = clone(newVal)
    })

    return newVal
}
