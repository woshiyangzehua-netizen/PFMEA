import { useState } from 'react'
import { Button, Input, Select, message, Modal, Form, List } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import client from '../../../api/client'

interface Props {
  pfmea: any
  onRefresh: () => void
}

const { Option } = Select

export default function Step3Function({ pfmea, onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const pfmeaId = pfmea?.pfmea?.id
  const functions = pfmea?.functions || []
  const structures = pfmea?.structures || []

  const handleAdd = async (values: any) => {
    try {
      await client.post(`/pfmea/${pfmeaId}/functions`, values)
      message.success('添加成功')
      setModalOpen(false)
      form.resetFields()
      onRefresh()
    } catch (e) {
      message.error('添加失败')
    }
  }

  const getStructureName = (id: string) => {
    const s = structures.find((x: any) => x.id === id)
    return s?.name || id
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          添加功能
        </Button>
      </div>
      <List
        bordered
        dataSource={functions}
        renderItem={(item: any) => (
          <List.Item
            actions={[
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => {}}>删除</Button>,
            ]}
          >
            <List.Item.Meta
              title={item.functionDescription}
              description={`关联节点: ${getStructureName(item.structureNodeId)} | 类型: ${item.functionType}`}
            />
          </List.Item>
        )}
      />

      <Modal title="添加功能" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="structureNodeId" label="关联结构节点" rules={[{ required: true }]}>
            <Select placeholder="选择结构节点">
              {structures.map((s: any) => (
                <Option key={s.id} value={s.id}>{s.name} ({s.nodeType})</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="functionType" label="功能类型" rules={[{ required: true }]} initialValue="process_step_func">
            <Select>
              <Option value="process_item_func">过程项功能</Option>
              <Option value="process_step_func">过程步骤功能</Option>
              <Option value="work_element_func">工作要素功能</Option>
            </Select>
          </Form.Item>
          <Form.Item name="functionDescription" label="功能描述" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="如：保证外圆直径φ50±0.02" />
          </Form.Item>
          <Form.Item name="requirement" label="要求">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
