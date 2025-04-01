import { keyframes } from '@emotion/react'
import colors from '../../utils/colors'

// Define keyframe animations for buttons
export const buttonGlitch = keyframes`
  0% {
    text-shadow: 0.05em 0 0 ${colors.neons.pink.default}, -0.05em -0.025em 0 ${colors.neons.cyan.default},
      -0.025em 0.05em 0 ${colors.neons.green.default};
  }
  14% {
    text-shadow: 0.05em 0 0 ${colors.neons.pink.default}, -0.05em -0.025em 0 ${colors.neons.cyan.default},
      -0.025em 0.05em 0 ${colors.neons.green.default};
  }
  15% {
    text-shadow: -0.05em -0.025em 0 ${colors.neons.pink.default}, 0.025em 0.025em 0 ${colors.neons.cyan.default},
      -0.05em -0.05em 0 ${colors.neons.green.default};
  }
  49% {
    text-shadow: -0.05em -0.025em 0 ${colors.neons.pink.default}, 0.025em 0.025em 0 ${colors.neons.cyan.default},
      -0.05em -0.05em 0 ${colors.neons.green.default};
  }
  50% {
    text-shadow: 0.025em 0.05em 0 ${colors.neons.pink.default}, 0.05em 0 0 ${colors.neons.cyan.default},
      0 -0.05em 0 ${colors.neons.green.default};
  }
  99% {
    text-shadow: 0.025em 0.05em 0 ${colors.neons.pink.default}, 0.05em 0 0 ${colors.neons.cyan.default},
      0 -0.05em 0 ${colors.neons.green.default};
  }
  100% {
    text-shadow: -0.025em 0 0 ${colors.neons.pink.default}, -0.025em -0.025em 0 ${colors.neons.cyan.default},
      -0.025em -0.05em 0 ${colors.neons.green.default};
  }
`

export const scanlineFlow = keyframes`
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 0 30px;
  }
`

export const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.green.default}, 0 0 20px ${colors.neons.green.default}60, 0 0 30px ${colors.neons.green.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}40;
  }
`

export const pulseGlowRed = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.red.default}, 0 0 10px ${colors.neons.red.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.red.default}, 0 0 20px ${colors.neons.red.default}60, 0 0 30px ${colors.neons.red.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.red.default}, 0 0 10px ${colors.neons.red.default}40;
  }
`

export const pulseGlowYellow = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.yellow.default}, 0 0 10px ${colors.neons.yellow.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.yellow.default}, 0 0 20px ${colors.neons.yellow.default}60, 0 0 30px ${colors.neons.yellow.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.yellow.default}, 0 0 10px ${colors.neons.yellow.default}40;
  }
`

export const pulseGlowBlue = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.blue.default}, 0 0 10px ${colors.neons.blue.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.blue.default}, 0 0 20px ${colors.neons.blue.default}60, 0 0 30px ${colors.neons.blue.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.blue.default}, 0 0 10px ${colors.neons.blue.default}40;
  }
`

export const pulseGlowCyan = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
  }
  50% {
    box-shadow: 0 0 10px ${colors.neons.cyan.default}, 0 0 20px ${colors.neons.cyan.default}60, 0 0 30px ${colors.neons.cyan.default}30;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
  }
`

export const textGlitch = keyframes`
  0% {
    clip-path: inset(80% 0 0 0);
    transform: translate(-2px, -2px);
  }
  10% {
    clip-path: inset(10% 0 60% 0);
    transform: translate(2px, 2px);
  }
  20% {
    clip-path: inset(30% 0 40% 0);
    transform: translate(-2px, 2px);
  }
  30% {
    clip-path: inset(50% 0 30% 0);
    transform: translate(2px, -2px);
  }
  40% {
    clip-path: inset(10% 0 70% 0);
    transform: translate(2px, 2px);
  }
  50% {
    clip-path: inset(40% 0 30% 0);
    transform: translate(-2px, -2px);
  }
  60% {
    clip-path: inset(20% 0 60% 0);
    transform: translate(2px, -2px);
  }
  70% {
    clip-path: inset(60% 0 10% 0);
    transform: translate(-2px, 2px);
  }
  80% {
    clip-path: inset(30% 0 50% 0);
    transform: translate(-2px, -2px);
  }
  90% {
    clip-path: inset(50% 0 30% 0);
    transform: translate(2px, 2px);
  }
  100% {
    clip-path: inset(80% 0 0 0);
    transform: translate(-2px, -2px);
  }
`

export const flicker = keyframes`
  0% {
    opacity: 1;
  }
  5% {
    opacity: 0.8;
  }
  10% {
    opacity: 1;
  }
  15% {
    opacity: 0.3;
  }
  20% {
    opacity: 1;
  }
  55% {
    opacity: 1;
  }
  60% {
    opacity: 0.3;
  }
  61% {
    opacity: 1;
  }
  65% {
    opacity: 0.9;
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
`
