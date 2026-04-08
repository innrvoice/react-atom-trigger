import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Scene } from './Scene';

describe('Scene', () => {
  it('namespaces SVG defs per instance to avoid id collisions', () => {
    const { container } = render(
      <>
        <Scene mode="day" />
        <Scene mode="night" />
      </>,
    );

    const svgElements = Array.from(container.querySelectorAll('svg'));
    const skyRects = Array.from(container.querySelectorAll('svg > rect:first-of-type'));
    const gradientIds = Array.from(container.querySelectorAll('linearGradient')).map(node =>
      node.getAttribute('id'),
    );

    expect(svgElements).toHaveLength(2);
    expect(new Set(gradientIds).size).toBe(gradientIds.length);
    expect(skyRects[0]?.getAttribute('fill')).toMatch(/^url\(#.+-sky\)$/);
    expect(skyRects[1]?.getAttribute('fill')).toMatch(/^url\(#.+-sky\)$/);
    expect(skyRects[0]?.getAttribute('fill')).not.toBe(skyRects[1]?.getAttribute('fill'));
  });
});
