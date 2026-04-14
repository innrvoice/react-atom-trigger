import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Scene } from './Scene';

describe('Scene', () => {
  it('namespaces per-instance defs and masks to avoid collisions across layered svgs', () => {
    const { container } = render(
      <>
        <Scene mode="day" />
        <Scene mode="night" />
      </>,
    );

    const sceneRoots = Array.from(container.querySelectorAll('[data-mode]'));
    const gradientIds = Array.from(
      container.querySelectorAll('linearGradient, radialGradient'),
    ).map(node => node.getAttribute('id'));
    const maskIds = Array.from(container.querySelectorAll('mask')).map(node =>
      node.getAttribute('id'),
    );
    const daySkyRect = sceneRoots[0]?.querySelector('svg rect');
    const nightSkyRect = sceneRoots[1]?.querySelector('svg rect');

    expect(sceneRoots).toHaveLength(2);
    expect(new Set(gradientIds).size).toBe(gradientIds.length);
    expect(new Set(maskIds).size).toBe(maskIds.length);
    expect(daySkyRect?.getAttribute('fill')).toMatch(/^url\(#.+-sky\)$/);
    expect(nightSkyRect?.getAttribute('fill')).toMatch(/^url\(#.+-sky\)$/);
    expect(daySkyRect?.getAttribute('fill')).not.toBe(nightSkyRect?.getAttribute('fill'));
  });
});
