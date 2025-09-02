"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import { evaluateFormula, type CellValue } from "./engine"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as Tabs from "@radix-ui/react-tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"

function indexToCol(n: number) {
  let s = ""
  n += 1
  while (n > 0) {
    const rem = (n - 1) % 26
    s = String.fromCharCode(65 + rem) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

type ValidationRule = { type: 'none' | 'number' | 'list'; list?: string[] }

type CellMeta = {
  bold?: boolean
  italic?: boolean
  format?: 'general' | 'number' | 'currency' | 'percent'
  validation?: ValidationRule
}

function formatValue(value: CellValue, format: CellMeta['format']): string {
  const v = value
  if (format === 'number') {
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    return isNaN(n) ? String(v ?? '') : n.toFixed(2)
  }
  if (format === 'currency') {
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    return isNaN(n) ? String(v ?? '') : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)
  }
  if (format === 'percent') {
    const n = typeof v === 'number' ? v : parseFloat(String(v))
    return isNaN(n) ? String(v ?? '') : `${(n * 100).toFixed(1)}%`
  }
  return String(v ?? '')
}

function clone2D<T>(arr: T[][]): T[][] { return arr.map((row) => row.slice()) }

export default function MiniExcelGrid({ rows=10, cols=10 }: { rows?: number; cols?: number }) {
  const { user } = useUser()
  const userEmail = user?.primaryEmailAddress?.emailAddress || ""
  const userDoc = useQuery((api as any).users.getByEmail, userEmail ? { email: userEmail } : undefined)
  const listSheets = useQuery((api as any).userProgress.listPracticeSheets, userDoc?._id ? { userId: userDoc._id } : "skip") as any[] | undefined
  const upsertSheet = useMutation((api as any).userProgress.upsertPracticeSheet)
  const removeSheet = useMutation((api as any).userProgress.removePracticeSheet)

  // Multi-sheets
  const [sheets, setSheets] = useState<{ name: string; grid: CellValue[][]; meta: CellMeta[][] }[]>([
    { name: 'Feuille1', grid: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")), meta: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ format: 'general', validation: { type: 'none' } }))) }
  ])
  const [active, setActive] = useState(0)

  // Undo/redo stacks (per sheet)
  const [undo, setUndo] = useState<{ grid: CellValue[][]; meta: CellMeta[][] }[]>([])
  const [redo, setRedo] = useState<{ grid: CellValue[][]; meta: CellMeta[][] }[]>([])

  const grid = sheets[active].grid
  const meta = sheets[active].meta

  const [sel, setSel] = useState<{ r: number; c: number }>({ r: 0, c: 0 })
  const [selRange, setSelRange] = useState<{ r1: number; c1: number; r2: number; c2: number }>({ r1: 0, c1: 0, r2: 0, c2: 0 })
  const [dragging, setDragging] = useState(false)
  const [filling, setFilling] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)
  const clipboardRef = useRef<HTMLTextAreaElement>(null)
  const resizing = useRef<{ col: number; startX: number; startWidth: number } | null>(null)
  const [formula, setFormula] = useState<string>("")

  // View options
  const [freezeTopRow, setFreezeTopRow] = useState(true)
  const [freezeFirstCol, setFreezeFirstCol] = useState(true)

  // Filter/sort
  const [filterQuery, setFilterQuery] = useState<string>("")
  const [sortDir, setSortDir] = useState<'none' | 'asc' | 'desc'>('none')

  // Chart state
  const [chartData, setChartData] = useState<number[] | null>(null)

  // Persistence controls
  const [sheetName, setSheetName] = useState<string>('Feuille1')
  const [selectedSavedId, setSelectedSavedId] = useState<string>('')

  const addr = useMemo(() => `${indexToCol(sel.c)}${sel.r + 1}`, [sel])
  const selMeta = meta[sel.r]?.[sel.c] || { format: 'general', validation: { type: 'none' } }

  useEffect(() => {
    const onMouseUp = () => { setDragging(false); setFilling(false); resizing.current = null }
    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  }, [])

  useEffect(() => {
    const el = tableRef.current
    if (!el) return
    const onPaste = async (e: ClipboardEvent) => {
      let text = ''
      if (e.clipboardData) {
        text = e.clipboardData.getData('text/plain')
      } else if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.readText) {
        try { text = await (navigator as any).clipboard.readText() } catch {}
      }
      if (!text) return
      e.preventDefault()
      const rowsData = text.split(/\r?\n/).filter(Boolean).map((line) => line.split('\t'))
      pushUndo()
      setSheets((S) => {
        const copy = [...S]
        const sh = copy[active]
        const g = clone2D(sh.grid)
        for (let i = 0; i < rowsData.length; i++) {
          for (let j = 0; j < rowsData[i].length; j++) {
            const rr = selRange.r1 + i
            const cc = selRange.c1 + j
            if (rr < g.length && cc < g[0].length) {
              const val = rowsData[i][j]
              g[rr][cc] = val.startsWith('=') ? evaluateFormula(val, sh.grid) : (isNaN(parseFloat(val)) ? val : parseFloat(val))
            }
          }
        }
        copy[active] = { ...sh, grid: g }
        return copy
      })
    }
    el.addEventListener('paste', onPaste as any)
    return () => el.removeEventListener('paste', onPaste as any)
  }, [selRange, active, sheets])

  // Column resizing handlers
  function startColResize(e: React.MouseEvent, col: number) {
    e.preventDefault(); e.stopPropagation()
    const th = (e.currentTarget as HTMLElement).closest('th') as HTMLElement | null
    const width = th ? th.offsetWidth : 100
    resizing.current = { col, startX: e.clientX, startWidth: width }
    window.addEventListener('mousemove', onColResize as any, { passive: false } as any)
    window.addEventListener('mouseup', stopColResize as any)
  }
  function onColResize(ev: MouseEvent) {
    if (!resizing.current) return
    ev.preventDefault()
    const dx = ev.clientX - resizing.current.startX
    const newWidth = Math.max(60, Math.min(500, resizing.current.startWidth + dx))
    const colIndex = resizing.current.col
    const table = tableRef.current?.querySelector('table') as HTMLTableElement | null
    if (!table) return
    // Set width on header and all cells in the column
    const headerCell = table.querySelectorAll('thead th')[colIndex + 1] as HTMLElement | undefined
    if (headerCell) headerCell.style.width = newWidth + 'px'
    const bodyRows = table.querySelectorAll('tbody tr')
    bodyRows.forEach((tr) => {
      const td = tr.children[colIndex + 1] as HTMLElement | undefined
      if (td) td.style.width = newWidth + 'px'
    })
  }
  function stopColResize() {
    window.removeEventListener('mousemove', onColResize as any)
    window.removeEventListener('mouseup', stopColResize as any)
    resizing.current = null
  }

  // Cross-browser keyboard copy/paste normalization
  useEffect(() => {
    const onKeyDown = async (e: KeyboardEvent) => {
      const isCopy = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c'
      const isPaste = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v'
      if (isCopy) {
        e.preventDefault()
        copySelection()
      } else if (isPaste) {
        if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.readText) {
          e.preventDefault()
          try {
            const text = await (navigator as any).clipboard.readText()
            if (text) {
              const rowsData = text.split(/\r?\n/).filter(Boolean).map((line: string) => line.split('\t'))
              pushUndo()
              setSheets((S) => {
                const copy = [...S]
                const sh = copy[active]
                const g = clone2D(sh.grid)
                for (let i = 0; i < rowsData.length; i++) {
                  for (let j = 0; j < rowsData[i].length; j++) {
                    const rr = selRange.r1 + i
                    const cc = selRange.c1 + j
                    if (rr < g.length && cc < g[0].length) {
                      const val = rowsData[i][j]
                      g[rr][cc] = val.startsWith('=') ? evaluateFormula(val, sh.grid) : (isNaN(parseFloat(val)) ? val : parseFloat(val))
                    }
                  }
                }
                copy[active] = { ...sh, grid: g }
                return copy
              })
            }
          } catch {}
        }
      }
    }
    window.addEventListener('keydown', onKeyDown, { passive: false } as any)
    return () => window.removeEventListener('keydown', onKeyDown as any)
  }, [selRange, active, sheets])

  function pushUndo() {
    setUndo((U) => [...U, { grid: clone2D(grid), meta: clone2D(meta) }])
    setRedo([])
  }

  function undoAction() {
    setUndo((U) => {
      if (U.length === 0) return U
      const prev = U[U.length - 1]
      setRedo((R) => [...R, { grid: clone2D(grid), meta: clone2D(meta) }])
      setSheets((S) => {
        const copy = [...S]
        copy[active] = { ...copy[active], grid: clone2D(prev.grid), meta: clone2D(prev.meta) }
        return copy
      })
      return U.slice(0, -1)
    })
  }

  function redoAction() {
    setRedo((R) => {
      if (R.length === 0) return R
      const nxt = R[R.length - 1]
      setUndo((U) => [...U, { grid: clone2D(grid), meta: clone2D(meta) }])
      setSheets((S) => {
        const copy = [...S]
        copy[active] = { ...copy[active], grid: clone2D(nxt.grid), meta: clone2D(nxt.meta) }
        return copy
      })
      return R.slice(0, -1)
    })
  }

  function validateInput(r: number, c: number, val: string): boolean {
    const rule = meta[r]?.[c]?.validation || { type: 'none' }
    if (rule.type === 'number') {
      const n = parseFloat(val)
      return !isNaN(n)
    }
    if (rule.type === 'list') {
      const list = rule.list || []
      return list.includes(val)
    }
    return true
  }

  function setCell(r: number, c: number, val: string) {
    if (!validateInput(r, c, val)) {
      return
    }
    pushUndo()
    setSheets((S) => {
      const copy = [...S]
      const sh = copy[active]
      const g = clone2D(sh.grid)
      g[r][c] = val.startsWith('=') ? evaluateFormula(val, sh.grid) : (isNaN(parseFloat(val)) ? val : parseFloat(val))
      copy[active] = { ...sh, grid: g }
      return copy
    })
  }

  function setMetaCell(upd: (m: CellMeta) => void) {
    pushUndo()
    setSheets((S) => {
      const copy = [...S]
      const sh = copy[active]
      const m = clone2D(sh.meta)
      upd(m[sel.r][sel.c])
      copy[active] = { ...sh, meta: m }
      return copy
    })
  }

  function onCommit() {
    setCell(sel.r, sel.c, formula)
  }

  function clearSheet() {
    pushUndo()
    setSheets((S) => {
      const copy = [...S]
      copy[active] = {
        ...copy[active],
        grid: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")),
        meta: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ format: 'general', validation: { type: 'none' } })))
      }
      return copy
    })
  }

  function toggleBold() { setMetaCell((m) => { m.bold = !m.bold }) }
  function toggleItalic() { setMetaCell((m) => { m.italic = !m.italic }) }
  function changeFormat(fmt: CellMeta['format']) { setMetaCell((m) => { m.format = fmt }) }

  function changeValidation(type: ValidationRule['type'], list?: string) {
    setMetaCell((m) => {
      if (type === 'list') m.validation = { type, list: (list || '').split(',').map((s) => s.trim()).filter(Boolean) }
      else m.validation = { type }
    })
  }

  function startSelection(r: number, c: number) {
    setSel({ r, c })
    setSelRange({ r1: r, c1: c, r2: r, c2: c })
    setFormula(typeof grid[r][c] === 'string' ? (grid[r][c] as string) : String(grid[r][c] ?? ''))
    setDragging(true)
  }
  function extendSelection(r: number, c: number) {
    if (!dragging && !filling) return
    if (filling) { setSelRange((s) => ({ ...s, r2: r, c2: c })); return }
    setSelRange((s) => ({ ...s, r2: r, c2: c }))
  }

  function copySelection() {
    const { r1, c1, r2, c2 } = normalizeRange(selRange)
    const out: string[] = []
    for (let r = r1; r <= r2; r++) {
      const row: string[] = []
      for (let c = c1; c <= c2; c++) row.push(String(grid[r][c] ?? ''))
      out.push(row.join('\t'))
    }
    const text = out.join('\n')
    const navAny = typeof navigator !== 'undefined' ? (navigator as any) : undefined
    if (navAny?.clipboard?.writeText) {
      navAny.clipboard.writeText(text).catch(() => fallbackCopy(text))
    } else {
      fallbackCopy(text)
    }
  }

  function fallbackCopy(text: string) {
    try {
      if (!clipboardRef.current) return
      const ta = clipboardRef.current
      ta.value = text
      ta.focus()
      ta.select()
      document.execCommand('copy')
      ta.blur()
      ta.value = ''
    } catch {}
  }

  function normalizeRange(rg: { r1: number; c1: number; r2: number; c2: number }) {
    const r1 = Math.min(rg.r1, rg.r2)
    const c1 = Math.min(rg.c1, rg.c2)
    const r2 = Math.max(rg.r1, rg.r2)
    const c2 = Math.max(rg.c1, rg.c2)
    return { r1, c1, r2, c2 }
  }

  function applyFill() {
    const base = normalizeRange(selRange)
    const target = normalizeRange(selRange)
    const single = base.r1 === base.r2 && base.c1 === base.c2
    pushUndo()
    setSheets((S) => {
      const copyS = [...S]
      const sh = copyS[active]
      const g = clone2D(sh.grid)
      if (single) {
        const v = g[base.r1][base.c1]
        const n = typeof v === 'number' ? v : parseFloat(String(v))
        const inc = isNaN(n) ? null : 1
        for (let r = base.r1; r <= target.r2; r++) {
          for (let c = base.c1; c <= target.c2; c++) {
            if (r === base.r1 && c === base.c1) continue
            if (inc !== null) g[r][c] = (n + (r - base.r1) + (c - base.c1)) as any
            else g[r][c] = v
          }
        }
      } else {
        const height = base.r2 - base.r1 + 1
        const width = base.c2 - base.c1 + 1
        for (let r = base.r1; r <= target.r2; r++) {
          for (let c = base.c1; c <= target.c2; c++) {
            const src = { r: base.r1 + ((r - base.r1) % height), c: base.c1 + ((c - base.c1) % width) }
            g[r][c] = sh.grid[src.r][src.c]
          }
        }
      }
      copyS[active] = { ...sh, grid: g }
      return copyS
    })
  }

  function addSheet() {
    setSheets((S) => [...S, { name: `Feuille${S.length + 1}`, grid: Array.from({ length: rows }, () => Array.from({ length: cols }, () => "")), meta: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ format: 'general', validation: { type: 'none' } }))) }])
    setActive((a) => a + 1)
    setSheetName(`Feuille${sheets.length + 1}`)
  }

  function sortSelectedColumn(direction: 'asc' | 'desc') {
    pushUndo()
    setSheets((S) => {
      const copy = [...S]
      const sh = copy[active]
      const g = clone2D(sh.grid)
      const col = sel.c
      const body = g.slice(0)
      body.sort((a, b) => {
        const va = a[col]
        const vb = b[col]
        const na = typeof va === 'number' ? va : parseFloat(String(va))
        const nb = typeof vb === 'number' ? vb : parseFloat(String(vb))
        const aNum = !isNaN(na)
        const bNum = !isNaN(nb)
        let cmp = 0
        if (aNum && bNum) cmp = na - nb
        else cmp = String(va).localeCompare(String(vb))
        return direction === 'asc' ? cmp : -cmp
      })
      copy[active] = { ...sh, grid: body }
      return copy
    })
    setSortDir(direction)
  }

  function applyFilter(query: string) {
    setFilterQuery(query)
  }

  function buildChartFromSelection() {
    const { r1, r2, c1, c2 } = normalizeRange(selRange)
    if (c1 !== c2) { setChartData(null); return }
    const nums: number[] = []
    for (let r = r1; r <= r2; r++) {
      const v = grid[r][c1]
      const n = typeof v === 'number' ? v : parseFloat(String(v))
      if (!isNaN(n)) nums.push(n)
    }
    setChartData(nums.length ? nums : null)
  }

  const filteredRowIdx = useMemo(() => {
    if (!filterQuery.trim()) return null
    const q = filterQuery.toLowerCase()
    const col = sel.c
    const list: number[] = []
    for (let r = 0; r < grid.length; r++) {
      const v = String(grid[r][col] ?? '').toLowerCase()
      if (v.includes(q)) list.push(r)
    }
    return new Set(list)
  }, [filterQuery, grid, sel.c])

  async function saveCurrentSheet() {
    if (!userDoc?._id) return
    const name = sheetName || sheets[active].name
    const dataJson = JSON.stringify(sheets[active].grid)
    const metaJson = JSON.stringify(sheets[active].meta)
    await upsertSheet({ userId: userDoc._id, name, dataJson, metaJson })
  }

  function loadSheetById(id: string) {
    if (!listSheets) return
    const item = listSheets.find((s: any) => s._id === id)
    if (!item) return
    try {
      const data = JSON.parse(item.dataJson)
      const m = JSON.parse(item.metaJson)
      setSheets((S) => {
        const copy = [...S]
        copy[active] = { name: item.name, grid: data, meta: m }
        return copy
      })
      setSheetName(item.name)
    } catch {}
  }

  async function deleteSheetById(id: string) {
    if (!id) return
    await removeSheet({ id })
    setSelectedSavedId("")
  }

  function insertRow(at: number) {
    pushUndo()
    setSheets((S) => {
      const copy = [...S]
      const sh = copy[active]
      const g = clone2D(sh.grid)
      const m = clone2D(sh.meta)
      const newRowVals = Array.from({ length: g[0].length }, () => "")
      const newRowMeta: CellMeta[] = Array.from({ length: m[0].length }, () => ({ format: 'general', validation: { type: 'none' } as ValidationRule } as CellMeta))
      g.splice(at, 0, newRowVals)
      m.splice(at, 0, newRowMeta)
      copy[active] = { ...sh, grid: g, meta: m }
      return copy
    })
  }

  const insertRowAbove = (r: number) => insertRow(r)
  const insertRowBelow = (r: number) => insertRow(r + 1)

  function insertCol(at: number) {
    pushUndo()
    setSheets((S) => {
      const copy = [...S]
      const sh = copy[active]
      const g = clone2D(sh.grid)
      const m = clone2D(sh.meta)
      for (let r = 0; r < g.length; r++) {
        g[r].splice(at, 0, "")
        m[r].splice(at, 0, { format: 'general', validation: { type: 'none' } as ValidationRule } as CellMeta)
      }
      copy[active] = { ...sh, grid: g, meta: m }
      return copy
    })
  }

  const insertColLeft = (c: number) => insertCol(c)
  const insertColRight = (c: number) => insertCol(c + 1)

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col shadow-sm">
      {/* Ribbon-like tabs */}
      <Tabs.Root defaultValue="home">
        <div className="border-b bg-background shadow-sm">
          <Tabs.List className="flex items-center gap-1 px-2 h-10">
            <Tabs.Trigger value="home" className="text-sm px-3 py-1 rounded data-[state=active]:bg-muted">Accueil</Tabs.Trigger>
            <Tabs.Trigger value="insert" className="text-sm px-3 py-1 rounded data-[state=active]:bg-muted">Insertion</Tabs.Trigger>
            <Tabs.Trigger value="data" className="text-sm px-3 py-1 rounded data-[state=active]:bg-muted">Données</Tabs.Trigger>
          </Tabs.List>
        </div>

        {/* Toolbar: Home */}
        <Tabs.Content value="home" className="border-b bg-muted/40">
      <div className="flex flex-wrap items-center gap-2 p-2 h-12">
        <div className="text-xs px-2 py-1 rounded bg-background border">{addr}</div>
        <Input value={formula} onChange={(e) => setFormula(e.target.value)} placeholder="=SUM(A1:B2)" className="flex-1" />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" onClick={onCommit} aria-label="Entrer (Entrée)">Entrer</Button>
            </TooltipTrigger>
            <TooltipContent>Entrer (Entrée)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={clearSheet} aria-label="Effacer la feuille">Effacer</Button>
            </TooltipTrigger>
            <TooltipContent>Effacer la feuille</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => insertRow(sel.r)}>+ Ligne (au-dessus)</Button>
          <Button size="sm" variant="outline" onClick={() => insertRow(sel.r + 1)}>+ Ligne (au-dessous)</Button>
          <Button size="sm" variant="outline" onClick={() => insertCol(sel.c)}>+ Colonne (à gauche)</Button>
          <Button size="sm" variant="outline" onClick={() => insertCol(sel.c + 1)}>+ Colonne (à droite)</Button>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant={selMeta.bold ? 'default' : 'outline'} onClick={() => toggleBold()} aria-label="Gras (Ctrl+B)"><span className="font-bold">B</span></Button>
              </TooltipTrigger>
              <TooltipContent>Gras (Ctrl+B)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant={selMeta.italic ? 'default' : 'outline'} onClick={() => toggleItalic()} aria-label="Italique (Ctrl+I)"><span className="italic">I</span></Button>
              </TooltipTrigger>
              <TooltipContent>Italique (Ctrl+I)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Select value={selMeta.format || 'general'} onValueChange={(v) => changeFormat(v as any)}>
            <SelectTrigger className="w-36 h-8">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">Général</SelectItem>
              <SelectItem value="number">Nombre (2 déc.)</SelectItem>
              <SelectItem value="currency">Monétaire (€)</SelectItem>
              <SelectItem value="percent">Pourcentage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Select value={selMeta.validation?.type || 'none'} onValueChange={(v) => changeValidation(v as any)}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue placeholder="Validation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Validation: Aucune</SelectItem>
              <SelectItem value="number">Validation: Numérique</SelectItem>
              <SelectItem value="list">Validation: Liste</SelectItem>
            </SelectContent>
          </Select>
          {selMeta.validation?.type === 'list' && (
            <Input placeholder="val1,val2" className="w-40 h-8" onBlur={(e) => changeValidation('list', e.target.value)} />
          )}
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={undoAction}>Annuler</Button>
          <Button size="sm" variant="outline" onClick={redoAction}>Rétablir</Button>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => sortSelectedColumn('asc')}>Trier ↑</Button>
          <Button size="sm" variant="outline" onClick={() => sortSelectedColumn('desc')}>Trier ↓</Button>
          <Input value={filterQuery} onChange={(e) => applyFilter(e.target.value)} placeholder={`Filtrer col ${indexToCol(sel.c)}`} className="w-40 h-8" />
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={freezeTopRow} onChange={(e) => setFreezeTopRow(e.target.checked)} /> Figer 1ère ligne</label>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={freezeFirstCol} onChange={(e) => setFreezeFirstCol(e.target.checked)} /> Figer 1ère colonne</label>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <Button size="sm" variant="outline" onClick={buildChartFromSelection}>Insérer graphique</Button>
      </div>
        </Tabs.Content>

        {/* Toolbar: Insert (placeholder) */}
        <Tabs.Content value="insert" className="border-b bg-muted/40">
          <div className="flex flex-wrap items-center gap-2 p-2 h-12">
            <span className="text-sm text-muted-foreground">Outils d'insertion (à compléter)</span>
          </div>
        </Tabs.Content>

        {/* Toolbar: Data (placeholder) */}
        <Tabs.Content value="data" className="border-b bg-muted/40">
          <div className="flex flex-wrap items-center gap-2 p-2 h-12">
            <span className="text-sm text-muted-foreground">Outils de données (à compléter)</span>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <div className="flex items-center gap-2 p-2 h-12 border-b bg-background/60 shadow-sm">
        <div className="flex items-center gap-2">
          <Input className="h-8 w-48" value={sheetName} onChange={(e) => setSheetName(e.target.value)} placeholder="Nom de la feuille" />
          <Button size="sm" onClick={saveCurrentSheet} disabled={!userDoc?._id}>Sauvegarder</Button>
        </div>
        <div className="mx-2 h-6 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Select value={selectedSavedId} onValueChange={(v) => { setSelectedSavedId(v); loadSheetById(v) }}>
            <SelectTrigger className="w-56 h-8">
              <SelectValue placeholder="Charger une feuille" />
            </SelectTrigger>
            <SelectContent>
              {(listSheets || []).map((s: any) => (
                <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => deleteSheetById(selectedSavedId)} disabled={!selectedSavedId}>Supprimer</Button>
        </div>
      </div>

      <div className="overflow-auto flex-1" ref={tableRef}
        onMouseLeave={() => { if (dragging && !filling) setDragging(false) }}
        onMouseUp={() => { if (filling) { applyFill(); setFilling(false) } }}
      >
        {/* Hidden textarea for legacy clipboard fallback */}
        <textarea ref={clipboardRef} aria-hidden="true" tabIndex={-1} style={{ position: 'fixed', left: -9999, top: 0, opacity: 0 }} />
        <table className="min-w-full border-separate border-spacing-0 select-none">
          <thead>
            <tr>
              <th className={`${freezeFirstCol ? 'sticky left-0' : ''} ${freezeTopRow ? 'sticky top-0' : ''} z-10 bg-muted/50 border px-2 text-xs w-10`}></th>
              {Array.from({ length: grid[0]?.length || cols }, (_, c) => (
                <th key={c} className={`${freezeTopRow ? 'sticky top-0' : ''} bg-muted/50 border px-2 text-xs relative group`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); insertColLeft(c) }}
                      title="Insérer une colonne à gauche"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1 rounded border"
                    >+G</button>
                    <span>{indexToCol(c)}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); insertColRight(c) }}
                      title="Insérer une colonne à droite"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1 rounded border"
                    >+D</button>
                    {/* Column resize handle */}
                    <span
                      onMouseDown={(e) => startColResize(e, c)}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100"
                      aria-label={`Redimensionner la colonne ${indexToCol(c)}`}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              (!filteredRowIdx || filteredRowIdx.has(r)) && (
              <tr key={r}>
                <th className={`${freezeFirstCol ? 'sticky left-0' : ''} bg-muted/50 border px-2 text-xs w-10 text-right relative group`}
                >
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); insertRowAbove(r) }}
                      title="Insérer une ligne au-dessus"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1 rounded border"
                    >+H</button>
                    <span>{r + 1}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); insertRowBelow(r) }}
                      title="Insérer une ligne au-dessous"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1 rounded border"
                    >+B</button>
                  </div>
                </th>
                {row.map((val, c) => {
                  const m = meta[r]?.[c] || { format: 'general', validation: { type: 'none' } }
                  const inSel = r >= Math.min(selRange.r1, selRange.r2) && r <= Math.max(selRange.r1, selRange.r2) && c >= Math.min(selRange.c1, selRange.c2) && c <= Math.max(selRange.c1, selRange.c2)
                  const isSel = r === sel.r && c === sel.c
                  const style: React.CSSProperties = { fontWeight: m.bold ? 700 : 400, fontStyle: m.italic ? 'italic' : 'normal' }
                  const invalid = m.validation?.type === 'number' && isNaN(parseFloat(String(val))) ? 'outline outline-1 outline-destructive' : ''
                  return (
                    <td
                      key={c}
                      className={`relative border min-w-[90px] h-8 px-2 text-sm align-middle ${isSel ? 'outline outline-2 outline-primary shadow-[0_0_0_2px_rgba(99,102,241,0.3)]' : ''} ${inSel ? 'bg-primary/5' : ''} ${invalid}`}
                      onMouseDown={() => startSelection(r, c)}
                      onMouseEnter={() => extendSelection(r, c)}
                      onClick={() => {
                        setSel({ r, c })
                        setFormula(typeof val === 'string' ? (val as string) : String(val ?? ''))
                      }}
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => setCell(r, c, e.currentTarget.textContent || '')}
                      style={style}
                    >
                      {formatValue(val, m.format)}
                      {isSel && (
                        <div
                          onMouseDown={(e) => { e.stopPropagation(); setFilling(true) }}
                          className="absolute right-0.5 bottom-0.5 w-2 h-2 bg-primary rounded-sm cursor-crosshair"
                          title="Poignée de recopie"
                        />
                      )}
                    </td>
                  )
                })}
              </tr>)
            ))}
          </tbody>
        </table>
      </div>
      {chartData && chartData.length > 0 && (
        <div className="border-t p-3">
          <div className="text-sm font-medium mb-2">Graphique (barres)</div>
          <svg width={Math.max(300, chartData.length * 30)} height={160}>
            {(() => {
              const max = Math.max(...chartData)
              const scale = (v: number) => (v / (max || 1)) * 120
              return chartData.map((v, i) => (
                <g key={i} transform={`translate(${10 + i * 30}, 10)`}>
                  <rect x={0} y={120 - scale(v)} width={20} height={scale(v)} fill="#16a34a" />
                  <text x={10} y={140} fontSize={10} textAnchor="middle">{v}</text>
                </g>
              ))
            })()}
          </svg>
        </div>
      )}
      <div className="flex items-center gap-2 border-t p-2 bg-muted/30">
        {sheets.map((sh, i) => (
          <Button key={i} size="sm" variant={i === active ? 'default' : 'outline'} onClick={() => { setActive(i); setSheetName(sh.name) }}>
            {sh.name}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={addSheet}>+ Nouvelle feuille</Button>
      </div>
    </div>
  )
}
