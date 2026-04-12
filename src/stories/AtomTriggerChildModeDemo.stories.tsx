import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChildModeDemo, type ChildModeDemoProps } from './components/ChildModeDemoLayouts';
import { atomTriggerActionArgs, atomTriggerArgTypes } from './storybookArgs';

const meta: Meta<ChildModeDemoProps> = {
  title: 'AtomTrigger Demo/Child Mode',
  component: ChildModeDemo,
  parameters: {
    layout: 'padded',
    controls: {
      expanded: true,
    },
  },
  args: {
    ...atomTriggerActionArgs,
    once: false,
    oncePerDirection: false,
    fireOnInitialVisible: false,
    rootMargin: '0px',
    threshold: 0,
  },
  argTypes: atomTriggerArgTypes,
};

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicChildMode: Story = {
  render: args => <ChildModeDemo {...args} />,
};

export const ThresholdChildMode: Story = {
  args: {
    threshold: 0.75,
  },
  render: args => <ChildModeDemo {...args} />,
};
