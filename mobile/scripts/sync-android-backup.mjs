import { copyFile, readFile, writeFile } from 'node:fs/promises'

const source = new URL('../native/SmartVanityBackupPlugin.java', import.meta.url)
const buildFile = new URL('../android/app/build.gradle', import.meta.url)
const build = await readFile(buildFile, 'utf8')
const namespace = build.match(/^\s*namespace\s*(?:=\s*)?["']([\w.]+)["']/m)?.[1]
if (!namespace) throw new Error('Could not read the Android namespace')
const java = new URL(`../android/app/src/main/java/${namespace.replaceAll('.', '/')}/`, import.meta.url)
const main = new URL('MainActivity.java', java)
let activity = await readFile(main, 'utf8')
const registration = 'registerPlugin(SmartVanityBackupPlugin.class);'

if (!activity.includes(registration)) {
  if (activity.includes('super.onCreate(savedInstanceState);')) {
    activity = activity.replace('super.onCreate(savedInstanceState);', `${registration}\n        super.onCreate(savedInstanceState);`)
  } else {
    activity = activity.replace('extends BridgeActivity {', `extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        ${registration}
        super.onCreate(savedInstanceState);
    }
`)
  }
  if (!activity.includes(registration)) throw new Error('Could not register the Android backup plugin')
  await writeFile(main, activity)
}
const plugin = await readFile(source, 'utf8')
await writeFile(new URL('SmartVanityBackupPlugin.java', java), plugin.replace(/^package [\w.]+;/, `package ${namespace};`))

const releaseScript = new URL('../android/app/smart-vanity-release.gradle', import.meta.url)
await copyFile(new URL('../native/smart-vanity-release.gradle', import.meta.url), releaseScript)
const applyReleaseScript = "apply from: 'smart-vanity-release.gradle'"
if (!build.includes(applyReleaseScript)) {
  await writeFile(buildFile, `${build.trimEnd()}\n\n${applyReleaseScript}\n`)
}

const manifestFile = new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url)
const manifest = await readFile(manifestFile, 'utf8')
const filters = `<!-- Smart Vanity backup files -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:scheme="content" />
                <data android:scheme="file" />
                <data android:mimeType="application/vnd.smartvanity.backup" />
            </intent-filter>
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <data android:scheme="content" />
                <data android:scheme="file" />
                <data android:host="*" android:pathPattern=".*\\\\.sv" />
                <data android:mimeType="*/*" />
            </intent-filter>`
if (!manifest.includes(filters)) {
  const end = '</activity>'
  if (!manifest.includes(end)) throw new Error('Could not register the Android backup intent filters')
  await writeFile(manifestFile, manifest.replace(end, `${filters}\n        ${end}`))
}
