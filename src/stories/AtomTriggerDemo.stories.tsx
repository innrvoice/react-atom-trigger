import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AtomTriggerDemo,
  type DemoProps,
  FixedHeaderOffsetDemo,
  FixedHeaderOffsetViewportDemo,
  HorizontalScrollDemo,
} from './components/SentinelDemoLayouts';
import { StorySentinelStyles } from './components/StoryStyles';
import { atomTriggerActionArgs, atomTriggerArgTypes } from './storybookArgs';

type SentinelDemoStoryArgs = DemoProps & {
  headerHeight?: number;
};

type FrameHeightDecoratorProps = {
  height: number;
  children: React.ReactNode;
};

function FrameHeightDecorator({ height, children }: FrameHeightDecoratorProps) {
  React.useLayoutEffect(() => {
    const frame = window.frameElement as HTMLIFrameElement | null;
    if (!frame) {
      return;
    }

    const previousHeight = frame.style.height;
    const previousMaxHeight = frame.style.maxHeight;

    frame.style.height = `${height}px`;
    frame.style.maxHeight = `${height}px`;

    return () => {
      frame.style.height = previousHeight;
      frame.style.maxHeight = previousMaxHeight;
    };
  }, [height]);

  return <>{children}</>;
}

const meta: Meta<SentinelDemoStoryArgs> = {
  title: 'AtomTrigger Demo/Sentinel Mode',
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
    initialScrollTop: 0,
    headerHeight: 100,
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

export const Default: Story = {
  render: args => <AtomTriggerDemo {...args} />,
};

export const OnceOnly: Story = {
  args: {
    once: true,
  },
  render: args => <AtomTriggerDemo {...args} />,
};

export const OncePerDirection: Story = {
  args: {
    oncePerDirection: true,
    rootMargin: '120px 0px',
    threshold: 0.2,
  },
  render: args => <AtomTriggerDemo {...args} />,
};

export const InitialVisibleOnLoad: Story = {
  args: {
    fireOnInitialVisible: true,
    initialScrollTop: 360,
  },
  render: args => <AtomTriggerDemo {...args} />,
};

export const FixedHeaderOffset: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: args => <FixedHeaderOffsetDemo {...args} />,
};

export const FixedHeaderOffsetViewport: Story = {
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: {
        inline: false,
        iframeHeight: '800px',
      },
    },
  },
  decorators: [
    Story => (
      <FrameHeightDecorator height={800}>
        <Story />
      </FrameHeightDecorator>
    ),
  ],
  render: args => <FixedHeaderOffsetViewportDemo {...args} />,
};

export const HorizontalScroll: Story = {
  render: args => <HorizontalScrollDemo {...args} />,
};
