import React from 'react'
import { Spin, Empty, Result, Button } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

interface DataStateProps {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyText?: string
  children: React.ReactNode
}

export const DataState: React.FC<DataStateProps> = ({
  loading,
  error,
  empty,
  emptyText = '暂无数据',
  children,
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
      </div>
    )
  }

  if (error) {
    return (
      <Result
        status="error"
        title="加载失败"
        subTitle={error}
        extra={<Button onClick={() => window.location.reload()}>刷新</Button>}
      />
    )
  }

  if (empty) {
    return <Empty description={emptyText} style={{ padding: 48 }} />
  }

  return <>{children}</>
}