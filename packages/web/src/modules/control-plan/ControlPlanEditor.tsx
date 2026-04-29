import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Button, Table, Space, Tag, Modal, Form, Input, Select, message,
  Popconfirm, Switch, Card, Divider, Alert,
} from 'antd'
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import client from '../../api/client'

interface ControlPlanItem {
  id: string
  controlPlanId: string
  processOperationId: string
  productCharacteristics?: string
  processCharacteristics?: string
  characteristicClassification?: string
  controlMethod: string
  measurementTechnique?: string
  sampleSize?: string
  sampleFrequency?: string
  controlTools?: string
  reactionPlan?: string
  linkedPfmeaRiskId?: string
  isKeyControlPoint?: boolean
  responsiblePerson?: string
  displayOrder: number
}

interface OperationOption {
  id: string
  operationNumber: string
  operationName: string
}

export default function ControlPlanEditor() {
  const { id } = useParams<{ id: string }>()
  const [plan, setPlan] = useState<any>(null)
  const [items, setItems] = useState<ControlPlanItem[]>([])
  const [operations, setOperations] = useState<OperationOption[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [consistencyResult, setConsistencyResult] = useState<{ valid: boolean; issues: string[] } | null>(null)
  const [form] = Form.useForm()
  const [editingItem, setEditingItem] = useState<ControlPlanItem | null>(null)

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await client.get(`/control-plans/${id}`)
      setPlan(res.data.plan)
      setItems(res.data.items || [])

      // Load operations if plan has routing
      if (res.data.plan?.processRoutingId) {
        const routingRes = await client.get(`/capp/routings/${res.data.plan.processRoutingId}`)
        setOperations(routingRes.data.operations || [])
      }
    } catch (e) {
      message.error('加载控制计划失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleSaveItem = async (values: any) => {
    if (!id) return
    try {
      if (editingItem) {
        await client.patch(`/control-plans/items/${editingItem.id}`, values)
        message.success('更新成功')
      } else {
        await client.post(`/control-plans/${id}/items`, { ...values, displayOrder: items.length + 1 })
        message.success('添加成功')
      }
      setModalOpen(false)
      form.resetFields()
      setEditingItem(null)
      fetchData()
    } catch (e) {
      message.error('保存失败')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await client.delete(`/control-plans/items/${itemId}`)
      message.success('删除成功')
      fetchData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const openAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (item: ControlPlanItem) => {
    setEditingItem(item)
    form.setFieldsValue({
      processOperationId: item.processOperationId,
      productCharacteristics: item.productCharacteristics,
      processCharacteristics: item.processCharacteristics,
      characteristicClassification: item.characteristicClassification,
      controlMethod: item.controlMethod,
      measurementTechnique: item.measurementTechnique,
      sampleSize: item.sampleSize,
      sampleFrequency: item.sampleFrequency,
      controlTools: item.controlTools,
      reactionPlan: item.reactionPlan,
      isKeyControlPoint: item.isKeyControlPoint,
      responsiblePerson: item.responsiblePerson,
    })
    setModalOpen(true)
  }

  const checkConsistency = async () => {
    if (!id) return
    try {
      const res = await client.get(`/control-plans/${id}/consistency`)
      setConsistencyResult(res.data)
    } catch (e) {
      message.error('检查失败')
    }
  }

  const getOpLabel = (opId: string) => {
    const op = operations.find((o) => o.id === opId)
    return op ? `${op.operationNumber} ${op.operationName}` : opId
  }

  const columns = [
    { title: '序号', dataIndex: 'displayOrder', key: 'displayOrder', width: 60 },
    {
      title: '工序',
      dataIndex: 'processOperationId',
      key: 'processOperationId',
      width: 140,
      render: (opId: string) => getOpLabel(opId),
    },
    {
      title: '产品特性',
      dataIndex: 'productCharacteristics',
      key: 'productCharacteristics',
      ellipsis: true,
    },
    {
      title: '过程特性',
      dataIndex: 'processCharacteristics',
      key: 'processCharacteristics',
      ellipsis: true,
    },
    {
      title: '特性分类',
      dataIndex: 'characteristicClassification',
      key: 'characteristicClassification',
      width: 100,
    },
    { title: '控制方法', dataIndex: 'controlMethod', key: 'controlMethod', width: 120 },
    { title: '测量技术', dataIndex: 'measurementTechnique', key: 'measurementTechnique', width: 120 },
    { title: '样本容量', dataIndex: 'sampleSize', key: 'sampleSize', width: 90 },
    { title: '样本频率', dataIndex: 'sampleFrequency', key: 'sampleFrequency', width: 90 },
    {
      title: '关键控制点',
      dataIndex: 'isKeyControlPoint',
      key: 'isKeyControlPoint',
      width: 100,
      render: (v: boolean) => v ? <Tag color="red">是</Tag> : <Tag>否</Tag>,
    },
    { title: '反应计划', dataIndex: 'reactionPlan', key: 'reactionPlan', ellipsis: true, width: 140 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: ControlPlanItem) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>修改</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDeleteItem(record.id)}>
            <Button danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title={<span>控制计划: {plan?.documentNumber} <Tag>{plan?.revision}</Tag></span>}
        extra={
          <Space>
            <Button icon={<CheckCircleOutlined />} onClick={checkConsistency}>一致性检查</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>添加控制项</Button>
          </Space>
        }
      >
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <span><b>状态:</b> {plan?.status}</span>
          <span><b>关联PFMEA:</b> {plan?.pfmeaId || '无'}</span>
          <span><b>关联工艺路线:</b> {plan?.processRoutingId || '无'}</span>
        </div>

        {consistencyResult && (
          <Alert
            style={{ marginBottom: 16 }}
            type={consistencyResult.valid ? 'success' : 'warning'}
            icon={consistencyResult.valid ? <CheckCircleOutlined /> : <WarningOutlined />}
            message={consistencyResult.valid ? '一致性检查通过' : '发现问题'}
            description={
              consistencyResult.issues.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {consistencyResult.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              ) : '所有检查项均通过'
            }
            closable
            onClose={() => setConsistencyResult(null)}
          />
        )}

        <Divider />
        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          size="small"
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title={editingItem ? '修改控制项' : '添加控制项'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingItem(null); form.resetFields() }}
        onOk={() => form.submit()}
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveItem}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Form.Item name="processOperationId" label="工序">
              <Select placeholder="选择工序" allowClear>
                {operations.map((op) => (
                  <Select.Option key={op.id} value={op.id}>{op.operationNumber} {op.operationName}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="characteristicClassification" label="特性分类">
              <Select placeholder="选择分类" allowClear>
                <Select.Option value="关键特性">关键特性</Select.Option>
                <Select.Option value="重要特性">重要特性</Select.Option>
                <Select.Option value="一般特性">一般特性</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="isKeyControlPoint" label="关键控制点" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <Form.Item name="productCharacteristics" label="产品特性">
              <Input placeholder="如：外径 Φ25±0.01" />
            </Form.Item>
            <Form.Item name="processCharacteristics" label="过程特性">
              <Input placeholder="如：切削速度、进给量" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <Form.Item name="controlMethod" label="控制方法" rules={[{ required: true }]}>
              <Input placeholder="如：SPC / 首检 / 巡检" />
            </Form.Item>
            <Form.Item name="measurementTechnique" label="测量技术">
              <Input placeholder="如：游标卡尺 / 三坐标" />
            </Form.Item>
            <Form.Item name="controlTools" label="控制工具">
              <Input placeholder="如：X-R 控制图" />
            </Form.Item>
            <Form.Item name="sampleSize" label="样本容量">
              <Input placeholder="如：5件 / 100%" />
            </Form.Item>
            <Form.Item name="sampleFrequency" label="样本频率">
              <Input placeholder="如：每小时 / 每批" />
            </Form.Item>
            <Form.Item name="responsiblePerson" label="责任人">
              <Input />
            </Form.Item>
          </div>
          <Form.Item name="reactionPlan" label="反应计划">
            <Input.TextArea rows={2} placeholder="超标时的处理措施..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
