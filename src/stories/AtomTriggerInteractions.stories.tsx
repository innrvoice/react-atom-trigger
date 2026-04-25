import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import {
  FixedHeaderViewportHarness,
  InteractionHarness,
  MultiSentinelInteractionHarness,
  type InteractionHarnessProps,
} from './components/InteractionHarness';
import { StorySentinelStyles } from './components/StoryStyles';
import { atomTriggerActionArgs, atomTriggerArgTypes } from './storybookArgs';

type SentinelInteractionStoryArgs = InteractionHarnessProps & {
  threshold?: number;
};

const meta: Meta<SentinelInteractionStoryArgs> = {
  title: 'Internal Tests/AtomTrigger Interactions/Sentinel Mode',
  tags: ['!autodocs'],
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
    initialVerticalScrollTop: 0,
    threshold: 0,
  },
  argTypes: atomTriggerArgTypes,
  decorators: [
    Story => (
      <>
        <StorySentinelStyles />
        <Story />
      </>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const InteractionOnceOnly: Story = {
  args: {
    once: true,
  },
  render: args => <InteractionHarness {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    const triggerEnter = canvas.getByRole('button', { name: /trigger enter/i });
    const triggerLeave = canvas.getByRole('button', { name: /trigger leave/i });
    const reset = canvas.getByRole('button', { name: /reset/i });
    const observerReady = canvas.getByTestId('observer-ready');
    const enteredCount = canvas.getByTestId('entered');
    const leftCount = canvas.getByTestId('left');
    const totalEvents = canvas.getByTestId('total');

    await step('Wait for observer setup', async () => {
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
      });
    });

    await step('Trigger first enter event', async () => {
      await userEvent.click(triggerEnter);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(totalEvents).toHaveTextContent('1');
      });
    });

    await step('Verify once=true blocks second transition', async () => {
      await userEvent.click(triggerLeave);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('0');
        expect(totalEvents).toHaveTextContent('1');
      });
    });

    await step('Reset for manual checks', async () => {
      await userEvent.click(reset);
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
        expect(enteredCount).toHaveTextContent('0');
        expect(leftCount).toHaveTextContent('0');
        expect(totalEvents).toHaveTextContent('0');
      });
    });
  },
};

export const InteractionOncePerDirection: Story = {
  args: {
    oncePerDirection: true,
  },
  render: args => <InteractionHarness {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    const triggerEnter = canvas.getByRole('button', { name: /trigger enter/i });
    const triggerLeave = canvas.getByRole('button', { name: /trigger leave/i });
    const observerReady = canvas.getByTestId('observer-ready');
    const enteredCount = canvas.getByTestId('entered');
    const leftCount = canvas.getByTestId('left');
    const totalEvents = canvas.getByTestId('total');

    await step('Wait for observer setup', async () => {
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
      });
    });

    await step('Record one enter and one leave', async () => {
      await userEvent.click(triggerEnter);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('0');
        expect(totalEvents).toHaveTextContent('1');
      });

      await userEvent.click(triggerLeave);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('1');
        expect(totalEvents).toHaveTextContent('2');
      });
    });

    await step('Verify repeated cycles do not increment counts', async () => {
      await userEvent.click(triggerEnter);
      await userEvent.click(triggerLeave);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('1');
        expect(totalEvents).toHaveTextContent('2');
      });
    });
  },
};

export const InitialVisibleOnLoad: Story = {
  args: {
    fireOnInitialVisible: true,
    initialVerticalScrollTop: 120,
  },
  render: args => <InteractionHarness {...args} />,
  play: async ({ canvas, step }) => {
    const observerReady = canvas.getByTestId('observer-ready');
    const enteredCount = canvas.getByTestId('entered');
    const leftCount = canvas.getByTestId('left');
    const totalEvents = canvas.getByTestId('total');
    const latestType = canvas.getByTestId('latest-type');
    const latestInitial = canvas.getByTestId('latest-initial');

    await step('Fire enter immediately when the trigger starts visible', async () => {
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('0');
        expect(totalEvents).toHaveTextContent('1');
        expect(latestType).toHaveTextContent('enter');
        expect(latestInitial).toHaveTextContent('true');
      });
    });
  },
};

export const VerticalScrollBehavior: Story = {
  render: args => <InteractionHarness {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    const runVertical = canvas.getByRole('button', { name: /run vertical sequence/i });
    const observerReady = canvas.getByTestId('observer-ready');
    const enteredCount = canvas.getByTestId('entered');
    const leftCount = canvas.getByTestId('left');
    const totalEvents = canvas.getByTestId('total');
    const latestMovement = canvas.getByTestId('latest-movement');
    const latestPosition = canvas.getByTestId('latest-position');

    await step('Wait for observer setup', async () => {
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
      });
    });

    await step('Run controlled vertical transition sequence', async () => {
      await userEvent.click(runVertical);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('1');
        expect(totalEvents).toHaveTextContent('2');
        expect(latestMovement).toHaveTextContent('up');
        expect(latestPosition).toHaveTextContent('above');
      });
    });
  },
};

export const HorizontalScrollBehavior: Story = {
  render: args => <InteractionHarness {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    const runHorizontal = canvas.getByRole('button', { name: /run horizontal sequence/i });
    const observerReady = canvas.getByTestId('observer-ready');
    const enteredCount = canvas.getByTestId('entered');
    const leftCount = canvas.getByTestId('left');
    const totalEvents = canvas.getByTestId('total');
    const latestMovement = canvas.getByTestId('latest-movement');
    const latestPosition = canvas.getByTestId('latest-position');

    await step('Wait for observer setup', async () => {
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
      });
    });

    await step('Run controlled horizontal transition sequence', async () => {
      await userEvent.click(runHorizontal);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('1');
        expect(totalEvents).toHaveTextContent('2');
        expect(latestMovement).toHaveTextContent('left');
        expect(latestPosition).toHaveTextContent('left');
      });
    });
  },
};

export const MultiSentinelSharedRoots: Story = {
  render: args => <MultiSentinelInteractionHarness {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    const runVertical = canvas.getByRole('button', { name: /run shared vertical scroll/i });
    const runHorizontal = canvas.getByRole('button', { name: /run shared horizontal scroll/i });
    const firstReady = canvas.getByTestId('multi-first-observer-ready');
    const firstEntered = canvas.getByTestId('multi-first-entered');
    const firstLeft = canvas.getByTestId('multi-first-left');
    const secondEntered = canvas.getByTestId('multi-second-entered');
    const secondLeft = canvas.getByTestId('multi-second-left');
    const thirdEntered = canvas.getByTestId('multi-third-entered');
    const thirdLeft = canvas.getByTestId('multi-third-left');
    const fourthEntered = canvas.getByTestId('multi-fourth-entered');
    const fourthLeft = canvas.getByTestId('multi-fourth-left');
    const secondLatestMovement = canvas.getByTestId('multi-second-latest-movement');
    const thirdLatestMovement = canvas.getByTestId('multi-third-latest-movement');
    const thirdLatestPosition = canvas.getByTestId('multi-third-latest-position');
    const fourthLatestMovement = canvas.getByTestId('multi-fourth-latest-movement');
    const fourthLatestPosition = canvas.getByTestId('multi-fourth-latest-position');

    await step('Wait for multi-sentinel harness setup', async () => {
      await waitFor(() => {
        expect(firstReady).toHaveTextContent('true');
      });
    });

    await step('Run vertical scroll inside the shared root', async () => {
      await userEvent.click(runVertical);
      await waitFor(() => {
        expect(firstEntered).toHaveTextContent('1');
        expect(firstLeft).toHaveTextContent('1');
        expect(secondEntered).toHaveTextContent('1');
        expect(secondLeft).toHaveTextContent('1');
        expect(secondLatestMovement).toHaveTextContent('up');
      });
    });

    await step('Run horizontal scroll inside the same shared root', async () => {
      await userEvent.click(runHorizontal);
      await waitFor(() => {
        expect(thirdEntered).toHaveTextContent('1');
        expect(thirdLeft).toHaveTextContent('1');
        expect(fourthEntered).toHaveTextContent('1');
        expect(fourthLeft).toHaveTextContent('1');
        expect(thirdLatestMovement).toHaveTextContent('left');
        expect(thirdLatestPosition).toHaveTextContent('left');
        expect(fourthLatestMovement).toHaveTextContent('left');
        expect(fourthLatestPosition).toHaveTextContent('left');
      });
    });
  },
};

export const FixedHeaderViewportRootMargin: Story = {
  render: args => <FixedHeaderViewportHarness {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    const triggerEnter = canvas.getByRole('button', { name: /trigger margin enter/i });
    const beforeBoundary = canvas.getByRole('button', { name: /scroll before header boundary/i });
    const pastBoundary = canvas.getByRole('button', { name: /scroll past header boundary/i });
    const observerReady = canvas.getByTestId('fixed-header-observer-ready');
    const enteredCount = canvas.getByTestId('fixed-header-entered');
    const leftCount = canvas.getByTestId('fixed-header-left');
    const latestType = canvas.getByTestId('fixed-header-latest-type');
    const latestPosition = canvas.getByTestId('fixed-header-latest-position');
    const rootTop = canvas.getByTestId('fixed-header-root-top');
    const rectBottom = canvas.getByTestId('fixed-header-rect-bottom');
    const currentRootTop = canvas.getByTestId('fixed-header-current-root-top');
    const currentRectBottom = canvas.getByTestId('fixed-header-current-rect-bottom');

    await step('Wait for fixed-header harness setup', async () => {
      await waitFor(() => {
        expect(observerReady).toHaveTextContent('true');
      });
    });

    await step('Enter the adjusted viewport area', async () => {
      await userEvent.click(triggerEnter);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('0');
        expect(latestType).toHaveTextContent('enter');
        expect(rootTop).toHaveTextContent('100');
        expect(currentRootTop).toHaveTextContent('100');
      });
    });

    await step('Stay visible just below the fixed header boundary', async () => {
      await userEvent.click(beforeBoundary);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('0');
        expect(latestType).toHaveTextContent('enter');
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('0');
        expect(latestType).toHaveTextContent('enter');
        expect(rootTop).toHaveTextContent('100');
        expect(currentRootTop).toHaveTextContent('100');
        expect(currentRectBottom).toHaveTextContent('101');
      });
    });

    await step('Leave only after crossing the bottom edge of the fixed header', async () => {
      await userEvent.click(pastBoundary);
      await waitFor(() => {
        expect(enteredCount).toHaveTextContent('1');
        expect(leftCount).toHaveTextContent('1');
        expect(latestType).toHaveTextContent('leave');
        expect(latestPosition).toHaveTextContent('above');
        expect(rootTop).toHaveTextContent('100');
        expect(rectBottom).toHaveTextContent('100');
        expect(currentRectBottom).toHaveTextContent('100');
      });
    });
  },
};
