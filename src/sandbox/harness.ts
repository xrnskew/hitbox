import { PICTURE_ALIASES, PICTURE_NAMES, pictureUrl, UNKNOWN_PICTURE } from '@/core/pictures.ts'
import { createRunner, type Runner } from '@/core/runner.ts'
import runtime from './runtime.js?raw'

// Рисунки уходят в игру одной строкой данных перед обвязкой: у каждого — адрес SVG-картинки (data:).
// Только те, чьи имена есть в коде ученика (рисунков больше сотни, а игре нужны три-пять), и «?».
// Прежние имена («колобок») — те же картинки, что их замены: они остались в сохранённом коде учеников.
const ALL = [...PICTURE_NAMES, ...Object.keys(PICTURE_ALIASES)]
const urls = new Map<string, string>()
const url = (name: string) => urls.get(name) ?? urls.set(name, pictureUrl(name)).get(name)!

/** Строка данных с рисунками, которые упомянуты в коде. */
export function picturesFor(codes: string[]): string {
  const text = codes.join('\n')
  const used = ALL.filter((n) => text.includes(n))
  const data = Object.fromEntries([...used, UNKNOWN_PICTURE].map((n) => [n, url(n)]))
  return JSON.stringify({ urls: data, unknown: UNKNOWN_PICTURE })
}

// Место под данные — одна строка, как и сами данные: число строк обвязки не меняется.
const SLOT = '__TB_PICTURES__'
const inner = createRunner(`var __TB_PICS = ${SLOT};\n${runtime}`)

export const runner: Runner = {
  ...inner,
  // обвязка идёт до кода ученика, поэтому первое вхождение — точно наше
  buildDoc: (codes, config) => inner.buildDoc(codes, config).replace(SLOT, () => picturesFor(codes)),
}
