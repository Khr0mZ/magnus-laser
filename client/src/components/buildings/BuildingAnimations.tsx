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
