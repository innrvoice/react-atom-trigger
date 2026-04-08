import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { AtomTrigger } from '../index';
import { ChildModeInteractionHarness } from './components/DeterministicInteractionHarness';

const meta: Meta<typeof AtomTrigger> = {
  title: 'Internal Tests/AtomTrigger Interactions/Child Mode',
  component: AtomTrigger,
  tags: ['!autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicChildModeBehavior: Story = {
  render: () => <ChildModeInteractionHarness />,
  play: async ({ canvas, userEvent, step }) => {
    const triggerEnter = canvas.getByRole('button', { name: /trigger child enter/i });
    const triggerLeave = canvas.getByRole('button', { name: /trigger child leave/i });
    const observerReady = canvas.getByTestId('child-mode-observer-ready');
    const enteredCount = canvas.getByTestId('child-mode-entered');
    const leftCount = canvas.getByTestId('child-mode-left');
    const totalEvents = canvas.getByTestId('child-mode-total');
    const latestTarget = canvas.getByTestId('child-mode-latest-target');

    await step('Wait for child mode harness setup', async () => {
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
      });
    });

    await step('Observed child enters the root', async () => {
      await userEvent.click(triggerEnter);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('0');
        expect(totalEvents).toHaveTextContent('1');
        expect(latestTarget).toHaveTextContent('article');
      });
    });

    await step('Observed child leaves the root', async () => {
      await userEvent.click(triggerLeave);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('1');
        expect(totalEvents).toHaveTextContent('2');
      });
    });
  },
};

export const ThresholdChildModeBehavior: Story = {
  render: () => <ChildModeInteractionHarness threshold={0.75} />,
  play: async ({ canvas, userEvent, step }) => {
    const belowThreshold = canvas.getByRole('button', { name: /scroll below threshold/i });
    const triggerThresholdEnter = canvas.getByRole('button', { name: /trigger threshold enter/i });
    const triggerLeave = canvas.getByRole('button', { name: /trigger child leave/i });
    const observerReady = canvas.getByTestId('child-mode-observer-ready');
    const enteredCount = canvas.getByTestId('child-mode-entered');
    const leftCount = canvas.getByTestId('child-mode-left');
    const totalEvents = canvas.getByTestId('child-mode-total');
    const visibleRatio = canvas.getByTestId('child-mode-visible-ratio');
    const latestRatio = canvas.getByTestId('child-mode-latest-ratio');
    const threshold = canvas.getByTestId('child-mode-threshold');

    await step('Wait for threshold harness setup', async () => {
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
      });
    });

    await step('Stay below the threshold without entering', async () => {
      await userEvent.click(belowThreshold);
      await waitFor(() => {
        expect(threshold).toHaveTextContent('0.75');
        expect(visibleRatio).toHaveTextContent('0.74');
        expect(enteredCount).toHaveTextContent('0');
        expect(leftCount).toHaveTextContent('0');
        expect(totalEvents).toHaveTextContent('0');
      });
    });

    await step('Enter once the child crosses the threshold', async () => {
      await userEvent.click(triggerThresholdEnter);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('0');
        expect(totalEvents).toHaveTextContent('1');
        expect(latestRatio).toHaveTextContent('0.75');
      });
    });

    await step('Leave still happens after the child exits fully', async () => {
      await userEvent.click(triggerLeave);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('1');
        expect(totalEvents).toHaveTextContent('2');
      });
    });
  },
};
