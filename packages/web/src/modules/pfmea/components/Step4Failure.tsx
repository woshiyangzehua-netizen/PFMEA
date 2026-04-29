import { useState } from 'react'
import { Button, Input, Select, message, Modal, Form, List, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import client from '../../../api/client'

interface Props {
  pfmea: any
  onRefresh: () => void
}

const { Option } = Select

export default function Step4Failure({ pfmea, onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const pfmeaId = pfmea?.pfmea?.id
  const failures = pfmea?.failures || []
  const functions = pfmea?.functions || []

  const handleAdd = async (values: any) => {
    try {
      await client.post(`/pfmea/${pfmeaId}/failures`, values)
      message.success('添加成功')
      setModalOpen(false)
      form.resetFields()
      onRefresh()
    } catch (e) {
      message.error('添加失败')
    }
  }

  const getFunctionDesc = (id: string) => {
    const f = functions.find((x: any) => x.id === id)
    return f?.functionDescription || id
  }

  const typeColors: Record<string, string> = {
    failure_effect: 'red',
    failure_mode: 'orange',
    failure_cause: 'blue',
  }
  const typeLabels: Record<string, string> = {
    failure_effect: '失效影响',
    failure_mode: '失效模式',
    failure_cause: '失效起因',
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          添加失效
        </Button>
      </div>
      <List
        bordered
        dataSource={failures}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              title={
                <span>
                  <Tag color={typeColors[item.failureType]}>{typeLabels[item.failureType]}</Tag>
                  {item.description}
                  {item.severity ? <Tag style={{ marginLeft: 8 }}>严重度: {item.severity}</Tag> : null}
                </span>
              }
              description={`关联功能: ${getFunctionDesc(item.functionId)}`}
            />
          </List.Item>
        )}
      />

      <Modal title="添加失效" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="functionId" label="关联功能" rules={[{ required: true }]}>
            <Select placeholder="选择功能">
              {functions.map((f: any) => (
                <Option key={f.id} value={f.id}>{f.functionDescription}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="failureType" label="失效类型" rules={[{ required: true }]} initialValue="failure_mode">
            <Select>
              <Option value="failure_effect">失效影响</Option>
              <Option value="failure_mode">失效模式</Option>
              <Option value="failure_cause">失效起因</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="severity" label="严重度 (1-10)">
            <Input type="number" min={1} max={10} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
