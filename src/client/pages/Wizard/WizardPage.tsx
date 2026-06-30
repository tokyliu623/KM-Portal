import { Card, Steps } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { InitStage } from './stages/InitStage'
import { DiagnoseStage } from './stages/DiagnoseStage'
import { GenerateStage } from './stages/GenerateStage'
import { AnalyzeStage } from './stages/AnalyzeStage'
import { useWizardStore } from './hooks/useWizard'

const stageIndex: Record<string, number> = {
  init: 0,
  diagnose: 1,
  generate: 2,
  analyze: 3,
}

const stageLabels = ['凭证输入', '能力诊断', '产物生成', '运营分析']

export function WizardPage() {
  const { stage } = useWizardStore()
  const currentStep = stageIndex[stage] || 0

  const renderStage = () => {
    switch (stage) {
      case 'init':
        return <InitStage />
      case 'diagnose':
        return <DiagnoseStage />
      case 'generate':
        return <GenerateStage />
      case 'analyze':
        return <AnalyzeStage />
      default:
        return <InitStage />
    }
  }

  return (
    <div>
      <PageHeader title="知识库向导" subTitle="一站式探索和生成运营产物" />
      <Card style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={stageLabels.map((label) => ({ title: label }))}
        />
      </Card>
      {renderStage()}
    </div>
  )
}