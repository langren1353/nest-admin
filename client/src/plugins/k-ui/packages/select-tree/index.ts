import type { App } from 'vue'
import SelectTree from './src/SelectTree.vue'

SelectTree.install = (app: App): void => {
  app.component(SelectTree.name, SelectTree)
}

export default SelectTree
