import type { Op } from '../types'

export function formatOp(op: Op) {
  switch (op) {
    case 'add':
      return '+'
    case 'sub':
      return '−'
    case 'mul':
      return '×'
    case 'div':
      return '÷'
  }
}

