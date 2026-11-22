import { spawnSync } from 'node:child_process'
import { closeSync, mkdtempSync, openSync, rmdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = fileURLToPath(new URL('../../', import.meta.url))
const target = process.env.SMART_VANITY_DEPLOY_TARGET ?? 'deploy@quiz.filinda.ru'

function run(command, args, stdio) {
  const result = spawnSync(command, args, { cwd: repository, stdio })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} failed (${result.signal ?? `exit ${result.status}`})`)
  }
}

function deploy() {
  if (!/^[\w.-]+@[\w.-]+$/.test(target)) {
    throw new Error('SMART_VANITY_DEPLOY_TARGET must have the form user@host')
  }

  const directory = mkdtempSync(join(tmpdir(), 'smart-vanity-'))
  const archive = join(directory, 'release.tar.gz')

  try {
    run('tar', [
      '-czf', archive,
      '--exclude=.env', '--exclude=.env.*', '--exclude=node_modules',
      '--exclude=*.sqlite', '--exclude=*.sqlite-*', '--exclude=*.sqlite3',
      '--exclude=*.sqlite3-*', '--exclude=*.db', '--exclude=*.db-*',
      'package.json', 'package-lock.json', 'mobile/package.json',
      'server/package.json', 'server/src',
    ], 'inherit')

    const archiveInput = openSync(archive, 'r')
    try {
      run('ssh', [
        '-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
        '-o', 'StrictHostKeyChecking=yes', target, '/usr/local/bin/smart-vanity-deploy',
      ], [archiveInput, 'inherit', 'inherit'])
    } finally {
      closeSync(archiveInput)
    }
  } finally {
    rmSync(archive, { force: true })
    rmdirSync(directory)
  }
}

try {
  deploy()
} catch (error) {
  console.error(`Deployment failed: ${error.message}`)
  process.exitCode = 1
}
