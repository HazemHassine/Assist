import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const BASE_PATH = path.resolve(process.cwd(), '../vault')

function safeJoin(...segments) {
  const resolved = path.normalize(path.join(...segments))
  if (!resolved.startsWith(BASE_PATH)) {
    throw new Error('Invalid file path')
  }
  return resolved
}

export async function GET(req, { params }) {
  const filename = params.filename.join('/')
  const full = safeJoin(BASE_PATH, filename)

  try {
    const stat = await fs.stat(full)
    if (stat.isDirectory()) {
      return NextResponse.json({ detail: 'Is a directory' }, { status: 400 })
    }
    const content = await fs.readFile(full, 'utf-8')
    return NextResponse.json({ content })
  } catch (e) {
    const code = e.code || e.errno
    const status = code === 'ENOENT' ? 404 : 500
    return NextResponse.json({ detail: e.message }, { status })
  }
}

export async function PATCH(req, { params }) {
  const filename = params.filename.join('/')
  const full = safeJoin(BASE_PATH, filename)
  const { newName } = await req.json()

  if (typeof newName !== 'string' || !newName.trim()) {
    return NextResponse.json(
      { detail: '`newName` must be a non-empty string' },
      { status: 400 }
    )
  }

  const dest = safeJoin(path.dirname(full), newName.trim())
  try {
    await fs.access(full)
    await fs.access(dest)
      .then(() => { throw new Error('Destination already exists') })
      .catch(() => {})

    await fs.rename(full, dest)
    const rel = path.relative(BASE_PATH, dest)
    return NextResponse.json({ oldName: filename, newName: rel })
  } catch (e) {
    const msg = e.message || String(e)
    const status =
      msg === 'Destination already exists'
        ? 409
        : e.code === 'ENOENT'
        ? 404
        : 500
    return NextResponse.json({ detail: msg }, { status })
  }
}

export async function POST(req, { params }) {
  const filename = params.filename.join('/')
  const full = safeJoin(BASE_PATH, filename)
  const body = await req.json()

  if (typeof body.content !== 'string') {
    return NextResponse.json(
      { detail: '`content` string is required to save' },
      { status: 400 }
    )
  }

  try {
    await fs.mkdir(path.dirname(full), { recursive: true })
    await fs.writeFile(full, body.content, 'utf-8')
    return NextResponse.json({ message: 'File saved' })
  } catch (e) {
    return NextResponse.json({ detail: e.message || String(e) }, { status: 500 })
  }
}
