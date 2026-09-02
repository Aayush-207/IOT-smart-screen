import { describe, it, expect } from 'vitest'
import { comparePriority, priorityLabel, PRIORITY_RANK } from '../src/lib/priority'

describe('comparePriority', () => {
  it('sorts higher priority first', () => {
    const items = ['routine', 'critical', 'timesensitive', 'emergency']
    expect([...items].sort(comparePriority)).toEqual([
      'emergency',
      'critical',
      'timesensitive',
      'routine',
    ])
  })

  it('treats unknown / null as routine', () => {
    expect(comparePriority(null, 'routine')).toBe(0)
    expect(comparePriority('nonsense' as unknown as string, 'timesensitive')).toBeGreaterThan(0)
  })

  it('rank is strictly increasing', () => {
    expect(PRIORITY_RANK.routine).toBeLessThan(PRIORITY_RANK.timesensitive)
    expect(PRIORITY_RANK.timesensitive).toBeLessThan(PRIORITY_RANK.critical)
    expect(PRIORITY_RANK.critical).toBeLessThan(PRIORITY_RANK.emergency)
  })
})

describe('priorityLabel', () => {
  it('maps codes to human labels', () => {
    expect(priorityLabel('timesensitive')).toBe('Time-sensitive')
    expect(priorityLabel('routine')).toBe('Routine')
  })
  it('falls back to routine for nullish', () => {
    expect(priorityLabel(null)).toBe('Routine')
  })
})
