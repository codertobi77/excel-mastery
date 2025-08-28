export type CellValue = number | string | null

function stripAbs(ref: string): string {
  return ref.replace(/\$/g, '')
}

function colToIndex(col: string): number {
  let idx = 0
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64)
  }
  return idx - 1
}

function parseRefRaw(ref: string): { r: number; c: number } | null {
  const clean = stripAbs(ref.toUpperCase())
  const m = /^([A-Z]+)(\d+)$/.exec(clean)
  if (!m) return null
  const c = colToIndex(m[1])
  const r = parseInt(m[2], 10) - 1
  return { r, c }
}

function parseRangeRaw(range: string): { r1: number; c1: number; r2: number; c2: number } | null {
  const parts = stripAbs(range).split(':')
  if (parts.length !== 2) return null
  const a = parseRefRaw(parts[0])
  const b = parseRefRaw(parts[1])
  if (!a || !b) return null
  return { r1: Math.min(a.r, b.r), c1: Math.min(a.c, b.c), r2: Math.max(a.r, b.r), c2: Math.max(a.c, b.c) }
}

function deepFlatten(input: any): any[] {
  if (Array.isArray(input)) return input.flatMap(deepFlatten)
  return [input]
}

function toNumber(v: any): number {
  if (typeof v === 'number') return v
  const n = parseFloat(String(v))
  return isNaN(n) ? NaN : n
}

export function evaluateFormula(input: string, grid: CellValue[][]): CellValue {
  const txt = (input || '').trim()
  if (!txt.startsWith('=')) return input
  let expr = txt.slice(1)

  // Replace ranges with R("A1:B3")
  expr = expr.replace(/(\$?[A-Z]+\$?\d+)\s*:\s*(\$?[A-Z]+\$?\d+)/gi, (_m, a, b) => `R("${a}:${b}")`)
  // Replace single refs with C("A1") — avoid replacing inside quotes or already wrapped
  expr = expr.replace(/"[^"]*"/g, (m) => m.replace(/\$/g, '\uFFFF')) // temp hide $
  expr = expr.replace(/(\$?[A-Z]+\$?\d+)/g, (m) => {
    // Skip if part of function name or already inside R("...")/C("...") arguments
    return `C("${m}")`
  })
  expr = expr.replace(/\uFFFF/g, '$')

  try {
    // Helper implementations bound to current grid
    const R = (rangeStr: string) => {
      const rg = parseRangeRaw(rangeStr)
      if (!rg) return []
      const out: any[][] = []
      for (let r = rg.r1; r <= rg.r2; r++) {
        const row: any[] = []
        for (let c = rg.c1; c <= rg.c2; c++) {
          row.push(grid[r]?.[c] ?? null)
        }
        out.push(row)
      }
      return out
    }
    const C = (refStr: string) => {
      const ref = parseRefRaw(refStr)
      if (!ref) return null
      return grid[ref.r]?.[ref.c] ?? null
    }

    const SUM = (...args: any[]) => {
      const flat = deepFlatten(args)
      return flat.reduce((s, v) => s + (toNumber(v) || 0), 0)
    }
    const AVERAGE = (...args: any[]) => {
      const nums = deepFlatten(args).map(toNumber).filter((n) => !isNaN(n))
      if (nums.length === 0) return 0
      return nums.reduce((s, n) => s + n, 0) / nums.length
    }
    const MIN = (...args: any[]) => {
      const nums = deepFlatten(args).map(toNumber).filter((n) => !isNaN(n))
      return nums.length ? Math.min(...nums) : 0
    }
    const MAX = (...args: any[]) => {
      const nums = deepFlatten(args).map(toNumber).filter((n) => !isNaN(n))
      return nums.length ? Math.max(...nums) : 0
    }

    const IF = (cond: any, a: any, b: any) => (cond ? a : b)
    const AND = (...args: any[]) => deepFlatten(args).every((v) => Boolean(v))
    const OR = (...args: any[]) => deepFlatten(args).some((v) => Boolean(v))

    const to2D = (range: any): any[][] => {
      if (Array.isArray(range) && Array.isArray(range[0])) return range
      if (Array.isArray(range)) return range.map((v) => [v])
      return [[range]]
    }
    const to1D = (range: any): any[] => {
      const arr = Array.isArray(range) ? range : [range]
      return Array.isArray(arr[0]) ? arr.flat() : arr
    }

    const VLOOKUP = (lookupValue: any, tableArray: any, colIndex: number, rangeLookup: boolean = true) => {
      const table = to2D(tableArray)
      const col = Math.max(1, Math.floor(colIndex)) - 1
      if (col < 0) return '#VALUE!'
      // Build first column
      const firstCol = table.map((row) => row[0])
      if (!rangeLookup) {
        for (let i = 0; i < table.length; i++) {
          if (String(firstCol[i]) === String(lookupValue)) return table[i][col] ?? '#N/A'
        }
        return '#N/A'
      } else {
        // approximate: last value <= lookup (assume sorted ascending)
        let idx = -1
        const numLookup = toNumber(lookupValue)
        for (let i = 0; i < firstCol.length; i++) {
          const v = toNumber(firstCol[i])
          if (!isNaN(numLookup) && !isNaN(v)) {
            if (v <= numLookup) idx = i
          } else {
            // fallback string compare
            if (String(firstCol[i]) <= String(lookupValue)) idx = i
          }
        }
        if (idx === -1) return '#N/A'
        return table[idx][col] ?? '#N/A'
      }
    }

    const INDEX = (range: any, rowNum: number, colNum: number = 1) => {
      const table = to2D(range)
      const r = Math.max(1, Math.floor(rowNum)) - 1
      const c = Math.max(1, Math.floor(colNum)) - 1
      return table[r]?.[c] ?? '#REF!'
    }

    const MATCH = (lookupValue: any, lookupArray: any, matchType: number = 1) => {
      const arr = to1D(lookupArray)
      const strLookup = String(lookupValue)
      const numLookup = toNumber(lookupValue)
      if (matchType === 0) {
        for (let i = 0; i < arr.length; i++) if (String(arr[i]) === strLookup) return i + 1
        return '#N/A'
      } else if (matchType === -1) {
        // smallest value >= lookup, assume descending
        let candidate = -1
        for (let i = 0; i < arr.length; i++) {
          const v = toNumber(arr[i])
          if (!isNaN(numLookup) && !isNaN(v)) {
            if (v >= numLookup) candidate = i + 1
          } else if (String(arr[i]) >= strLookup) candidate = i + 1
        }
        return candidate === -1 ? '#N/A' : candidate
      } else {
        // largest value <= lookup, assume ascending
        let candidate = -1
        for (let i = 0; i < arr.length; i++) {
          const v = toNumber(arr[i])
          if (!isNaN(numLookup) && !isNaN(v)) {
            if (v <= numLookup) candidate = i + 1
          } else if (String(arr[i]) <= strLookup) candidate = i + 1
        }
        return candidate === -1 ? '#N/A' : candidate
      }
    }

    // eslint-disable-next-line no-new-func
    const f = new Function(
      'SUM','AVERAGE','MIN','MAX','IF','AND','OR','VLOOKUP','INDEX','MATCH','R','C',
      `return (function(){
        return ${expr};
      })()`
    )
    const res = f(SUM, AVERAGE, MIN, MAX, IF, AND, OR, VLOOKUP, INDEX, MATCH, R, C)
    if (typeof res === 'number' && isFinite(res)) return res
    return (res === undefined || res === null) ? '' : String(res)
  } catch {
    return '#ERROR'
  }
}
