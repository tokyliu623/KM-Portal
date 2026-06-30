import { Typography, Space } from 'antd'

const { Title } = Typography

interface PageHeaderProps {
  title: string
  subTitle?: string
  extra?: React.ReactNode
}

export function PageHeader({ title, subTitle, extra }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Title level={3} style={{ marginBottom: 4 }}>{title}</Title>
        {subTitle && <Typography.Text type="secondary">{subTitle}</Typography.Text>}
      </div>
      {extra && <Space>{extra}</Space>}
    </div>
  )
}