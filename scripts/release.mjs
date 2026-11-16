#!/usr/bin/env node
/**
 * 发版包装：调用 changesets 完成版本升级与 CHANGELOG 生成，
 * 再创建 CI 约定的 chore(release) 提交。
 *
 * 用法：
 *   pnpm version:release   # 正式版本
 *   pnpm version:alpha     # 进入 alpha 预发布模式并升版本
 *   pnpm version:beta
 *   pnpm version:rc
 *   pnpm version:exit-pre  # 退出预发布模式，生成正式版本
 *
 * 提交信息为 `chore(release): 😊 publish v<version>`，
 * 推送到 main 后由 .github/workflows/release.yml 自动发布。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const changesetDir = join(root, '.changeset')
const packagesDir = join(root, 'packages')

function run(command, args) {
  console.log(`$ ${[command, ...args].join(' ')}`)
  execFileSync(command, args, { cwd: root, stdio: 'inherit' })
}

function git(...args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()
}

function fail(message) {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function pendingChangesets() {
  return readdirSync(changesetDir).filter(name => name.endsWith('.md') && name !== 'README.md')
}

function readPreState() {
  const file = join(changesetDir, 'pre.json')
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null
}

function readManifests() {
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const file = join(packagesDir, entry.name, 'package.json')
      if (!existsSync(file)) return null
      return JSON.parse(readFileSync(file, 'utf8'))
    })
    .filter(Boolean)
}

// ---- 参数 ----
const args = process.argv.slice(2)
const preIndex = args.indexOf('--pre')
const preid = preIndex >= 0 ? args[preIndex + 1] : undefined
const exitPre = args.includes('--exit-pre')
const showHelp = args.includes('--help') || args.includes('-h')

if (showHelp) {
  console.log('用法: pnpm version:release | version:alpha | version:beta | version:rc | version:exit-pre')
  process.exit(0)
}

if (preIndex >= 0 && (!preid || preid.startsWith('--'))) {
  fail('--pre 需要指定预发布标识，例如 --pre alpha')
}

// ---- 前置检查 ----
if (git('status', '--porcelain', '--untracked-files=no')) {
  fail('工作区存在未提交的改动，请先提交或暂存后再发版')
}

const pending = pendingChangesets()
if (!pending.length && !exitPre) {
  fail('没有待发布的 changeset，请先运行 pnpm changeset 记录变更')
}

const preState = readPreState()
const preTag = preState?.mode === 'pre' ? preState.tag : null

if (preid) {
  if (preTag) {
    if (preTag !== preid) fail(`当前已在 ${preTag} 预发布模式，请先运行 pnpm version:exit-pre`)
  } else {
    run('pnpm', ['exec', 'changeset', 'pre', 'enter', preid])
  }
}

if (exitPre) {
  if (!preTag) fail('当前不在预发布模式，无需退出')
  run('pnpm', ['exec', 'changeset', 'pre', 'exit'])
}

// ---- changesets 升版本 + 生成 changelog ----
run('pnpm', ['exec', 'changeset', 'version'])

const manifests = readManifests()
const versions = [...new Set(manifests.map(item => item.version))]
if (versions.length !== 1) fail(`升版本后包版本不一致（${versions.join(', ')}）`)
const version = versions[0]

// changesets 可能改写内部依赖范围，同步锁文件
run('pnpm', ['install', '--lockfile-only'])

// ---- 提交 ----
git('add', '-A', '.changeset', 'packages', 'pnpm-lock.yaml')
if (!git('status', '--porcelain')) fail('没有产生任何变更，未创建提交')

git('commit', '-m', `chore(release): 😊 publish v${version}`)

const branch = git('branch', '--show-current')
console.log(`\n✔ 已创建提交: chore(release): 😊 publish v${version}`)
console.log(`下一步: git push origin ${branch}`)
