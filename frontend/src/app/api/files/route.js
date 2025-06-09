import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const BASE_PATH = path.resolve(process.cwd(), '../vault')

function buildFileTree(dir) {
  let entries
  try {
    entries = fs.readdirSync(dir)
  } catch {
    return []
  }

  const items = []
  for (const name of entries) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      items.push({
        name,
        type: 'directory',
        children: buildFileTree(full),
      })
    } else {
      items.push({ name, type: 'file' })
    }
  }

  // directories first, then files
  items.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name)
    }
    return a.type === 'directory' ? -1 : 1
  })

  return items
}

export async function GET() {
  const tree = buildFileTree(BASE_PATH)
  return NextResponse.json({ files: tree })
}
