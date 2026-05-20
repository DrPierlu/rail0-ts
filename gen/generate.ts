/**
 * Code generation pipeline for the RAIL0 SDK.
 *
 * Run with: pnpm generate
 *
 * Steps:
 *   1. Read the OpenAPI schema from the rail0 contract repo
 *   2. Generate TypeScript types via openapi-typescript → src/api.ts
 *
 * Schema source (in priority order):
 *   1. RAIL0_SCHEMA_URL env var — remote URL (future: published with each release)
 *   2. RAIL0_SCHEMA_PATH env var — absolute path to a local openapi.json
 *   3. Default: ../rail0-api/doc/openapi.json (sibling repo on the local filesystem)
 *
 * Add future generation steps (resource stubs, mock factories, etc.) here.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const genDir = dirname(fileURLToPath(import.meta.url))
const root = resolve(genDir, '..')

const GENERATED_FILE = resolve(root, 'src/api.ts')

function resolveSchemaSource(): URL {
  if (process.env.RAIL0_SCHEMA_URL) {
    return new URL(process.env.RAIL0_SCHEMA_URL)
  }
  const localPath = process.env.RAIL0_SCHEMA_PATH ?? resolve(root, '..', 'rail0-api', 'doc', 'openapi.json')
  return new URL(`file://${localPath}`)
}

async function generateTypes(): Promise<void> {
  const schemaUrl = resolveSchemaSource()
  console.log(`Reading schema: ${schemaUrl}`)
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
