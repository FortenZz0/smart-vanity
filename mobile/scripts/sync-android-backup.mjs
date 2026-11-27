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
