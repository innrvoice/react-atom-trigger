import type { StorybookConfig } from '@storybook/react-vite';

const allStories = ['../src/stories/**/*.stories.{ts,tsx}'];
const publicStories = [
  '../src/stories/AtomTriggerDemo.stories.tsx',
  '../src/stories/AtomTriggerChildModeDemo.stories.tsx',
  '../src/stories/AnimationDemo.stories.tsx',
];

const config: StorybookConfig = {
  stories: (_stories, { configType }) => (configType === 'PRODUCTION' ? publicStories : allStories),
  framework: '@storybook/react-vite',
  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],
  features: {
    sidebarOnboardingChecklist: false,
  },
};

export default config;
