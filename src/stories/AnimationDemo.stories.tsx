import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnimationDemo } from './components/AnimationDemo';
import { animationDemoActionArgs, animationDemoArgTypes } from './storybookArgs';

const meta: Meta<typeof AnimationDemo> = {
  title: 'Examples/Extended Demo',
  component: AnimationDemo,
  parameters: {
    layout: 'fullscreen',
    controls: {
      expanded: true,
    },
    docs: {
      story: {
        inline: true,
      },
    },
  },
  args: {
    ...animationDemoActionArgs,
    viewportHeight: 540,
    defaultShowTriggers: true,
    scrollBehavior: 'smooth',
  },
  argTypes: animationDemoArgTypes,
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
