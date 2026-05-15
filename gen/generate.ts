/**
 * Code generation pipeline for the RAIL0 SDK.
 *
 * Run with: pnpm generate
 *
 * Steps:
 *   1. Read gen/openapi.json
 *   2. Generate TypeScript types via openapi-typescript → src/api.ts
 *
 * Add future generation steps (resource stubs, mock factories, etc.) here.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const genDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(genDir, '..')

const SCHEMA_PATH = resolve(genDir, 'openapi.json')
const GENERATED_FILE = resolve(root, 'src/api.ts')

async function generateTypes(): Promise<void> {
  console.log(`Reading schema: ${SCHEMA_PATH}`)
  const schemaUrl = new URL(`file://${SCHEMA_PATH}`)
  const ast = await openapiTS(schemaUrl)
  const content = astToString(ast)

  await mkdir(resolve(root, 'src'), { recursive: true })
  await writeFile(GENERATED_FILE, content, 'utf-8')
  console.log(`Generated: ${GENERATED_FILE}`)
}

// ----------------------------------------------------------------
// Pipeline — add steps here as the project grows
// ----------------------------------------------------------------

await generateTypes()

console.log('Done.')
