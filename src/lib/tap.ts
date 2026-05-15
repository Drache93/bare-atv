import type { Action } from 'svelte/action'

export const tap: Action = (node) => {
  const press = () => node.classList.add('active')
  const release = () => node.classList.remove('active')
  node.addEventListener('pointerdown', press)
  node.addEventListener('pointerup', release)
  node.addEventListener('pointercancel', release)
  node.addEventListener('pointerleave', release)
  return {
    destroy() {
      node.removeEventListener('pointerdown', press)
      node.removeEventListener('pointerup', release)
      node.removeEventListener('pointercancel', release)
      node.removeEventListener('pointerleave', release)
    }
  }
}
