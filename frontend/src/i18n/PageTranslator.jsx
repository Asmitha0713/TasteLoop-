import { useEffect } from 'react'
import { translateTamilText, useTranslation } from './LanguageContext.jsx'

const textState = new WeakMap()
const attributeState = new WeakMap()
const translatedAttributes = ['placeholder', 'title', 'aria-label']

function translateNode(root, language) {
  if (!root) return
  const elements = root.nodeType === Node.ELEMENT_NODE ? [root, ...root.querySelectorAll('*')] : []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)

  textNodes.forEach(node => {
    if (['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName)) return
    const current = node.nodeValue
    const state = textState.get(node)
    const original = state && current === state.applied ? state.original : current
    if (!original.trim()) return
    const leading = original.match(/^\s*/)?.[0] || ''
    const trailing = original.match(/\s*$/)?.[0] || ''
    const clean = original.trim()
    const translated = language === 'ta' ? translateTamilText(clean) : clean
    const applied = `${leading}${translated}${trailing}`
    textState.set(node, { original, applied })
    if (current !== applied) node.nodeValue = applied
  })

  elements.forEach(element => {
    const states = attributeState.get(element) || {}
    translatedAttributes.forEach(attribute => {
      if (!element.hasAttribute(attribute)) return
      const current = element.getAttribute(attribute)
      const previous = states[attribute]
      const original = previous && current === previous.applied ? previous.original : current
      const applied = language === 'ta' ? translateTamilText(original) : original
      states[attribute] = { original, applied }
      if (current !== applied) element.setAttribute(attribute, applied)
    })
    attributeState.set(element, states)
  })
}

export default function PageTranslator() {
  const { language } = useTranslation()

  useEffect(() => {
    translateNode(document.body, language)
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') mutation.addedNodes.forEach(node => translateNode(node, language))
        else translateNode(mutation.target, language)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: translatedAttributes })
    return () => observer.disconnect()
  }, [language])

  return null
}
