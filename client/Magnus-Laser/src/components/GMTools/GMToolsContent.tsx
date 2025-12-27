import { Box, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import colors from '../../utils/colors'
import type { GMToolType } from './GMToolsStore'
import BeatChartTool from './tools/BeatChartTool'
import ClocksTool from './tools/ClocksTool'
import GeneratorTool from './tools/GeneratorTool'
import MissionBuilderTool from './tools/MissionBuilderTool'
import OracleTool from './tools/OracleTool'
import RandomTablesTool from './tools/RandomTablesTool'

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

    return <Box>{renderContent()}</Box>
}

export default GMToolsContent
