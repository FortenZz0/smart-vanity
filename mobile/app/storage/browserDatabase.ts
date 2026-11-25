import { defineCustomElement } from 'jeep-sqlite/dist/components/jeep-sqlite.js'
// Версия WebAssembly должна совпадать с версией sql.js, встроенной в jeep-sqlite.
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url&no-inline'

export async function registerBrowserDatabase() {
  defineCustomElement()

  let element = document.querySelector('jeep-sqlite')
  if (!element) {
    element = document.createElement('jeep-sqlite')
    const wasmDirectory = new URL('.', new URL(wasmUrl, document.baseURI))
    element.setAttribute('wasmpath', wasmDirectory.href.slice(0, -1))
    document.body.append(element)
  }

  // Компонент открывает IndexedDB асинхронно после добавления в документ.
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await element.isStoreOpen()) return
    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }
  throw new Error('The browser SQLite store did not open')
}
