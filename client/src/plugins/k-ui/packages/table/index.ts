import type { App } from 'vue'
import Table from './src/Table.vue'
import './src/index.scss'

Table.install = (app: App): void => {
  app.component(Table.name, Table)
}

export default Table
