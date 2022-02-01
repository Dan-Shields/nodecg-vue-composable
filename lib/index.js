import { ref, watch, isRef, reactive } from 'vue-demi'
import clone from 'clone'

export function ReactiveReplicant(name, namespace, opts) {
	if (isRef(name)) {
		console.warn(`Tried to create a StaticReplicant using a reactive name (${name.value})`)
		return null
	}

	if (!namespace || typeof namespace !== 'string') {
		opts = namespace;
	}

    const rep = nodecg.Replicant(name, namespace, opts)

    let oldVal = clone(defaultValue)
    const newVal = ref(clone(defaultValue))
    const changed = ref(false)
    const upToDate = ref(true)

    function checkChanged() {
        changed.value = JSON.stringify(newVal.value) !== JSON.stringify(oldVal)
    }
    
    watch(newVal, checkChanged, { deep: true })

    rep.on('change', (newRepVal, oldRepVal) => {
        oldVal = clone(newRepVal)

        if (!oldRepVal) changed.value = false
                
        if (changed.value) {
            checkChanged()
            upToDate.value = !changed.value
        } else {
            newVal.value = clone(oldVal)
            upToDate.value = true
        }
    })

    function save() {
        rep.value = newVal.value
    }
    function revert() {
        newVal.value = clone(oldVal)
    }
    function loadDefault() {
        newVal.value = clone(opts?.defaultValue)
    }

    return reactive({
        data: newVal,
        oldData: oldVal,
        changed,
        save,
        revert,
        loadDefault
    })
}

export function DynamicReactiveReplicant(name, namespace, opts) {
	if (!isRef(name)) {
		console.warn(`Tried to create a DynamicReplicant using a static name (${name})`)
		return null
	}

    const repRef = ref(null)

    function setReplicant() {
        if (!(typeof name.value === 'string' || typeof name.value === 'number')) {
            repRef.value = null
        } else {
            repRef.value = ReactiveReplicant(name.value, namespace, opts)
        }
    }

    setReplicant()
    watch(name, () => {
        setReplicant()
    })

    return repRef
}

export function AssetReplicant(name, namespace) {
    const rep = nodecg.Replicant(`assets:${name}`, namespace)
    const newVal = ref([])

    rep.on('change', newVal => {
        newVal.value = clone(newVal)
    })

    return newVal
}
