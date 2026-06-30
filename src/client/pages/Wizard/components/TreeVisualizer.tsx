import { Tree, Card, Empty, Spin } from 'antd'
import type { TreeNode } from '../../services/wizard'

interface TreeVisualizerProps {
  tree: TreeNode[]
  loading?: boolean
}

export function TreeVisualizer({ tree, loading }: TreeVisualizerProps) {
  const renderTreeNodes = (data: TreeNode[]): Array<{
    title: string
    key: number
    isLeaf: boolean
    children?: Array<{
      title: string
      key: number
      isLeaf: boolean
      children?: unknown[]
    }>
  }> => {
    return data.map((item) => ({
      title: item.title,
      key: item.id,
      isLeaf: !item.hasChild,
      children: undefined,
    }))
  }

  if (loading) {
    return (
      <Card title="目录结构">
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      </Card>
    )
  }

  if (tree.length === 0) {
    return (
      <Card title="目录结构">
        <Empty description="暂无目录数据" />
      </Card>
    )
  }

  return (
    <Card title="目录结构">
      <Tree
        treeData={renderTreeNodes(tree)}
        defaultExpandAll
        showLine={{ showLeafIcon: false }}
      />
    </Card>
  )
}