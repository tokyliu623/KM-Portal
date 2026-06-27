import { useState } from 'react'
import { Tree, Input, Card, Spin, message } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { Loading } from '../../components/Loading'
import { kbApi, TreeNode } from '../../services/kb'

const { Search } = Input

export function KBBrowser() {
  const [loading, setLoading] = useState(false)
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [selectedKbId, setSelectedKbId] = useState<string>('')

  const loadTree = async (kbId: string, parentId?: number) => {
    setLoading(true)
    try {
      const res = await kbApi.getTree(kbId, parentId)
      if (res.code === 1) {
        setTreeData(res.data)
      }
    } catch {
      message.error('加载目录树失败')
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

  const renderTreeNodes = (data: TreeNode[]) => {
    return data.map((item) => ({
      title: item.title,
      key: item.id,
      isLeaf: !item.hasChild,
      children: item.hasChild ? undefined : undefined,
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
      {loading ? (
        <Loading />
      ) : treeData.length > 0 ? (
        <Card>
          <Tree
            treeData={renderTreeNodes(treeData)}
            expandedKeys={expandedKeys}
            onExpand={handleExpand}
            loadData={async (node) => {
              if (!node.isLeaf && selectedKbId) {
                const res = await kbApi.getTree(selectedKbId, node.key as number)
                if (res.code === 1) {
                  const children = renderTreeNodes(res.data)
                  return children
                }
              }
              return []
            }}
          />
        </Card>
      ) : (
        <Card>
          <p style={{ textAlign: 'center', color: '#999' }}>请输入 KB ID 加载知识库目录</p>
        </Card>
      )}
    </div>
  )
}