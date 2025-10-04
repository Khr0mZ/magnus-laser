import { keyframes } from '@emotion/react'
import colors from '../../utils/colors'

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

export const glowGreen = keyframes`
  box-shadow: 0 0 5px ${colors.neons.green.default}, 0 0 10px ${colors.neons.green.default}40;
`
export const pulseGlowGreen = keyframes`
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

export const neonColorCycle = keyframes`
  0% {
    color: ${colors.neons.cyan.default};
    text-shadow: 0 0 10px ${colors.neons.cyan.default};
  }
  20% {
    color: ${colors.neons.pink.default};
    text-shadow: 0 0 10px ${colors.neons.pink.default};
  }
  40% {
    color: ${colors.neons.green.default};
    text-shadow: 0 0 10px ${colors.neons.green.default};
  }
  60% {
    color: ${colors.neons.purple.default};
    text-shadow: 0 0 10px ${colors.neons.purple.default};
  }
  80% {
    color: ${colors.neons.yellow.default};
    text-shadow: 0 0 10px ${colors.neons.yellow.default};
  }
  100% {
    color: ${colors.neons.cyan.default};
    text-shadow: 0 0 10px ${colors.neons.cyan.default};
  }
`

export const glitch = keyframes`
  0%, 100% { 
    transform: translate(0);
    text-shadow: -2px 0 ${colors.neons.cyan.default}, 2px 2px ${colors.neons.pink.default};
  }
  10% { 
    transform: translate(-3px, -2px);
    text-shadow: 2px -1px ${colors.neons.green.default}, -2px 2px ${colors.neons.blue.default};
  }
  20% { 
    transform: translate(3px, 2px);
    text-shadow: 2px 1px ${colors.neons.purple.default}, -1px -2px ${colors.neons.yellow.default};
  }
  30% { 
    transform: translate(-5px, -2px) skewX(10deg);
    text-shadow: -2px 0 ${colors.neons.red.default}, 2px 2px ${colors.neons.cyan.default};
  }
  40% { 
    transform: translate(0px, 0px) skewX(0);
    text-shadow: 0 0 ${colors.neons.green.default}, 0 0 ${colors.neons.cyan.default};
  }
  50% { 
    transform: translate(0px, 0px) skewX(-5deg);
    text-shadow: 2px 2px ${colors.neons.purple.default}, -2px -2px ${colors.neons.green.default};
  }
  60% { 
    transform: translateX(4px);
    text-shadow: 0 0 ${colors.neons.cyan.default}, 0 0 ${colors.neons.cyan.default};
  }
  70% { 
    transform: translate(-3px, 2px) skewX(15deg);
    text-shadow: 2px -1px ${colors.neons.pink.default}, -2px 2px ${colors.neons.green.default};
  }
  80% { 
    transform: translate(0px, 0px) skewX(0);
    text-shadow: -2px 0 ${colors.neons.green.default}, 2px 2px ${colors.neons.pink.default};
  }
  90% { 
    transform: translate(3px, -3px) skewY(3deg);
    text-shadow: -2px 0 ${colors.neons.cyan.default}, 2px 2px ${colors.neons.purple.default};
  }
`

export const severeGlitch = keyframes`
  0% {
    clip-path: inset(40% 0 61% 0);
    transform: translate(-10px, 5px);
  }
  20% {
    clip-path: inset(92% 0 1% 0);
    transform: translate(10px, -3px) skewX(-15deg);
  }
  40% {
    clip-path: inset(43% 0 1% 0);
    transform: translate(2px, 10px);
  }
  60% {
    clip-path: inset(25% 0 58% 0);
    transform: translate(-15px, -2px) skewY(8deg);
  }
  80% {
    clip-path: inset(54% 0 7% 0);
    transform: translate(15px, -5px) skewX(25deg);
  }
  100% {
    clip-path: inset(58% 0 43% 0);
    transform: translate(-7px, 3px);
  }
`

export const flicker = keyframes`
  0% {
    opacity: 1;
  }
  4% {
    opacity: 0.8;
  }
  6% {
    opacity: 0.4;
  }
  8% {
    opacity: 0.9;
  }
  10% {
    opacity: 0.7;
  }
  12% {
    opacity: 1;
  }
  14% {
    opacity: 0.3;
  }
  16% {
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  72% {
    opacity: 0.2;
  }
  74% {
    opacity: 0.5;
  }
  76% {
    opacity: 1;
  }
  100% {
    opacity: 1;
  }
`

export const neonPulse = keyframes`
  0% {
    box-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
    border-color: ${colors.neons.cyan.default}80;
  }
  25% {
    box-shadow: 0 0 10px ${colors.neons.pink.default}, 0 0 20px ${colors.neons.pink.default}40;
    border-color: ${colors.neons.pink.default}80;
  }
  50% {
    box-shadow: 0 0 15px ${colors.neons.green.default}, 0 0 25px ${colors.neons.green.default}40;
    border-color: ${colors.neons.green.default}80;
  }
  75% {
    box-shadow: 0 0 10px ${colors.neons.purple.default}, 0 0 20px ${colors.neons.purple.default}40;
    border-color: ${colors.neons.purple.default}80;
  }
  100% {
    box-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
    border-color: ${colors.neons.cyan.default}80;
  }
`

export const textNeonPulse = keyframes`
  0% {
    text-shadow: 0 0 5px ${colors.neons.cyan.default}, 0 0 10px ${colors.neons.cyan.default}40;
  }
  100% {
    text-shadow: 0 0 15px ${colors.neons.cyan.default}, 0 0 20px ${colors.neons.cyan.default}, 0 0 30px ${colors.neons.cyan.default}50;
  }
`

// Faster module progress animation without green
export const moduleProgressCycle = keyframes`
  0% {
    background: linear-gradient(to right, rgba(0, 255, 255, 0.7), rgba(0, 255, 255, 0.9));
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  }
  25% {
    background: linear-gradient(to right, rgba(255, 0, 255, 0.7), rgba(255, 0, 255, 0.9));
    box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
  }
  50% {
    background: linear-gradient(to right, rgba(153, 0, 255, 0.7), rgba(153, 0, 255, 0.9));
    box-shadow: 0 0 10px rgba(153, 0, 255, 0.5);
  }
  75% {
    background: linear-gradient(to right, rgba(255, 255, 0, 0.7), rgba(255, 255, 0, 0.9));
    box-shadow: 0 0 10px rgba(255, 255, 0, 0.5);
  }
  100% {
    background: linear-gradient(to right, rgba(0, 255, 255, 0.7), rgba(0, 255, 255, 0.9));
    box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
  }
`

export const blink = keyframes`
    0% { opacity: 1; }
    49% { opacity: 1; }
    50% { opacity: 0; }
    99% { opacity: 0; }
    100% { opacity: 1; }
`

// New Animation: Drop-shadow glow filter effect for icons (now cyan)
export const iconGlowFilter = keyframes`
  0%, 100% {
    filter: drop-shadow(0 0 3px ${colors.neons.cyan.default}80);
  }
  50% {
    filter: drop-shadow(0 0 6px ${colors.neons.cyan.default}E6);
  }
`

// New Animation: Matrix-style falling characters
export const matrixRain = keyframes`
  0% {
    transform: translateY(-100%);
    opacity: 0.7;
  }
  95% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
`
