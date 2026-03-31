/**
 * Prophet Test Runner
 * 运行所有test-*.ts测试文件
 */

import { execSync } from 'child_process'
import { readdirSync } from 'fs'

const testFiles = readdirSync('.')
  .filter(f => f.startsWith('test-') && f.endsWith('.ts'))
  .sort()

console.log(`\n🧪 Prophet Test Suite - ${testFiles.length}个测试文件\n`)
console.log('='.repeat(60))

let passed = 0
let failed = 0
const failures: string[] = []

for (const file of testFiles) {
  process.stdout.write(`\n▶ ${file.padEnd(45)}`)
  
  try {
    execSync(`npx tsx ${file}`, {
      stdio: 'pipe',
      timeout: 30000
    })
    console.log(' ✅')
    passed++
  } catch (error) {
    console.log(' ❌')
    failed++
    failures.push(file)
  }
}

console.log('\n' + '='.repeat(60))
console.log(`\n📊 测试结果: ${passed}/${testFiles.length} 通过`)

if (failed > 0) {
  console.log(`\n❌ 失败的测试:`)
  failures.forEach(f => console.log(`   - ${f}`))
  process.exit(1)
} else {
  console.log('\n✅ 所有测试通过！')
}
