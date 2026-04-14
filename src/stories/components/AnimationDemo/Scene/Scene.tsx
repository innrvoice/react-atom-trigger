import React from 'react';
import seaBeamLargeMask from './assets/sea-beam-large.png';
import seaBeamSmallMask from './assets/sea-beam-small.png';
import sunGlowMask from './assets/sun-glow.png';
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
  beamVariant: 'none' | 'large' | 'small';
  seaBeamOpacity: number;
  hillBack: string;
  hillFrontTop: string;
  hillFrontBottom: string;
  horizonLine: string;
  sunFill: string;
  sunHalo: string;
  sunGlowOpacity: number;
  sunOpacity: number;
  sunTranslateY: number;
  moonGlow: string;
  moonGlowOpacity: number;
  moonTintStart: string;
  moonTintEnd: string;
  moonOpacity: number;
  moonTranslateY: number;
};

const sceneWidth = 1024;
const sceneHeight = 768;
const viewBox = `0 0 ${sceneWidth} ${sceneHeight}`;
const horizonY = 281.97;
const horizonOverlap = 2;
const sunCenterX = 512.16;
const sunRadius = 41;
const sunGlowSize = 300;
const sunGlowX = sunCenterX - sunGlowSize / 2;
const sunGlowY = horizonY - sunGlowSize / 2;
const moonCenterY = 141.99;
const moonGlowRadius = 150;
const beamX = 267.34;
const beamY = 261.74;
const beamWidth = 489.32;
const beamHeight = 195.22;

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
    beamVariant: 'none',
    seaBeamOpacity: 0,
    hillBack: '#0f6f3b',
    hillFrontTop: '#148c3d',
    hillFrontBottom: '#0a5d1a',
    horizonLine: '#e9ffff',
    sunFill: '#fff2b4',
    sunHalo: '#fff8d8',
    sunGlowOpacity: 0.7,
    sunOpacity: 1,
    sunTranslateY: -140,
    moonGlow: '#99fff2',
    moonGlowOpacity: 0.5,
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
    beamVariant: 'large',
    seaBeamOpacity: 0.88,
    hillBack: '#33485c',
    hillFrontTop: '#55655a',
    hillFrontBottom: '#2f3f3a',
    horizonLine: '#ffd6a1',
    sunFill: '#ffd46b',
    sunHalo: '#ffb86a',
    sunGlowOpacity: 1,
    sunOpacity: 1,
    sunTranslateY: 0,
    moonGlow: '#99fff2',
    moonGlowOpacity: 0.5,
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
    beamVariant: 'small',
    seaBeamOpacity: 1,
    hillBack: '#082e48',
    hillFrontTop: '#0d4664',
    hillFrontBottom: '#05273d',
    horizonLine: '#84dfff',
    sunFill: '#ffe286',
    sunHalo: '#ffd8a6',
    sunGlowOpacity: 1,
    sunOpacity: 0.12,
    sunTranslateY: 120,
    moonGlow: '#8ffbe2',
    moonGlowOpacity: 0.5,
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
    beamVariant: 'large',
    seaBeamOpacity: 0.9,
    hillBack: '#416072',
    hillFrontTop: '#638167',
    hillFrontBottom: '#314d41',
    horizonLine: '#ffe3bf',
    sunFill: '#ffd875',
    sunHalo: '#ffc786',
    sunGlowOpacity: 1,
    sunOpacity: 1,
    sunTranslateY: 0,
    moonGlow: '#8ffbe2',
    moonGlowOpacity: 0.5,
    moonTintStart: '#ffffff',
    moonTintEnd: '#0b4368',
    moonOpacity: 0.12,
    moonTranslateY: -220,
  },
};

export function Scene({ mode }: SceneProps) {
  const preset = presets[mode];
  const idPrefix = React.useId().replace(/:/g, '');
  const skyGradientId = `${idPrefix}-sky`;
  const seaGradientId = `${idPrefix}-sea`;
  const hillFrontGradientId = `${idPrefix}-hill-front`;
  const sunCoreGradientId = `${idPrefix}-sun-core`;
  const moonGlowGradientId = `${idPrefix}-moon-glow`;
  const moonGradientId = `${idPrefix}-moon`;
  const seaGlareGradientId = `${idPrefix}-sea-glare`;
  const isLargeBeam = preset.beamVariant === 'large';
  const isSmallBeam = preset.beamVariant === 'small';
  const sunGlowScale = mode === 'day' ? 1 : 1.7;

  return (
    <div className={styles.root} data-mode={mode}>
      <div className={classNames(styles.layer, styles.layerSky)}>
        <svg
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMin slice"
        >
          <defs>
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
          </defs>
          <rect
            width={sceneWidth}
            height={horizonY + horizonOverlap}
            fill={`url(#${skyGradientId})`}
            className={styles.transition}
          />
        </svg>
      </div>

      <div className={classNames(styles.layer, styles.layerSun)}>
        <svg
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMin slice"
        >
          <defs>
            <radialGradient id={sunCoreGradientId} cx="48%" cy="42%" r="62%" fx="48%" fy="42%">
              <stop offset="0" stopColor={preset.sunHalo} className={styles.transition} />
              <stop offset="0.55" stopColor={preset.sunFill} className={styles.transition} />
              <stop offset="1" stopColor={preset.sunFill} className={styles.transition} />
            </radialGradient>
          </defs>
          <g
            className={classNames(styles.celestial, styles.sun)}
            style={{
              transform: `translateY(${preset.sunTranslateY}px)`,
              opacity: preset.sunOpacity,
            }}
          >
            <g className={styles.sunGlowScale} style={{ transform: `scale(${sunGlowScale})` }}>
              <image
                href={sunGlowMask}
                x={sunGlowX}
                y={sunGlowY}
                width={sunGlowSize}
                height={sunGlowSize}
                preserveAspectRatio="none"
                opacity={preset.sunGlowOpacity}
                className={classNames(styles.transition, styles.sunGlow)}
              />
            </g>
            <circle
              cx={sunCenterX}
              cy={horizonY}
              r={sunRadius}
              fill={`url(#${sunCoreGradientId})`}
              className={styles.transition}
            />
          </g>
        </svg>
      </div>

      <div className={classNames(styles.layer, styles.layerMoon)}>
        <svg
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMin slice"
        >
          <defs>
            <radialGradient id={moonGlowGradientId} cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor={preset.moonGlow} stopOpacity="0.68" />
              <stop offset="0.42" stopColor={preset.moonGlow} stopOpacity="0.34" />
              <stop offset="0.78" stopColor={preset.moonGlow} stopOpacity="0.1" />
              <stop offset="1" stopColor={preset.moonGlow} stopOpacity="0" />
            </radialGradient>
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
          </defs>
          <g
            className={classNames(styles.celestial, styles.moon)}
            style={{
              transform: `translateY(${preset.moonTranslateY}px)`,
              opacity: preset.moonOpacity,
            }}
          >
            <circle
              cx={sunCenterX}
              cy={moonCenterY}
              r={moonGlowRadius}
              fill={`url(#${moonGlowGradientId})`}
              opacity={preset.moonGlowOpacity}
              className={styles.transition}
            />
            <circle
              cx={sunCenterX}
              cy={moonCenterY}
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
        </svg>
      </div>

      <div className={classNames(styles.layer, styles.layerSea)}>
        <svg
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMin slice"
        >
          <defs>
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
          </defs>
          <rect
            y={horizonY - horizonOverlap}
            width={sceneWidth}
            height={326.1 + horizonOverlap}
            fill={`url(#${seaGradientId})`}
            className={styles.transition}
          />
          <rect
            y={horizonY - horizonOverlap}
            width={sceneWidth}
            height={230.06 + horizonOverlap}
            fill={`url(#${seaGlareGradientId})`}
            className={styles.transition}
            opacity={preset.glareOpacity}
          />
          <rect
            y={horizonY - 1.5}
            width={sceneWidth}
            height="3"
            fill={preset.horizonLine}
            className={styles.transition}
            opacity="0.82"
          />
        </svg>
      </div>

      <div className={classNames(styles.layer, styles.layerBeam)}>
        <svg
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMin slice"
        >
          {/* Temporary placeholder raster assets. Replace the PNGs without changing scene logic. */}
          <image
            className={styles.beam}
            href={seaBeamLargeMask}
            x={beamX}
            y={beamY}
            width={beamWidth}
            height={beamHeight}
            preserveAspectRatio="none"
            opacity={isLargeBeam ? preset.seaBeamOpacity : 0}
          />
          <image
            className={styles.beam}
            href={seaBeamSmallMask}
            x={beamX}
            y={beamY}
            width={beamWidth}
            height={beamHeight}
            preserveAspectRatio="none"
            opacity={isSmallBeam ? preset.seaBeamOpacity : 0}
          />
        </svg>
      </div>

      <div className={classNames(styles.layer, styles.layerHills)}>
        <svg
          className={styles.svg}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMin slice"
        >
          <defs>
            <linearGradient
              id={hillFrontGradientId}
              x1="512"
              y1="768"
              x2="512"
              y2="334.81"
              gradientUnits="userSpaceOnUse"
            >
              <stop
                offset="0.42"
                stopColor={preset.hillFrontBottom}
                className={styles.transition}
              />
              <stop offset="1" stopColor={preset.hillFrontTop} className={styles.transition} />
            </linearGradient>
          </defs>
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
    </div>
  );
}

export default Scene;
