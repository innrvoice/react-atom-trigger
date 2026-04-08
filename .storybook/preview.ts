import type { Preview } from '@storybook/react-vite';
import './preview.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    options: {
      storySort: {
        order: [
          'Showcase',
          'AtomTrigger Demo',
          ['Sentinel Mode', 'Child Mode'],
          'Tests',
          [
            'AtomTrigger Interactions',
            ['Sentinel Mode', 'Child Mode'],
            'Extended Demo Interactions',
          ],
        ],
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
