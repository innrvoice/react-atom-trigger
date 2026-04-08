import React from 'react';
import { classNames } from '../classNames';
import styles from './Scene.module.css';
import type { AnimationMode } from '../types';

export type SceneProps = {
  mode: AnimationMode;
};

type ScenePreset = {
  skyTop: string;
  skyBottom: string;
  seaTop: string;
  seaBottom: string;
  seaEdge: string;
  glareTop: string;
  glareBottom: string;
  glareOpacity: number;
  seaBeamTop: string;
  seaBeamBottom: string;
  seaBeamOpacity: number;
  seaBeamScale: number;
  hillBack: string;
  hillFrontTop: string;
  hillFrontBottom: string;
  horizonLine: string;
  sunFill: string;
  sunHalo: string;
  sunOpacity: number;
  sunTranslateY: number;
  moonGlow: string;
  moonTintStart: string;
  moonTintEnd: string;
  moonOpacity: number;
  moonTranslateY: number;
};

const horizonY = 281.97;

const presets: Record<AnimationMode, ScenePreset> = {
  day: {
    skyTop: '#b7f5ff',
    skyBottom: '#29afe7',
    seaTop: '#11b9df',
    seaBottom: '#0072a7',
    seaEdge: '#7ceeff',
    glareTop: '#d9ffff',
    glareBottom: '#ffffff',
    glareOpacity: 0.22,
    seaBeamTop: '#fff6d5',
    seaBeamBottom: '#ffffff',
    seaBeamOpacity: 0,
    seaBeamScale: 0.58,
    hillBack: '#0f6f3b',
    hillFrontTop: '#148c3d',
    hillFrontBottom: '#0a5d1a',
    horizonLine: '#e9ffff',
    sunFill: '#fff2b4',
    sunHalo: '#fff8d8',
    sunOpacity: 1,
    sunTranslateY: -140,
    moonGlow: '#99fff2',
    moonTintStart: '#ffffff',
    moonTintEnd: '#6abbd1',
    moonOpacity: 0,
    moonTranslateY: -220,
  },
  sunset: {
    skyTop: '#ffc48b',
    skyBottom: '#dc695f',
    seaTop: '#f09070',
    seaBottom: '#0f5577',
    seaEdge: '#ffc27e',
    glareTop: '#ffd9b5',
    glareBottom: '#fff2cd',
    glareOpacity: 0.08,
    seaBeamTop: '#ffd58b',
    seaBeamBottom: '#fff1cf',
    seaBeamOpacity: 0.88,
    seaBeamScale: 1,
    hillBack: '#33485c',
    hillFrontTop: '#55655a',
    hillFrontBottom: '#2f3f3a',
    horizonLine: '#ffd6a1',
    sunFill: '#ffd46b',
    sunHalo: '#ffb86a',
    sunOpacity: 1,
    sunTranslateY: 0,
    moonGlow: '#99fff2',
    moonTintStart: '#ffffff',
    moonTintEnd: '#7abdd4',
    moonOpacity: 0,
    moonTranslateY: -220,
  },
  night: {
    skyTop: '#2a6a8b',
    skyBottom: '#032f4f',
    seaTop: '#0d5067',
    seaBottom: '#041722',
    seaEdge: '#79dfff',
    glareTop: '#58defe',
    glareBottom: '#dfffff',
    glareOpacity: 0.04,
    seaBeamTop: '#8ef5ff',
    seaBeamBottom: '#e4ebe4',
    seaBeamOpacity: 1,
    seaBeamScale: 0.5,
    hillBack: '#082e48',
    hillFrontTop: '#0d4664',
    hillFrontBottom: '#05273d',
    horizonLine: '#84dfff',
    sunFill: '#ffe286',
    sunHalo: '#ffd8a6',
    sunOpacity: 0.12,
    sunTranslateY: 120,
    moonGlow: '#8ffbe2',
    moonTintStart: '#ffffff',
    moonTintEnd: '#0b4368',
    moonOpacity: 1,
    moonTranslateY: 0,
  },
  sunrise: {
    skyTop: '#91d7f5',
    skyBottom: '#f8c58f',
    seaTop: '#ffc996',
    seaBottom: '#14688f',
    seaEdge: '#ffe2bf',
    glareTop: '#fff0ce',
    glareBottom: '#fff9e3',
    glareOpacity: 0.1,
    seaBeamTop: '#ffc56f',
    seaBeamBottom: '#fff0d1',
    seaBeamOpacity: 0.9,
    seaBeamScale: 1.08,
    hillBack: '#416072',
    hillFrontTop: '#638167',
    hillFrontBottom: '#314d41',
    horizonLine: '#ffe3bf',
    sunFill: '#ffd875',
    sunHalo: '#ffc786',
    sunOpacity: 1,
    sunTranslateY: 0,
    moonGlow: '#8ffbe2',
    moonTintStart: '#ffffff',
    moonTintEnd: '#0b4368',
    moonOpacity: 0.12,
    moonTranslateY: -220,
  },
};

export function Scene({ mode }: SceneProps) {
  const preset = presets[mode];
  const idPrefix = React.useId().replace(/:/g, '');
  const sceneId = `${idPrefix}-scene`;
  const sunHaloFilterId = `${idPrefix}-sun-halo-filter`;
  const moonFormFilterId = `${idPrefix}-moon-form-filter`;
  const moonSeaGlareFilterId = `${idPrefix}-moon-sea-glare-filter`;
  const skyGradientId = `${idPrefix}-sky`;
  const seaGradientId = `${idPrefix}-sea`;
  const hillFrontGradientId = `${idPrefix}-hill-front-grad`;
  const moonGradientId = `${idPrefix}-moon-grad`;
  const seaBeamGradientId = `${idPrefix}-sea-beam-grad`;
  const seaGlareGradientId = `${idPrefix}-sea-glare-grad`;
  const seaMaskId = `${idPrefix}-sea-mask`;

  return (
    <div className={styles.root} data-mode={mode}>
      <svg
        id={sceneId}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width="100%"
        height="100%"
        viewBox="0 0 1024 768"
        preserveAspectRatio="xMidYMin slice"
      >
        <defs>
          <filter id={sunHaloFilterId} filterUnits="userSpaceOnUse" x="0" y="0">
            <feGaussianBlur in="SourceGraphic" stdDeviation="34" result="blur" />
            <feComposite
              in="blur"
              in2="SourceGraphic"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3="1"
              k4="0"
              result="litPaint"
            />
          </filter>
          <filter id={moonFormFilterId} filterUnits="userSpaceOnUse" x="0" y="0">
            <feGaussianBlur in="SourceGraphic" stdDeviation="34" result="blur" />
          </filter>
          <filter id={moonSeaGlareFilterId} filterUnits="userSpaceOnUse" x="0" y="0">
            <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
          </filter>
          <linearGradient
            id={skyGradientId}
            x1="512"
            y1="334.81"
            x2="512"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={preset.skyTop} className={styles.transition} />
            <stop offset="1" stopColor={preset.skyBottom} className={styles.transition} />
          </linearGradient>
          <linearGradient
            id={seaGradientId}
            x1="512"
            y1="608.07"
            x2="512"
            y2={horizonY}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.18" stopColor={preset.seaBottom} className={styles.transition} />
            <stop offset="0.86" stopColor={preset.seaTop} className={styles.transition} />
            <stop offset="1" stopColor={preset.seaEdge} className={styles.transition} />
          </linearGradient>
          <linearGradient
            id={hillFrontGradientId}
            x1="512"
            y1="768"
            x2="512"
            y2="334.81"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.42" stopColor={preset.hillFrontBottom} className={styles.transition} />
            <stop offset="1" stopColor={preset.hillFrontTop} className={styles.transition} />
          </linearGradient>
          <linearGradient
            id={moonGradientId}
            x1="400"
            y1="181.67"
            x2="576.05"
            y2="176"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={preset.moonTintStart} className={styles.transition} />
            <stop offset="1" stopColor={preset.moonTintEnd} className={styles.transition} />
          </linearGradient>
          <linearGradient
            id={seaBeamGradientId}
            x1="512.06"
            y1="493.65"
            x2="512.06"
            y2="298.43"
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0.3"
              stopColor={preset.seaBeamTop}
              stopOpacity="0"
              className={styles.transition}
            />
            <stop
              offset="0.89"
              stopColor={preset.seaBeamBottom}
              stopOpacity="0.4"
              className={styles.transition}
            />
            <stop
              offset="1"
              stopColor={preset.seaBeamBottom}
              stopOpacity="1"
              className={styles.transition}
            />
          </linearGradient>
          <linearGradient
            id={seaGlareGradientId}
            x1="512"
            y1="520"
            x2="512"
            y2={horizonY}
            gradientUnits="userSpaceOnUse"
          >
            <stop
              offset="0.12"
              stopColor={preset.glareTop}
              stopOpacity="0"
              className={styles.transition}
            />
            <stop
              offset="0.9"
              stopColor={preset.glareBottom}
              stopOpacity="0.55"
              className={styles.transition}
            />
            <stop
              offset="1"
              stopColor={preset.glareBottom}
              stopOpacity="1"
              className={styles.transition}
            />
          </linearGradient>
          <mask id={seaMaskId}>
            <rect x="0" y="0" width="1024" height={horizonY} fill="black" />
            <rect x="0" y={horizonY} width="1024" height="1000" fill="white" />
          </mask>
        </defs>

        <rect
          width="1024"
          height={horizonY}
          fill={`url(#${skyGradientId})`}
          className={styles.transition}
        />

        <g
          className={classNames(styles.celestial, styles.sun)}
          style={{
            transform: `translateY(${preset.sunTranslateY}px)`,
            opacity: preset.sunOpacity,
          }}
        >
          <circle
            cx="512.16"
            cy={horizonY}
            r="46.38"
            filter={`url(#${sunHaloFilterId})`}
            fill={preset.sunHalo}
            className={styles.transition}
          />
          <circle
            cx="512.16"
            cy={horizonY}
            r="41"
            fill={preset.sunFill}
            className={styles.transition}
          />
        </g>

        <g
          className={classNames(styles.celestial, styles.moon)}
          style={{
            transform: `translateY(${preset.moonTranslateY}px)`,
            opacity: preset.moonOpacity,
          }}
        >
          <circle
            cx="512.16"
            cy="141.99"
            r="46.38"
            fill={preset.moonGlow}
            filter={`url(#${moonFormFilterId})`}
            className={styles.transition}
          />
          <circle
            cx="512.16"
            cy="141.99"
            r="46.38"
            fill={`url(#${moonGradientId})`}
            opacity="0.16"
            className={styles.transition}
          />
          <path
            d="M521.78,181a41.86,41.86,0,1,1,0-83.72c.77,0,1.54,0,2.31.07a46.38,46.38,0,1,0,23.11,75A41.66,41.66,0,0,1,521.78,181Z"
            fill="#e5ebe4"
            className={styles.transition}
          />
        </g>

        <rect
          y={horizonY}
          width="1024"
          height="326.1"
          fill={`url(#${seaGradientId})`}
          className={styles.transition}
        />
        <rect
          y={horizonY}
          width="1024"
          height="230.06"
          fill={`url(#${seaGlareGradientId})`}
          className={styles.transition}
          opacity={preset.glareOpacity}
        />
        <g mask={`url(#${seaMaskId})`}>
          <polygon
            points="756.66 455.87 267.34 456.96 437.68 261.74 583.78 261.74 756.66 455.87"
            fill={`url(#${seaBeamGradientId})`}
            filter={`url(#${moonSeaGlareFilterId})`}
            className={styles.seaBeam}
            style={{
              opacity: preset.seaBeamOpacity,
              transform: `scale3d(${preset.seaBeamScale}, ${preset.seaBeamScale}, 1)`,
            }}
          />
        </g>
        <rect
          y={horizonY - 1.5}
          width="1024"
          height="3"
          fill={preset.horizonLine}
          className={styles.transition}
          opacity="0.82"
        />

        <polygon
          points="1024 655.09 0 411.24 0 768 1024 768 1024 655.09"
          fill={preset.hillBack}
          className={styles.transition}
        />
        <polygon
          points="0 645.45 1024 334.81 1024 768 0 768 0 645.45"
          fill={`url(#${hillFrontGradientId})`}
          className={styles.transition}
        />
      </svg>
    </div>
  );
}

export default Scene;
