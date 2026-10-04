import Widget from './Widget.svelte'

window.CUSDIS = {}

const parent = window.parent
const target = document.querySelector('#root')

const dataset = window.__DATA__
const widget = new Widget({
  target,
  props: {
    attrs: dataset,
  },
})

function postMessage(event, data = {}) {
  parent.postMessage(
    JSON.stringify({
      from: 'cusdis',
      event,
      data,
    }),
  )
}

let lastHeight = 0
let resizeFrame

function requestResize() {
  window.cancelAnimationFrame(resizeFrame)
  resizeFrame = window.requestAnimationFrame(() => {
    const height = Math.ceil(
      Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        target?.scrollHeight || 0,
      ),
    )

    if (height !== lastHeight) {
      lastHeight = height
      postMessage('resize', height)
    }
  })
}

postMessage('onload')
requestResize()

if ('ResizeObserver' in window) {
  const resizeObserver = new ResizeObserver(requestResize)
  resizeObserver.observe(target)
}

const mutationObserver = new MutationObserver(requestResize)

mutationObserver.observe(target, {
  childList: true,
  subtree: true,
  attributes: true,
  characterData: true,
})

window.addEventListener('load', requestResize)
window.addEventListener('resize', requestResize)
