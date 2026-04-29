import { useState } from 'react'
import { Tree, Button, Input, Select, Space, message, Modal, Form } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import client from '../../../api/client'

interface Props {
  pfmea: any
  onRefresh: () => void
}

const { Option } = Select

export default function Step2Structure({ pfmea, onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [parentId, setParentId] = useState<string | null>(null)

  const structures = pfmea?.structures || []
  const pfmeaId = pfmea?.pfmea?.id

  // Build tree data
  const buildTree = (nodes: any[], parentId: string | null = null): any[] => {
    return nodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((n) => ({
        key: n.id,
        title: (
          <Space>
            <span>{n.name}</span>
            <span style={{ color: '#999', fontSize: 12 }}>({n.nodeType === 'process_item' ? '过程项' : n.nodeType === 'process_step' ? '过程步骤' : '工作要素'}{n.dimension4m ? ` - ${n.dimension4m}` : ''})</span>
          </Space>
        ),
        children: buildTree(nodes, n.id),
      }))
  }

  const treeData = buildTree(structures)

  const handleAdd = async (values: any) => {
    try {
      await client.post(`/pfmea/${pfmeaId}/structures`, {
        ...values,
        parentId,
        displayOrder: structures.length,
      })
      message.success('添加成功')
      setModalOpen(false)
      form.resetFields()
      onRefresh()
    } catch (e) {
      message.error('添加失败')
    }
  }

  const handleDelete = async (nodeId: string) => {
    try {
      await client.delete(`/pfmea/${pfmeaId}/structures/${nodeId}`)
      message.success('删除成功')
      onRefresh()
    } catch (e) {
      message.error('删除失败')
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setParentId(null); setModalOpen(true) }}>
          添加过程项
        </Button>
      </div>
      <Tree
        treeData={treeData}
        showLine
        blockNode
        titleRender={(node: any) => (
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>{node.title}</span>
            <Space>
              <Button size="small" onClick={() => { setParentId(node.key); setModalOpen(true) }}>添加子项</Button>
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(node.key)} />
            </Space>
          </Space>
        )}
      />

      <Modal title="添加结构节点" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="nodeType" label="节点类型" rules={[{ required: true }]} initialValue={parentId ? 'process_step' : 'process_item'}>
            <Select>
              <Option value="process_item">过程项</Option>
              <Option value="process_step">过程步骤</Option>
              <Option value="work_element">工作要素</Option>
            </Select>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          {parentId && (
            <Form.Item name="dimension4m" label="4M维度">
              <Select placeholder="选择4M维度">
                <Option value="Man">人员 (Man)</Option>
                <Option value="Machine">设备 (Machine)</Option>
                <Option value="Material">材料 (Material)</Option>
                <Option value="Milieu">环境/方法 (Milieu)</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
