import { useState } from 'react'
import { Button, Input, DatePicker, Select, message, Modal, Form, List, Tag, Space } from 'antd'
import { EditOutlined } from '@ant-design/icons'
import client from '../../../api/client'

interface Props {
  pfmea: any
  onRefresh: () => void
}

export default function Step6Optimization({ pfmea, onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [currentRisk, setCurrentRisk] = useState<any>(null)
  const pfmeaId = pfmea?.pfmea?.id
  const risks = pfmea?.risks || []
  const failures = pfmea?.failures || []

  const handleUpdate = async (values: any) => {
    if (!currentRisk) return
    try {
      await client.patch(`/pfmea/${pfmeaId}/risks/${currentRisk.id}`, {
        ...values,
        optimizedOccurrence: values.optimizedOccurrence ? Number(values.optimizedOccurrence) : undefined,
        optimizedDetection: values.optimizedDetection ? Number(values.optimizedDetection) : undefined,
        optimizedSeverity: values.optimizedSeverity ? Number(values.optimizedSeverity) : undefined,
        targetDate: values.targetDate?.toISOString(),
      })
      message.success('更新成功')
      setModalOpen(false)
      setCurrentRisk(null)
      onRefresh()
    } catch (e) {
      message.error('更新失败')
    }
  }

  const getFailureDesc = (id: string) => {
    const f = failures.find((x: any) => x.id === id)
    return f?.description || id
  }

  const apColors: Record<string, string> = {
    H: 'red',
    M: 'orange',
    L: 'green',
  }

  const openEdit = (risk: any) => {
    setCurrentRisk(risk)
    form.setFieldsValue({
      ...risk,
      recommendedActions: risk.recommendedActions ? JSON.parse(risk.recommendedActions).join('\n') : '',
      targetDate: risk.targetDate ? new Date(risk.targetDate) : null,
    })
    setModalOpen(true)
  }

  return (
    <div>
      <h3>风险优化跟踪</h3>
      <List
        bordered
        dataSource={risks}
        renderItem={(item: any) => (
          <List.Item
            actions={[
              <Button icon={<EditOutlined />} onClick={() => openEdit(item)}>优化</Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <span>{getFailureDesc(item.failureModeId)}</span>
                  <Tag color={apColors[item.actionPriority]}>当前AP: {item.actionPriority}</Tag>
                  {item.optimizedAp && <Tag color={apColors[item.optimizedAp]}>优化后AP: {item.optimizedAp}</Tag>}
                </Space>
              }
              description={
                <div>
                  <div>建议措施: {(item.recommendedActions ? JSON.parse(item.recommendedActions) : []).join(', ') || '无'}</div>
                  <div>责任人: {item.responsiblePerson || '未分配'} | 目标日期: {item.targetDate || '未设置'} | 状态: {item.actionStatus}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Modal title="优化措施" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Form.Item name="recommendedActions" label="建议措施">
            <Input.TextArea rows={3} placeholder="每行一个措施" />
          </Form.Item>
          <Form.Item name="responsiblePerson" label="责任人">
            <Input />
          </Form.Item>
          <Form.Item name="targetDate" label="目标完成日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="actionStatus" label="措施状态" initialValue="open">
            <Select>
              <Select.Option value="open">待处理</Select.Option>
              <Select.Option value="in_progress">进行中</Select.Option>
              <Select.Option value="implemented">已实施</Select.Option>
              <Select.Option value="verified">已验证</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="optimizedSeverity" label="优化后严重度">
            <Input type="number" min={1} max={10} />
          </Form.Item>
          <Form.Item name="optimizedOccurrence" label="优化后频度">
            <Input type="number" min={1} max={10} />
          </Form.Item>
          <Form.Item name="optimizedDetection" label="优化后探测度">
            <Input type="number" min={1} max={10} />
          </Form.Item>
          <Form.Item name="verificationMethod" label="验证方法">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="verificationResult" label="验证结果">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
