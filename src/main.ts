import { createApp } from 'vue'
import App from './App.vue'
import './styles/tokens.css'
import './styles/base.css'
import { registerServiceWorker } from './services/serviceWorker.ts'

createApp(App).mount('#app')
registerServiceWorker()
