import { spawnSync } from 'node:child_process'
import { closeSync, mkdtempSync, openSync, rmSync } from 'node:fs'
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
  const args = process.argv.slice(2)
  const isTest = args.length === 1 && args[0] === '--test'
  if (args.length && !isTest) throw new Error('Usage: deploy.mjs [--test]')
  if (!/^[\w.-]+@[\w.-]+$/.test(target)) {
    throw new Error('SMART_VANITY_DEPLOY_TARGET must have the form user@host')
  }

  const directory = mkdtempSync(join(tmpdir(), 'smart-vanity-'))
  const archive = join(directory, 'release.tar.gz')

  try {
    const clientFiles = []
    if (isTest) {
      const npm = process.env.npm_execpath
      if (!npm) throw new Error('Run the test deployment with npm run deploy:test')
      run(process.execPath, [
        npm, 'run', 'build', '--workspace', 'mobile', '--', '--outDir', join(directory, 'client'),
      ], 'inherit')
      clientFiles.push('-C', directory, 'client')
    }

    run('tar', [
      '-czf', archive,
      '--exclude=.env', '--exclude=.env.*', '--exclude=node_modules',
      '--exclude=*.sqlite', '--exclude=*.sqlite-*', '--exclude=*.sqlite3',
      '--exclude=*.sqlite3-*', '--exclude=*.db', '--exclude=*.db-*',
      'package.json', 'package-lock.json', 'mobile/package.json',
      'server/package.json', 'server/src',
      ...clientFiles,
    ], 'inherit')

    const archiveInput = openSync(archive, 'r')
    try {
      run('ssh', [
        '-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=10',
        '-o', 'StrictHostKeyChecking=yes', target,
        isTest ? '/usr/local/bin/smart-vanity-deploy-test' : '/usr/local/bin/smart-vanity-deploy',
      ], [archiveInput, 'inherit', 'inherit'])
    } finally {
      closeSync(archiveInput)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

try {
  deploy()
} catch (error) {
  console.error(`Deployment failed: ${error.message}`)
  process.exitCode = 1
}
