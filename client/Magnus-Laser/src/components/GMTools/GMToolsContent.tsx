import { Box, Typography } from '@mui/material'
import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'
import colors from '../../utils/colors'
import type { GMToolType } from './GMToolsStore'

// Lazy-loaded tool components
const BeatChartTool = lazy(() => import('./tools/BeatChartTool'))
const ClocksTool = lazy(() => import('./tools/ClocksTool'))
const GeneratorTool = lazy(() => import('./tools/GeneratorTool'))
const InvestigationTool = lazy(() => import('./tools/InvestigationTool'))
const IPTrackingTool = lazy(() => import('./tools/IPTrackingTool'))
const MissionBuilderTool = lazy(() => import('./tools/MissionBuilderTool'))
const NPCFormsTool = lazy(() => import('./tools/NPCFormsTool'))
const NPCTrackerTool = lazy(() => import('./tools/NPCTrackerTool'))
const OracleTool = lazy(() => import('./tools/OracleTool'))
const RandomTablesTool = lazy(() => import('./tools/RandomTablesTool'))
const RandomThingsTool = lazy(() => import('./tools/RandomThingsTool'))
const SceneTrackerTool = lazy(() => import('./tools/SceneTrackerTool'))
const SocialChallengeTool = lazy(() => import('./tools/SocialChallengeTool'))

interface GMToolsContentProps {
    activeTool: GMToolType
}

const GMToolsContent = ({ activeTool }: GMToolsContentProps) => {
    const { t } = useTranslation()

    const renderContent = () => {
        switch (activeTool) {
            case 'oracle':
                return <OracleTool />
            case 'clocks':
                return <ClocksTool />
            case 'missionBuilder':
                return <MissionBuilderTool />
            case 'beatChart':
                return <BeatChartTool />
            case 'randomTables':
                return <RandomTablesTool />
            case 'investigation':
                return <InvestigationTool />
            case 'socialChallenge':
                return <SocialChallengeTool />
            case 'npcTracker':
                return <NPCTrackerTool />
            case 'ipTracker':
                return <IPTrackingTool />
            case 'gangGenerator':
                return <GeneratorTool type="gang" />
            case 'buildingGenerator':
                return <GeneratorTool type="building" />
            case 'gigGenerator':
                return <GeneratorTool type="gig" />
            case 'bountyGenerator':
                return <GeneratorTool type="bounty" />
            case 'itemGenerator':
                return <GeneratorTool type="item" />
            case 'contactGenerator':
                return <GeneratorTool type="contact" />
            case 'sceneTracker':
                return <SceneTrackerTool />
            case 'npcForms':
                return <NPCFormsTool />
            case 'randomThings':
                return <RandomThingsTool />
            default:
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{
                                color: colors.grays.gray600,
                                fontStyle: 'italic',
                            }}
                        >
                            {t('gmTools.selectTool')}
                        </Typography>
                    </Box>
                )
        }
    }

    return (
        <Box>
            <Suspense fallback={null}>{renderContent()}</Suspense>
        </Box>
    )
}

export default GMToolsContent
