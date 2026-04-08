import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AtomTrigger } from '../index';
import { ChildModeDemo } from './components/ChildModeDemoLayouts';

const meta: Meta<typeof AtomTrigger> = {
  title: 'AtomTrigger Demo/Child Mode',
  component: AtomTrigger,
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicChildMode: Story = {
  render: () => <ChildModeDemo />,
};

export const ThresholdChildMode: Story = {
  render: () => <ChildModeDemo threshold={0.75} />,
};
