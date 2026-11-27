import { copyFile, readFile, writeFile } from 'node:fs/promises'

const source = new URL('../native/SmartVanityBackupPlugin.java', import.meta.url)
const java = new URL('../android/app/src/main/java/ru/smartvanity/app/', import.meta.url)
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
await copyFile(source, new URL('SmartVanityBackupPlugin.java', java))

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
