import { createApp } from 'vue'
import './registerServiceWorker'

import ELementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'dayjs/locale/zh-cn'

import SvgIcon from '_c/SvgIcon/index.vue'
import router from './router'
import './styles/index.scss'

import permDirective from './directive/perm'

import { store, key } from './store'
import App from './App.vue'

import './icons/index'
import './perm'
// 自己封装的一些组件
import KUI from './plugins/k-ui'

const app = createApp(App)

app.directive('perm', permDirective)

app.component('svg-icon', SvgIcon)

app.use(ELementPlus).use(store, key).use(router)

app.use(KUI)

app.mount('#app')
