import type { App } from 'vue'
import Badge from './packages/badge/index'
import Form from './packages/form/index'
import Lazy from './packages/lazy/index'
import SelectTree from './packages/select-tree/index'
import Table from './packages/table/index'

const components = [Badge, Form, Lazy, SelectTree, Table]

const install = (app: App, opts = {}) => {
  components.forEach((component) => {
    app.component(component.name, component)
  })
}

export default {
  version: '0.2.0',
  install,
  Badge,
  Form,
  Lazy,
  SelectTree,
  Table,
}
