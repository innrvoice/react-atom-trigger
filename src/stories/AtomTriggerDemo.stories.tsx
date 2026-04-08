import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AtomTrigger } from '../index';
import {
  AtomTriggerDemo,
  FixedHeaderOffsetDemo,
  FixedHeaderOffsetViewportDemo,
  HorizontalScrollDemo,
} from './components/SentinelDemoLayouts';
import { StorySentinelStyles } from './components/StoryStyles';

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

const meta: Meta<typeof AtomTrigger> = {
  title: 'AtomTrigger Demo/Sentinel Mode',
  component: AtomTrigger,
  parameters: {
    layout: 'padded',
  },
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
  render: () => <AtomTriggerDemo />,
};

export const OnceOnly: Story = {
  render: () => <AtomTriggerDemo once />,
};

export const OncePerDirection: Story = {
  render: () => <AtomTriggerDemo oncePerDirection rootMargin="120px 0px" threshold={0.2} />,
};

export const InitialVisibleOnLoad: Story = {
  render: () => <AtomTriggerDemo fireOnInitialVisible initialScrollTop={360} />,
};

export const FixedHeaderOffset: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => <FixedHeaderOffsetDemo />,
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
  render: () => <FixedHeaderOffsetViewportDemo />,
};

export const HorizontalScroll: Story = {
  render: () => <HorizontalScrollDemo />,
};
