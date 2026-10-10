// Обвязка игры: первый скрипт в iframe. Код ученика идёт вторым скриптом.
// Здесь нельзя писать закрывающий тег скрипта — он оборвёт документ.
// Снаружи виден только window.__TB (для второго скрипта).
;(function () {
  'use strict'

  var cfg = window.__TB_CFG || {}
  var nativeRAF = window.requestAnimationFrame.bind(window)

  function post(msg) {
    msg.tb = 1
    try {
      window.parent.postMessage(msg, '*')
    } catch {
      // родителя нет или он недоступен — игра работает и так
    }
  }

  // ===== Ошибки =====
  // У пойманной ошибки номер строки есть только в стеке.
  function lineOf(err) {
    var m = err && err.stack ? /srcdoc:(\d+)/.exec(String(err.stack)) : null
    return m ? Number(m[1]) : 0
  }
  var errorCount = 0
  function report(message, line) {
    errorCount++
    if (errorCount > 20) return
    post({ type: 'err', message: String(message), line: line || 0 })
  }
  window.onerror = function (message, source, lineno, colno, error) {
    // String(error) — с именем, например «ReferenceError: …», иначе перевод не сработает.
    report(error ? String(error) : message, lineOf(error) || lineno)
  }

  // ===== Фокус и клавиши =====
  function grab() {
    try {
      window.focus()
    } catch {
      // ничего
    }
    // при программном фокусе событие focus приходит не всегда — сообщаем сами
    post({ type: 'focus', on: document.hasFocus() })
  }
  if (cfg.focus) {
    grab()
    window.addEventListener('load', grab)
  }
  document.addEventListener('mousedown', grab)
  window.addEventListener('focus', function () {
    post({ type: 'focus', on: true })
  })
  window.addEventListener('blur', function () {
    releaseKeys()
    post({ type: 'focus', on: false })
  })

  var SCROLL_KEYS = {
    ArrowLeft: 1,
    ArrowRight: 1,
    ArrowUp: 1,
    ArrowDown: 1,
    ' ': 1,
    PageUp: 1,
    PageDown: 1,
    Home: 1,
    End: 1,
  }
  // Зажатые клавиши. Игра потеряла фокус (клик мимо, другое окно) — keyup до неё уже не дойдёт,
  // и движок думал бы, что пробел или стрелка зажаты навсегда: корабль стрелял бы и летел сам.
  // Поэтому на blur отпускаем их сами.
  var held = {}
  function releaseKeys() {
    var keys = Object.keys(held)
    held = {}
    for (var i = 0; i < keys.length; i++) {
      document.dispatchEvent(new KeyboardEvent('keyup', { key: keys[i], bubbles: true }))
    }
  }
  window.addEventListener(
    'keyup',
    function (e) {
      delete held[e.key]
    },
    true,
  )

  window.addEventListener(
    'keydown',
    function (e) {
      held[e.key] = 1
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        post({ type: 'run' })
        return
      }
      // стрелки внутри игры не прокручивают страницу
      if (SCROLL_KEYS[e.key]) e.preventDefault()
    },
    true,
  )

  // ===== Часы кадров =====
  // Движок сдвигает всё на фиксированное число пикселей за кадр. Чтобы на мониторе
  // 120 или 144 Гц игра не шла в 2 раза быстрее, кадры игры идут не чаще 60 раз в секунду.
  var INTERVAL = 1000 / 60
  var ctl = { hitboxes: !!cfg.hitboxes }
  var queue = []
  var nextId = 1
  var scheduled = false
  var last = -1

  window.requestAnimationFrame = function (cb) {
    var id = nextId++
    queue.push({ id: id, cb: cb })
    schedule()
    return id
  }
  window.cancelAnimationFrame = function (id) {
    for (var i = 0; i < queue.length; i++) {
      if (queue[i].id === id) {
        queue.splice(i, 1)
        return
      }
    }
  }

  function schedule() {
    if (scheduled || !queue.length) return
    scheduled = true
    nativeRAF(tick)
  }

  function tick(t) {
    scheduled = false
    if (last < 0 || t - last > INTERVAL * 4) last = t - INTERVAL
    if (t - last < INTERVAL - 2) {
      schedule()
      return
    }
    last += INTERVAL

    var batch = queue
    queue = []
    var failed = false
    for (var i = 0; i < batch.length; i++) {
      try {
        batch[i].cb(t)
      } catch (e) {
        failed = true
        report(String(e), lineOf(e))
      }
    }
    if (ctl.hitboxes) (HITBOXES[cfg.game] || drawCatchHitboxes)()
    if (failed && !queue.length) post({ type: 'stopped' })
    schedule()
  }

  window.addEventListener('load', function () {
    // второй скрипт не запустился (ошибка при разборе) или упал до первого кадра
    if (errorCount > 0 && !queue.length && !scheduled) post({ type: 'stopped' })
    post({ type: 'ready' })
  })

  // ===== Команды от песочницы =====
  window.addEventListener('message', function (e) {
    var d = e.data
    if (!d || d.tbc !== 1 || e.source !== window.parent) return
    if (d.type === 'ctl') {
      if (typeof d.hitboxes === 'boolean') ctl.hitboxes = d.hitboxes
    } else if (d.type === 'key') {
      // экранные кнопки ← → для планшетов
      document.dispatchEvent(new KeyboardEvent(d.down ? 'keydown' : 'keyup', { key: d.key, bubbles: true }))
    } else if (d.type === 'focus') {
      grab()
    }
  })

  // ===== Границы: то, что проверяет код столкновений, — у каждой игры своё =====
  // Корзинка: зона поимки из шага 3 и точки, которые проверяет checkCatch.
  function drawCatchHitboxes() {
    var c = window.ctx
    var px = window.playerX
    var py = window.playerY
    if (!c || typeof px !== 'number' || typeof py !== 'number') return
    c.save()
    c.lineWidth = 1.5
    c.setLineDash([5, 4])
    c.fillStyle = 'rgba(79, 195, 247, 0.12)'
    c.strokeStyle = 'rgba(79, 195, 247, 0.9)'
    c.fillRect(px - 34, py - 34, 68, 470 - py + 34)
    c.strokeRect(px - 34, py - 34, 68, 470 - py + 34)
    c.setLineDash([])
    c.font = '12px sans-serif'
    c.fillStyle = 'rgba(79, 195, 247, 1)'
    c.fillText('зона поимки', Math.max(2, Math.min(px - 30, 300)), py - 40)
    c.strokeStyle = '#e5b567'
    c.strokeRect(px, py - 30, 34, 34)
    var list = window.items
    if (list && list.length) {
      for (var i = 0; i < list.length; i++) {
        var it = list[i]
        if (!it || typeof it.x !== 'number' || typeof it.y !== 'number') continue
        c.strokeStyle = 'rgba(242, 139, 130, 0.85)'
        c.strokeRect(it.x, it.y - 30, 34, 34)
        c.fillStyle = '#f28b82'
        c.beginPath()
        c.arc(it.x, it.y, 3, 0, Math.PI * 2)
        c.fill()
      }
    }
    c.restore()
  }

  // Птичка: рамка птицы, трубы и низ экрана — то, что проверяет checkHit.
  function drawBirdHitboxes() {
    var c = window.ctx
    var bx = window.birdX
    var by = window.birdY
    if (!c || typeof bx !== 'number' || typeof by !== 'number') return
    c.save()
    c.lineWidth = 1.5
    var list = window.pipes
    var gap = window.pipeGap
    if (list && list.length && typeof gap === 'number') {
      c.setLineDash([5, 4])
      c.fillStyle = 'rgba(242, 139, 130, 0.18)'
      c.strokeStyle = 'rgba(242, 139, 130, 0.95)'
      for (var i = 0; i < list.length; i++) {
        var p = list[i]
        if (!p || typeof p.x !== 'number' || typeof p.top !== 'number') continue
        c.fillRect(p.x, 0, 52, p.top)
        c.strokeRect(p.x, 0, 52, p.top)
        c.fillRect(p.x, p.top + gap, 52, 470 - p.top - gap)
        c.strokeRect(p.x, p.top + gap, 52, 470 - p.top - gap)
      }
    }
    c.setLineDash([5, 4])
    c.strokeStyle = 'rgba(79, 195, 247, 1)'
    c.beginPath()
    c.moveTo(0, 460)
    c.lineTo(380, 460)
    c.stroke()
    c.font = 'bold 12px sans-serif'
    c.fillStyle = 'rgba(79, 195, 247, 1)'
    c.fillText('низ: y = 460', 300, 454)
    c.setLineDash([])
    c.lineWidth = 2
    c.strokeStyle = '#ffc83a'
    c.strokeRect(bx, by - 26, 34, 26)
    c.fillStyle = '#ffc83a'
    c.beginPath()
    c.arc(bx, by, 3, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }

  // Космос: рамки пришельцев (как в popal), пули, корабль и линия прорыва — то, что проверяет checkHits.
  function drawSpaceHitboxes() {
    var c = window.ctx
    var sx = window.shipX
    var sy = window.shipY
    if (!c || typeof sx !== 'number' || typeof sy !== 'number') return
    c.save()
    c.lineWidth = 1.5
    c.setLineDash([5, 4])
    c.strokeStyle = 'rgba(79, 195, 247, 1)'
    c.beginPath()
    c.moveTo(0, sy - 10)
    c.lineTo(380, sy - 10)
    c.stroke()
    c.font = 'bold 12px sans-serif'
    c.fillStyle = 'rgba(79, 195, 247, 1)'
    c.fillText('прорыв: y > ' + (sy - 10), 262, sy - 16)
    var list = window.enemies
    if (list && list.length) {
      c.fillStyle = 'rgba(242, 139, 130, 0.18)'
      c.strokeStyle = 'rgba(242, 139, 130, 0.95)'
      for (var i = 0; i < list.length; i++) {
        var a = list[i]
        if (!a || typeof a.x !== 'number' || typeof a.y !== 'number') continue
        c.fillRect(a.x, a.y - 30, 34, 30)
        c.strokeRect(a.x, a.y - 30, 34, 30)
      }
      c.setLineDash([])
      c.fillStyle = '#f28b82'
      for (var k = 0; k < list.length; k++) {
        var p = list[k]
        if (!p || typeof p.x !== 'number' || typeof p.y !== 'number') continue
        c.beginPath()
        c.arc(p.x, p.y, 3, 0, Math.PI * 2)
        c.fill()
      }
    }
    c.setLineDash([])
    var shots = window.bullets
    if (shots && shots.length) {
      c.strokeStyle = '#ffffff'
      for (var j = 0; j < shots.length; j++) {
        var b = shots[j]
        if (!b || typeof b.x !== 'number' || typeof b.y !== 'number') continue
        c.strokeRect(b.x - 1, b.y - 1, 6, 16)
      }
    }
    c.lineWidth = 2
    c.strokeStyle = '#ffc83a'
    c.strokeRect(sx, sy - 30, 34, 34)
    c.restore()
  }

  var HITBOXES = { catch: drawCatchHitboxes, bird: drawBirdHitboxes, space: drawSpaceHitboxes }

  // ===== Консоль: console.log попадает в панель под игрой =====
  var logBuf = []
  var logTimer = 0
  function short(v) {
    if (typeof v === 'number' && !Number.isInteger(v)) return Math.round(v * 100) / 100
    return v
  }
  function format(v) {
    if (typeof v === 'string') return v
    if (typeof v === 'number') return String(short(v))
    if (typeof v === 'function') return 'function ' + (v.name || '') + '()'
    if (v === undefined) return 'undefined'
    if (typeof v !== 'object' || v === null) return String(v)
    try {
      var seen = []
      return JSON.stringify(v, function (k, x) {
        if (typeof x === 'object' && x !== null) {
          if (seen.indexOf(x) >= 0) return '[повтор]'
          seen.push(x)
        }
        if (typeof x === 'function') return 'function ' + (x.name || '') + '()'
        return short(x)
      })
    } catch {
      return String(v)
    }
  }
  function flush() {
    logTimer = 0
    var batch = logBuf
    logBuf = []
    post({ type: 'log', entries: batch })
  }
  function pushLog(level, args) {
    var parts = []
    for (var i = 0; i < args.length; i++) parts.push(format(args[i]))
    var text = parts.join(' ')
    if (text.length > 400) text = text.slice(0, 400) + '…'
    var prev = logBuf[logBuf.length - 1]
    if (prev && prev.text === text && prev.level === level) prev.count++
    else logBuf.push({ level: level, text: text, count: 1 })
    if (logBuf.length > 200) logBuf.shift()
    if (!logTimer) logTimer = setTimeout(flush, 100)
  }
  ;['log', 'info', 'warn', 'error'].forEach(function (level) {
    var orig = console[level]
    console[level] = function () {
      try {
        pushLog(level === 'info' ? 'log' : level, arguments)
      } catch {
        // ничего
      }
      return orig.apply(console, arguments)
    }
  })

  // ===== Картинки: picture("ракета") — рисунок из набора HitBox =====
  // Данные — в __TB_PICS (строка перед обвязкой): у каждого рисунка адрес SVG-картинки.
  // picture(name, size) — холст size × size (по умолчанию 34), а на чётком экране (HiDPI) — крупнее, чтобы
  // рисунок не расплывался. SVG грузится не сразу: до этого холст пустой и дорисуется сам.
  var PICS = window.__TB_PICS || { urls: {}, unknown: '?' }
  var picScale = 1
  var picImages = {}
  var picCache = {}
  var picWarned = {}
  function picImage(key) {
    if (!picImages[key]) {
      picImages[key] = new Image()
      picImages[key].src = PICS.urls[key] || ''
    }
    return picImages[key]
  }
  Object.keys(PICS.urls).forEach(picImage)
  function picture(name, size) {
    var key = String(name)
    if (!PICS.urls[key]) {
      if (!picWarned[key]) {
        picWarned[key] = 1
        console.warn('Нет картинки «' + key + '» — вместо неё знак вопроса. Проверь имя: кнопка «Сменить» покажет все.')
      }
      key = PICS.unknown
    }
    var px = Math.min(1024, Math.max(1, Math.round((Number(size) || 34) * picScale)))
    var c = picCache[key + '@' + px]
    if (!c) {
      c = picCache[key + '@' + px] = document.createElement('canvas')
      c.width = c.height = px
    }
    if (!c.ready) {
      var img = picImage(key)
      if (img.complete && img.naturalWidth) {
        c.getContext('2d').drawImage(img, 0, 0, px, px)
        c.ready = true
      }
    }
    return c
  }
  window.picture = picture

  window.__TB = {
    // Ошибка, пойманная в try/catch вокруг кода вкладок.
    caught: function (e) {
      report(String(e), lineOf(e))
    },
    // Чёткий холст на любом экране: буфер больше, а для кода ученика холст
    // по-прежнему 380 × 470, и координаты не меняются.
    setupCanvas: function (canvas, ctx) {
      var ratio = (window.devicePixelRatio || 1) * ((window.innerWidth || 380) / 380)
      var s = Math.min(3, Math.max(1, ratio))
      picScale = s
      if (s < 1.05) return
      var proto = window.HTMLCanvasElement.prototype
      var wd = Object.getOwnPropertyDescriptor(proto, 'width')
      var hd = Object.getOwnPropertyDescriptor(proto, 'height')
      if (!wd || !hd || !wd.set || !hd.set) return
      var w = 380
      var h = 470
      function apply() {
        wd.set.call(canvas, Math.round(w * s))
        hd.set.call(canvas, Math.round(h * s))
        ctx.setTransform(s, 0, 0, s, 0, 0)
      }
      Object.defineProperty(canvas, 'width', {
        configurable: true,
        get: function () {
          return w
        },
        set: function (v) {
          w = Number(v) || 0
          apply()
        },
      })
      Object.defineProperty(canvas, 'height', {
        configurable: true,
        get: function () {
          return h
        },
        set: function (v) {
          h = Number(v) || 0
          apply()
        },
      })
      apply()
    },
  }
})()
