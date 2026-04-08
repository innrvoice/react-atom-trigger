import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimationDemo } from './components/AnimationDemo';

const meta: Meta<typeof AnimationDemo> = {
  title: 'Examples/Extended Demo',
  component: AnimationDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: {
        inline: true,
      },
    },
  },
  args: {
    viewportHeight: 540,
    defaultShowTriggers: true,
    scrollBehavior: 'smooth',
  },
  decorators: [
    Story => (
      <div style={{ padding: 8 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Demo: Story = {};
