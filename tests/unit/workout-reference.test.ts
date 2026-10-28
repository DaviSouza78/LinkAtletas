import { describe, expect, it } from 'vitest'
import { workoutSchema } from '../../server/shared/validation.js'

const input = (videoUrl: unknown) => ({
  contractId: '33d5df11-653b-4fb0-b723-3c0435203d98',
  title: 'Treino demonstrativo',
  sport: 'Corrida',
  scheduledDate: '2026-10-27',
  instructions: '',
  status: 'draft',
  blocks: [{ name: 'Bloco demonstrativo', instructions: '', videoUrl }],
})

describe('referencia externa do treino', () => {
  it('aceita HTTPS como dado sem alterar o texto', () => {
    const url = 'https://example.com/video?v=1&time=2'
    expect(workoutSchema.parse(input(url)).blocks[0].videoUrl).toBe(url)
  })

  it('permite omitir a referencia', () => {
    expect(workoutSchema.safeParse(input(undefined)).success).toBe(true)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'http://example.com/video',
    'https://user:password@example.com/video',
    'https://example.com/\nvideo',
    'https://example.com/<script>',
    'https://example.com/"onclick=',
    'https://example.com/\\video',
    'https://example.com/' + 'a'.repeat(2000),
    { href: 'https://example.com/video' },
  ])('rejeita referencia insegura: %j', (value) => {
    expect(workoutSchema.safeParse(input(value)).success).toBe(false)
  })
})
