import { defineConfig } from 'vite'
import uniMod from '@dcloudio/vite-plugin-uni'
const uni = uniMod.default || uniMod

export default defineConfig({
  plugins: [typeof uni === 'function' ? uni() : uni]
})
