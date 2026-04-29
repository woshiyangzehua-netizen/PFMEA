import { useState } from 'react'
import { Button, Input, Select, message, Modal, Form, List, Tag, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import client from '../../../api/client'

interface Props {
  pfmea: any
  onRefresh: () => void
}

export default function Step5Risk({ pfmea, onRefresh }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const pfmeaId = pfmea?.pfmea?.id
  const risks = pfmea?.risks || []
  const failures = pfmea?.failures || []

  const handleAdd = async (values: any) => {
    try {
      await client.post(`/pfmea/${pfmeaId}/risks`, {
        ...values,
        severity: Number(values.severity),
        occurrence: Number(values.occurrence),
        detection: Number(values.detection),
      })
      message.success('添加成功')
      setModalOpen(false)
      form.resetFields()
      onRefresh()
    } catch (e) {
      message.error('添加失败')
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
  const apLabels: Record<string, string> = {
    H: '高 (H)',
    M: '中 (M)',
    L: '低 (L)',
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          添加风险分析
        </Button>
      </div>
      <List
        bordered
        dataSource={risks}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              title={
                <Space>
                  <span>失效模式: {getFailureDesc(item.failureModeId)}</span>
                  <Tag color={apColors[item.actionPriority]}>{apLabels[item.actionPriority]}</Tag>
                </Space>
              }
              description={
                <div>
                  <div>严重度(S): {item.severity} | 频度(O): {item.occurrence} | 探测度(D): {item.detection}</div>
                  <div>预防措施: {(item.currentPreventionMeasures ? JSON.parse(item.currentPreventionMeasures) : []).join(', ') || '无'}</div>
                  <div>探测措施: {(item.currentDetectionMeasures ? JSON.parse(item.currentDetectionMeasures) : []).join(', ') || '无'}</div>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <Modal title="添加风险分析" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()} width={600}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="failureModeId" label="失效模式" rules={[{ required: true }]}>
            <Select placeholder="选择失效模式">
              {failures.filter((f: any) => f.failureType === 'failure_mode').map((f: any) => (
                <Select.Option key={f.id} value={f.id}>{f.description}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="severity" label="严重度 (S)" rules={[{ required: true }]} initialValue={5}>
            <Input type="number" min={1} max={10} />
          </Form.Item>
          <Form.Item name="occurrence" label="频度 (O)" rules={[{ required: true }]} initialValue={5}>
            <Input type="number" min={1} max={10} />
          </Form.Item>
          <Form.Item name="detection" label="探测度 (D)" rules={[{ required: true }]} initialValue={5}>
            <Input type="number" min={1} max={10} />
          </Form.Item>
          <Form.Item name="currentPreventionMeasures" label="当前预防措施">
            <Input.TextArea rows={2} placeholder="每行一个措施" />
          </Form.Item>
          <Form.Item name="currentDetectionMeasures" label="当前探测措施">
            <Input.TextArea rows={2} placeholder="每行一个措施" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
