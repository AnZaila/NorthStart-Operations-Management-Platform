import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import './assets/style/base.scss'
import 'element-plus/dist/index.css'
import './assets/style/element-plus.scss'

import App from './App.vue'
import router from './router'
import { permissionDirective } from './directives/permission'
import { installButtonWave } from './plugins/wave-button'
import { useAppStore } from './stores/app'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
useAppStore()
app.use(router)
app.use(ElementPlus, { locale: zhCn })
installButtonWave(app)
app.directive('permission', permissionDirective)
app.mount('#app')
