// 关闭窗口时检测是否有未保存的图像
window.onbeforeunload = () => {
  if (pen.drawed) {
    return '确定要关闭吗？'
  }
}

const drawModeSelect = document.querySelector('select[name="drawMode"]')
drawModeSelect.addEventListener('change', e => {
  pen.drawMode = drawModeSelect.value
})

const range = document.querySelector('input[type="range"]')
range.addEventListener('input', e => {
  pen.penSize = e.target.value
  document.querySelector('#penSizeText')
    .innerHTML = `${pen.penSize}px`
})

const color = document.querySelector('input[type="color"]')
color.addEventListener('input', e => {
  pen.color = e.target.value
})

const fillButton = document.querySelector('#isfill')
fillButton.addEventListener('click', e => {
  pen.fill = e.target.checked ? pen.color : 'none'
})

const clearButton = document.querySelector('#clear')
clearButton.addEventListener('click', e => {
  pen.node = null
  pen.XY = null
  pen.isDrawing = false
  pen.drawed = false
  svg.innerHTML = ''
})

const saveButton = document.querySelector('#save')
saveButton.addEventListener('click', e => {
  if (pen.drawed) {
    let blob = new Blob(
      [svg.outerHTML], {
        type: 'image/svg+xml'
      }
    )
    let link = URL.createObjectURL(blob)
    let a = document.createElement('a')
    a.setAttribute('href', link)
    a.download = 'paintboard.svg'
    a.click()
    pen.drawed = false
  }
})

const info = document.querySelector('#info')

const pen = {
  color: color.value,
  penSize: range.value,
  drawMode: drawModeSelect.value,
  strokeLinecap: 'round',
  isDrawing: false,
  node: null,
  fill: 'none',
  XY: {
    x: null,
    y: null
  },
  ctrlKey: false, // 是否按下ctrl键
  drawed: false, // 是否已经绘制过
}

let svgNodes = []

window.addEventListener('keydown', e => {
  // 撤销
  if (e.code === 'KeyZ' && e.ctrlKey) {
    if (pen.isDrawing == false) {
      if (svg.lastChild) {
        svgNodes.push(svg.lastChild)
        svg.removeChild(svg.lastChild)
      }
    }
  }
  // 还原
  if (e.code === 'KeyY' && e.ctrlKey) {
    if (pen.isDrawing == false) {
      if (svgNodes.length > 0) {
        svg.appendChild(svgNodes.pop())
      }
    }
  }
})

const svg = document.querySelector('svg')
// 移除右键菜单
svg.oncontextmenu = () => {
  return false
}
svg.addEventListener('mousedown', e => {
  if (e.button === 0) { // 左键
    info.style.display = 'none'
    pen.ctrlKey = e.ctrlKey
    pen.isDrawing = true
    pen.drawed = true
    pen.XY = getMouseXY(svg)
    switch (pen.drawMode) {
      case 'curve':
        pen.node = creatSVGElt('path', {
          d: `M ${pen.XY.x} ${pen.XY.y} L ${pen.XY.x} ${pen.XY.y}`,
          stroke: pen.color,
          'stroke-width': pen.penSize,
          'stroke-linecap': pen.strokeLinecap,
          fill: pen.fill,
        })
        svg.appendChild(pen.node)
        break
      case 'line':
        pen.node = creatSVGElt('line', {
          x1: pen.XY.x,
          y1: pen.XY.y,
          x2: pen.XY.x,
          y2: pen.XY.y,
          stroke: pen.color,
          'stroke-width': pen.penSize,
          'stroke-linecap': pen.strokeLinecap,
          fill: pen.fill,
        })
        svg.appendChild(pen.node)
        break
      case 'rect':
        pen.node = creatSVGElt('rect', {
          x: pen.XY.x,
          y: pen.XY.y,
          width: 0,
          height: 0,
          stroke: pen.color,
          'stroke-width': pen.penSize,
          'stroke-linecap': pen.strokeLinecap,
          fill: pen.fill,
        })
        svg.appendChild(pen.node)
        break
      case 'oval':
        pen.node = creatSVGElt('ellipse', {
          cx: pen.XY.x,
          cy: pen.XY.y,
          rx: 0,
          ry: 0,
          stroke: pen.color,
          'stroke-width': pen.penSize,
          'stroke-linecap': pen.strokeLinecap,
          fill: pen.fill,
        })
        svg.appendChild(pen.node)
        break
      default:
        break
    }
    window.addEventListener('mousemove', onMouseMove)
  } else if (e.button === 2) { // 右键
    pen.isDrawing = false
    if (pen.node) svg.removeChild(pen.node)
    pen.node = null
    pen.drawed = svg.children.length > 0
    window.removeEventListener('mousemove', onMouseMove)

  }
})
window.addEventListener('mouseup', () => {
  pen.isDrawing = false
  pen.ctrlKey = false
  pen.node = null
  window.removeEventListener('mousemove', onMouseMove)
})

function onMouseMove(e) {
  if (pen.isDrawing) {
    let { x, y } = getMouseXY(svg)
    switch (pen.drawMode) {
      case 'curve':
        drawCurve(x, y)
        break
      case 'line':
        drawLine(x, y)
        break
      case 'rect':
        drawRect(x, y)
        break
      case 'oval':
        drawOval(x, y)
        break
      default:
        break
    }
  }
}

function drawCurve(x, y) {
  let d = pen.node.getAttribute('d')
  d += ` L ${x} ${y}`
  let distance = Math.sqrt(
    Math.pow(x - pen.XY.x, 2) +
    Math.pow(y - pen.XY.y, 2)
  )
  if (distance > pen.penSize) {
    pen.node.setAttribute('d', d)
    console.log(`(${x}, ${y})`)
    pen.XY = { x, y }
  }
}

function drawLine(x, y) {
  pen.node.setAttribute('x2', x)
  pen.node.setAttribute('y2', y)
  let distance = Math.sqrt(
    Math.pow(pen.XY.x - x, 2) +
    Math.pow(pen.XY.y - y, 2)
  ).toFixed(2)
  console.log(`(${pen.XY.x}, ${pen.XY.y})->(${x}, ${y}) distance: ${distance}`)
  svg.appendChild(pen.node)
}

function drawRect(x, y) {
  let width = x - pen.XY.x
  let height = y - pen.XY.y

  if (pen.ctrlKey) {
    let min = Math.min(
      Math.abs(width),
      Math.abs(height)
    )

    if (width < 0) pen.node.setAttribute('x', pen.XY.x - min)
    if (height < 0) pen.node.setAttribute('y', pen.XY.y - min)
    pen.node.setAttribute('width', min)
    pen.node.setAttribute('height', min)

    console.log(`(${pen.XY.x}, ${pen.XY.y}) width:${min}, height:${min}`)
  } else {
    if (width < 0) {
      pen.node.setAttribute('x', x)
      pen.node.setAttribute('width', -width)
    } else {
      pen.node.setAttribute('width', width)
    }
    if (height < 0) {
      pen.node.setAttribute('y', y)
      pen.node.setAttribute('height', -height)
    } else {
      pen.node.setAttribute('height', height)
    }

    console.log(`(${pen.XY.x}, ${pen.XY.y}) width:${width}, height:${height}`)
  }
  svg.appendChild(pen.node)
}

function drawOval(x, y) {
  let rx = Math.abs(x - pen.XY.x)
  let ry = Math.abs(y - pen.XY.y)
  if (pen.ctrlKey) {
    let min = Math.min(rx, ry)
    pen.node.setAttribute('rx', min)
    pen.node.setAttribute('ry', min)
    console.log(`cx:${pen.XY.x} cy:${pen.XY.y} rx=ry:${min}`)
  } else {
    pen.node.setAttribute('rx', rx)
    pen.node.setAttribute('ry', ry)
    console.log(`cx:${pen.XY.x} cy:${pen.XY.y} rx:${rx} ry:${ry}`)
  }
  svg.appendChild(pen.node)
}

function creatSVGElt(tagName, attrs = {}, ...children) {
  let node = document.createElementNS('http://www.w3.org/2000/svg', tagName)

  for (let key in attrs) {
    node.setAttribute(key, attrs[key])
  }

  for (let child of children) {
    node.appendChild(child)
  }

  return node
}

function getMouseXY(node) {
  let rect = node.getBoundingClientRect()
  return {
    x: window.event.clientX - rect.left,
    y: window.event.clientY - rect.top,
  }
}
