import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const mobileDir = fileURLToPath(new URL('../', import.meta.url))
const androidDir = path.join(mobileDir, 'android')
const windows = process.platform === 'win32'
const wrapper = windows ? 'gradlew.bat' : './gradlew'
const gradleTasks = { '--debug': 'assembleDebug', '--release': 'assembleRelease' }

function run(command, args, cwd, shell = false) {
  const result = spawnSync(command, args, { cwd, shell, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} завершился с ошибкой (${result.signal ?? result.status}).`)
  }
}

async function buildApk() {
  const flags = process.argv.slice(2)
  const [flag] = flags
  if (flags.length !== 1 || !Object.hasOwn(gradleTasks, flag)) {
    throw new Error('Использование: npm run android:apk -- --debug или npm run android:apk -- --release')
  }
  if (!existsSync(path.join(androidDir, wrapper))) {
    throw new Error('Сначала создайте Android-проект командой npm run android:init.')
  }

  run(process.execPath, [process.env.npm_execpath, 'run', 'build'], mobileDir)
  run(process.execPath, [process.env.npm_execpath, 'run', 'android:sync'], mobileDir)
  const task = gradleTasks[flag]
  if (windows) run(`${wrapper} ${task}`, [], androidDir, true)
  else run(wrapper, [task], androidDir)

  const variant = flag.slice(2)
  const outputDir = path.join(androidDir, 'app', 'build', 'outputs', 'apk', variant)
  const { elements } = JSON.parse(await readFile(path.join(outputDir, 'output-metadata.json'), 'utf8'))
  if (!elements.length) throw new Error(`Gradle не вернул APK для варианта ${variant}.`)

  const distDir = path.join(androidDir, 'dist', variant)
  await mkdir(distDir, { recursive: true })
  for (const { outputFile } of elements) {
    const destination = path.join(distDir, outputFile)
    await copyFile(path.join(outputDir, outputFile), destination)
    console.log(`APK: ${destination}`)
  }
}

try {
  await buildApk()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
