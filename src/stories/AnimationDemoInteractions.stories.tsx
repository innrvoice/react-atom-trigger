import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { AnimationDemo } from './components/AnimationDemo';

const meta: Meta<typeof AnimationDemo> = {
  title: 'Internal Tests/Extended Demo Interactions',
  component: AnimationDemo,
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    viewportHeight: 540,
    defaultShowTriggers: true,
    scrollBehavior: 'instant',
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

export const InteractionTimeline: Story = {
  play: async ({ canvas, userEvent, step }) => {
    const mode = canvas.getByTestId('animation-demo-mode');
    const aircraft = canvas.getByTestId('animation-demo-aircraft');
    const transitionCount = canvas.getByTestId('animation-demo-transition-count');
    const lastEvent = canvas.getByTestId('animation-demo-last-event');
    const sunset = canvas.getByRole('button', { name: /jump to sunset/i });
    const night = canvas.getByRole('button', { name: /jump to night/i });
    const sunrise = canvas.getByRole('button', { name: /jump to sunrise/i });
    const day = canvas.getByRole('button', { name: /jump to day/i });

    await step('Initial state is day with no aircraft pass', async () => {
      await waitFor(() => {
        expect(mode).toHaveTextContent('Day');
        expect(aircraft).toHaveTextContent('None');
        expect(transitionCount).toHaveTextContent('0');
      });
    });

    await step('Jump to sunset from the middle trigger going down', async () => {
      await userEvent.click(sunset);
      await waitFor(() => {
        expect(mode).toHaveTextContent('Sunset');
        expect(aircraft).toHaveTextContent('Plane + heli');
        expect(transitionCount).toHaveTextContent('1');
        expect(lastEvent).toHaveTextContent('moving down');
      });
    });

    await step('Jump to night at the bottom trigger with plane only', async () => {
      await userEvent.click(night);
      await waitFor(() => {
        expect(mode).toHaveTextContent('Night');
        expect(aircraft).toHaveTextContent('Plane only');
        expect(transitionCount).toHaveTextContent('2');
        expect(lastEvent).toHaveTextContent('moving down');
      });
    });

    await step('Jump back up to sunrise with helicopter only', async () => {
      await userEvent.click(sunrise);
      await waitFor(() => {
        expect(mode).toHaveTextContent('Sunrise');
        expect(aircraft).toHaveTextContent('Heli only');
        expect(transitionCount).toHaveTextContent('3');
        expect(lastEvent).toHaveTextContent('moving up');
      });
    });

    await step('Jump to the top trigger and return to day with both aircraft', async () => {
      await userEvent.click(day);
      await waitFor(() => {
        expect(mode).toHaveTextContent('Day');
        expect(aircraft).toHaveTextContent('Plane + heli');
        expect(transitionCount).toHaveTextContent('4');
        expect(lastEvent).toHaveTextContent('moving up');
      });
    });
  },
};
