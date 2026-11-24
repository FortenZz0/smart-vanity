import type { Meta, StoryObj } from '@storybook/vue3-vite'
import RitualCard from './RitualCard.vue'
import type { Ritual } from './ritual'

const ritual: Ritual = {
  id: 'demo',
  archivedAt: null,
  paused: false,
  skippedThrough: null,
  name: 'Утренний уход',
  schedule: { kind: 'daily' },
  reminders: [{ id: 'morning', time: '08:30' }],
}

const meta = {
  component: RitualCard,
  args: { ritual },
} satisfies Meta<typeof RitualCard>

export default meta
type Story = StoryObj<typeof meta>

export const Today: Story = {
  args: { now: new Date(2026, 10, 24, 8, 0) },
}

export const Tomorrow: Story = {
  args: { now: new Date(2026, 10, 24, 9, 0) },
}
