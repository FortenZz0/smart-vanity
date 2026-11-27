import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'

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
let updatedManifest = manifest.replace(/<application\b[^>]*>/, (application) =>
  application.replace(/android:(icon|roundIcon)="[^"]*"/g, 'android:$1="@mipmap/ic_smart_vanity"'),
)
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
if (!updatedManifest.includes(filters)) {
  const end = '</activity>'
  if (!updatedManifest.includes(end)) throw new Error('Could not register the Android backup intent filters')
  updatedManifest = updatedManifest.replace(end, `${filters}\n        ${end}`)
}
if (updatedManifest !== manifest) await writeFile(manifestFile, updatedManifest)

const resources = new URL('../android/app/src/main/res/', import.meta.url)
const launcherResources = [
  ['../assets/logo.png', 'mipmap-nodpi/smart_vanity_logo.png'],
  ['../native/res/mipmap-anydpi-v26/ic_smart_vanity.xml', 'mipmap-anydpi-v26/ic_smart_vanity.xml'],
  ['../native/res/values/smart_vanity_icon.xml', 'values/smart_vanity_icon.xml'],
]
for (const [sourcePath, resourcePath] of launcherResources) {
  const destination = new URL(resourcePath, resources)
  await mkdir(new URL('./', destination), { recursive: true })
  await copyFile(new URL(sourcePath, import.meta.url), destination)
}

const notificationDrawables = new URL('../android/app/src/main/res/drawable-xxxhdpi/', import.meta.url)
await mkdir(notificationDrawables, { recursive: true })
await copyFile(
  new URL('../assets/notification_icon.png', import.meta.url),
  new URL('notification_icon.png', notificationDrawables),
)
