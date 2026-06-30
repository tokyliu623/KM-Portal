import { Tree, Card, Empty, Spin } from 'antd'
import type { TreeNode } from '../../../services/wizard'

interface TreeVisualizerProps {
  tree: TreeNode[]
  loading?: boolean
  // v1.8.6: 接收父组件传入的文档数
  docCount?: number
  // v1.8.6: KMStudioPage 传入的生成触发回调
  onGenerate?: () => void | Promise<void>
}

interface AntTreeNode {
  title: string
  key: number
  isLeaf: boolean
  children?: AntTreeNode[]
}

export function TreeVisualizer({ tree, loading, docCount }: TreeVisualizerProps) {
  // v1.8.6: 支持递归树形结构(来自 kbTreeVisualizer.buildTreeFromFlat)
  const renderTreeNodes = (data: TreeNode[]): AntTreeNode[] => {
    return data.map((item) => ({
      title: item.title,
      key: item.id,
      isLeaf: !item.hasChild,
      // 递归保留 children
      children: item.children && item.children.length > 0
        ? renderTreeNodes(item.children)
        : undefined,
    }))
  }

  if (loading) {
    return (
      <Card title={`目录结构${docCount !== undefined ? ` (${docCount} 篇)` : ''}`}>
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
    <Card title={`目录结构${docCount !== undefined ? ` (${docCount} 篇)` : ''}`}>
      <Tree
        treeData={renderTreeNodes(tree)}
        defaultExpandAll
        showLine={{ showLeafIcon: false }}
      />
    </Card>
  )
}