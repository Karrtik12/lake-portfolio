import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default {
    root: 'sources/',
    publicDir: '../static/',
    base: './',
    server: {
        host: true,
        open: true
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: false,
        target: 'esnext'
    },
    plugins: [
        wasm(),
        topLevelAwait()
    ]
}
