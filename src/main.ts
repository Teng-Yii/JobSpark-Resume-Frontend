import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// import 'element-plus/dist/index.css' // No need to import if using unplugin-element-plus/unplugin-auto-import correctly, but often safer to include base styles or if plugin config is minimal. Wait, with unplugin-vue-components + resolver, it usually handles css too if configured. But to be safe and simple:
// Actually, unplugin-vue-components resolver usually handles component styles.
// However, standard setup often suggests importing main css if not using the full styling plugin chain.
// Let's check vite config again. I didn't add 'importStyle' option to resolver, so default is usually css/sass.
// Let's adding basic element plus css import to avoid style issues if auto-import fails on styles.
// But wait, the better way is often just letting it be or install unplugin-element-plus.
// Given the requirements, I used unplugin-vue-components + unplugin-auto-import.
// Default resolver behavior: "If you use unplugin-vue-components, you don't need to manually import element-plus."
// But often we need `import 'element-plus/dist/index.css'` if we don't use `unplugin-element-plus` or specific resolver options.
// I will include it for safety as it's a common practice unless optimizing strictly.

import 'element-plus/dist/index.css'
import '@/styles/main.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
