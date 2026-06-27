import { Typography } from 'antd'

const { Title } = Typography

interface PageHeaderProps {
  title: string
  subTitle?: string
}

export function PageHeader({ title, subTitle }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Title level={3} style={{ marginBottom: 4 }}>{title}</Title>
      {subTitle && <Typography.Text type="secondary">{subTitle}</Typography.Text>}
    </div>
  )
}