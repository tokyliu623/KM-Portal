import { useState } from 'react'
import { Tree, Input, Card, Spin, message, Empty } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { DataState } from '../../components/DataState'
import { kbApi, TreeNode } from '../../services/kb'

const { Search } = Input

interface SelectedNode {
  id: number
  title: string
  type: 'kb' | 'doc'
  kbId: string
}

export function KBBrowser() {
  const [loading, setLoading] = useState(false)
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [selectedKbId, setSelectedKbId] = useState<string>('')
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null)
  const [content, setContent] = useState<string>('')
  const [contentLoading, setContentLoading] = useState(false)

  const loadTree = async (kbId: string, parentId?: number) => {
    setLoading(true)
    try {
      const res = await kbApi.getTree(kbId, parentId)
      if (res.success) {
        setTreeData(res.data)
      }
    } catch (err) {
      message.error((err as Error).message || '加载目录树失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    if (!value) {
      message.warning('请输入 KB ID')
      return
    }
    setSelectedKbId(value)
    loadTree(value)
  }

  const handleExpand = (keys: React.Key[]) => {
    setExpandedKeys(keys)
  }

  const handleSelect = async (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) {
      setSelectedNode(null)
      setContent('')
      return
    }
    const nodeId = selectedKeys[0] as number
    const node = treeData.find((n) => n.id === nodeId)
    if (!node) return

    setSelectedNode({
      id: node.id,
      title: node.title,
      type: 'doc',
      kbId: selectedKbId,
    })

    setContentLoading(true)
    try {
      const res = await kbApi.getContent(selectedKbId, [node.id], 'doc')
      if (res.success && res.data?.content && res.data.content.length > 0) {
        setContent(res.data.content[0].content || '')
      } else {
        setContent('')
      }
    } catch (err) {
      message.error('加载内容失败')
      setContent('')
    } finally {
      setContentLoading(false)
    }
  }

  const renderTreeNodes = (data: TreeNode[]) => {
    return data.map((item) => ({
      title: item.title,
      key: item.id,
      isLeaf: !item.hasChild,
      children: undefined,
    }))
  }

  return (
    <div>
      <PageHeader title="知识库浏览器" subTitle="浏览知识库目录和内容" />
      <Card style={{ marginBottom: 16 }}>
        <Search
          placeholder="输入 KB ID"
          enterButton="加载"
          onSearch={handleSearch}
          style={{ maxWidth: 400 }}
        />
      </Card>
      <DataState loading={loading} empty={!selectedKbId} emptyText="请输入 KB ID 加载知识库目录">
        <div style={{ display: 'flex', gap: 16 }}>
          <Card style={{ flex: 1 }}>
            <Tree
              treeData={renderTreeNodes(treeData)}
              expandedKeys={expandedKeys}
              onExpand={handleExpand}
              onSelect={handleSelect}
              loadData={async (node) => {
                if (!node.isLeaf && selectedKbId) {
                  const res = await kbApi.getTree(selectedKbId, node.key as number)
                  if (res.success) {
                    const children = renderTreeNodes(res.data)
                    return children
                  }
                }
                return []
              }}
            />
          </Card>
          <Card title={selectedNode?.title || '内容预览'} style={{ flex: 1, minWidth: 400 }}>
            {contentLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin />
              </div>
            ) : content ? (
              <div style={{ whiteSpace: 'pre-wrap', maxHeight: 600, overflow: 'auto' }}>
                {content}
              </div>
            ) : (
              <Empty description="选择节点查看内容" />
            )}
          </Card>
        </div>
      </DataState>
    </div>
  )
}