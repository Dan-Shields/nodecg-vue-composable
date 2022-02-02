# nodecg-vue-composable
### A set of Vue composables for interacting more predictably with NodeCG replicants.
#### Works with Vue 2 & Vue 3 thanks to [vue-demi](https://github.com/vueuse/vue-demi).

Using a `ReactiveReplicant` is a happy medium between manually syncing a vue reactive value with a nodecg replicant on every change and not using reactivity at all. It forces you to be explicit about when a replicant should be updated while still providing reactivity for easy `v-model` binding.

## Usage
**Note**: use of composables requires the [Vue Composition API](https://v3.vuejs.org/guide/composition-api-introduction.html), either importing it directly from Vue 3 or using the `@vue/composition-api` package with Vue 2. You are also required to create components using `defineComponent`.

### `ReactiveReplicant(name, namespace, opts)`

A (sort-of) two-way binding that keeps a separate copy of the latest replicant value locally which you're free to modify. Doesn't update the replicant itself until you explicitly tell it to.

Returns an object with the following properties:
- `data`: a `ref` that stores the current local value
- `changed`: a `ref` bool indicating if the local value is different to the replicant value
- `upToDate`: a `ref` bool indicating if the replicant has been updated since the local copy was first changed (if true saving will overwrite a change from elsewhere)
- `save()`: a function to commit the locally current value to the replicant
- `revert()`: a function to set `data` to the replicant value (clearing local changes)
- `loadDefault()`: a function to reset the replicant to its default value
- `oldData`: a readonly `ref` of the latest replicant value

Update the value (`data`) programatically or in a template binding and commit it with `save()`.

If the local value is out of sync when a new value comes in from the replicant, it won't update (indicated by `upToDate`). If it's unchanged however, `data` will be updated and propagate to your bindings.

#### Example

```html
<template>
    <div>
        <input v-model="lowerThird.data" />
        <button :disabled="!lowerThird.changed" @click="lowerThird.save()">
            SAVE
        </button>
        <button :disabled="!lowerThird.changed" @click="lowerThird.revert()">
            REVERT CHANGES
        </button>
        <button @click="lowerThird.loadDefault()">
            CLEAR
        </button>
    </div>
</template>

<script>
import { defineComponent } from 'vue' // or '@vue/composition-api' with vue 2
import { ReactiveReplicant } from 'nodecg-vue-composable'

export default defineComponent({
    setup() {
        const lowerThird = ReactiveReplicant('lowerThird', { defaultValue: '' })

        return {
            lowerThird
        }
    }
})
</script>

<template>
```

### `AssetReplicant(name)`
A read-only binding to an asset replicant with the name `assets:<name>`.

#### Example
```html
<template>
    <div>
        <select v-model="logo.data">
            <option disabled value="">Select a logo...</option>
            <option v-for="logoAsset in logos" :value="logoAsset.url">
                {{ logoAsset.name }}
            </option>
        </select>
        <button :disabled="!logo.changed" @click="logo.save()">
            SAVE
        </button>
        <button :disabled="!logo.changed" @click="logo.revert()">
            REVERT CHANGES
        </button>
        <button @click="logo.loadDefault()">
            CLEAR
        </button>
    </div>
</template>

<script>
import { defineComponent } from 'vue' // or '@vue/composition-api' with vue 2
import { ReactiveReplicant, AssetReplicant } from 'nodecg-vue-composable'

export default defineComponent({
    setup() {
        const logo = ReactiveReplicant('logo', { defaultValue: null })
        const logos = AssetReplicant('logos')

        return {
            logo,
            logos
        }
    }
})
</script>

<template>
```
### `DynamicReactiveReplicant(name, namespace, opts)`
If you want to use a name that is itself reactive use a `DynamicReactiveReplicant` (name suggestions welcome).

Only usage difference with `ReactiveReplicant` is that it returns a `ref` that wraps the reactive, so if you want to use it inside the setup function or another composable you need to access the `value` before `data`. Usage inside the template is unaffected as the unwrapping will be done for you.

I.e. instead of:

```javascript
const rep = ReactiveReplicant('repName')
rep.data = '....'
```
You need to do:
```javascript
const repName = toRef(props, 'repName')  // example reactive name

const rep = DynamicReactiveReplicant(repName)
rep.value.data = '....'
```

## Installation

### Vue 3
`npm install -D nodecg-vue-composable`
### Vue 2
`npm install -D @vue/composition-api nodecg-vue-composable`

Setup `@vue/composition-api` by adding the following to your entry file:
```javascript
import VueCompositionApi from '@vue/composition-api'

Vue.use(VueCompositionApi)
```
## Todo
- Add TypeScript typings
- Write some tests
- Come up with a better name for DynamicReactiveReplicant
