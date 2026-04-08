import React from 'react';

export const sentinelStyles = `
  .atom-trigger-sentinel {
    display: block !important;
    width: 100%;
    height: 2px;
    background: violet;
  }

  .atom-trigger-sentinel--vertical {
    display: inline-block !important;
    width: 2px;
    min-width: 2px;
    height: 160px;
    background: violet;
  }
`;

export function StorySentinelStyles() {
  return <style>{sentinelStyles}</style>;
}
