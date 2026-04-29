import { useEffect, useState } from 'react'
import { Button, Table, Space, Tag, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, BuildOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import client from '../../api/client'

interface ControlPlanRecord {
  id: string
  documentNumber: string
  revision?: string
  status?: string
  pfmeaId: string
  processRoutingId: string
  createdAt?: string
}

interface PfmeaOption {
  id: string
  documentNumber: string
  productName: string
  partNumber: string
}

export default function ControlPlanList() {
  const [records, setRecords] = useState<ControlPlanRecord[]>([])
  const [pfmeaOptions, setPfmeaOptions] = useState<PfmeaOption[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [genModalOpen, setGenModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [genForm] = Form.useForm()
  const navigate = useNavigate()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [cpRes, pfmeaRes] = await Promise.all([
        client.get('/control-plans'),
        client.get('/pfmea'),
      ])
      setRecords(cpRes.data)
      setPfmeaOptions(pfmeaRes.data)
    } catch (e) {
      message.error('加载控制计划失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (values: any) => {
    try {
      await client.post('/control-plans', values)
      message.success('创建成功')
      setModalOpen(false)
      form.resetFields()
      fetchData()
    } catch (e) {
      message.error('创建失败')
    }
  }

  const handleGenerate = async (values: any) => {
    try {
      const res = await client.post(`/control-plans/from-pfmea/${values.pfmeaId}`, values)
      message.success(res.data.message || '生成成功')
      setGenModalOpen(false)
      genForm.resetFields()
      fetchData()
    } catch (e) {
      message.error('生成失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/control-plans/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const columns = [
    { title: '文档编号', dataIndex: 'documentNumber', key: 'documentNumber' },
    { title: '版本', dataIndex: 'revision', key: 'revision', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const colors: Record<string, string> = { draft: 'default', released: 'success', obsolete: 'default' }
        const labels: Record<string, string> = { draft: '草案', released: '已发布', obsolete: '作废' }
        return <Tag color={colors[s] || 'default'}>{labels[s] || s}</Tag>
      },
    },
    {
      title: '关联PFMEA',
      dataIndex: 'pfmeaId',
      key: 'pfmeaId',
      render: (id: string) => {
        const p = pfmeaOptions.find((x) => x.id === id)
        return p ? `${p.documentNumber} (${p.productName})` : id
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ControlPlanRecord) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => navigate(`/control-plans/${record.id}`)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2><FileTextOutlined /> 控制计划管理</h2>
        <Space>
          <Button icon={<BuildOutlined />} onClick={() => setGenModalOpen(true)}>从PFMEA生成</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建控制计划</Button>
        </Space>
      </div>
      <Table rowKey="id" columns={columns} dataSource={records} loading={loading} />

      <Modal title="新建控制计划" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="documentNumber" label="文档编号" rules={[{ required: true }]}>
            <Input placeholder="CP-2024-001" />
          </Form.Item>
          <Form.Item name="revision" label="版本" initialValue="A">
            <Input />
          </Form.Item>
          <Form.Item name="pfmeaId" label="关联PFMEA">
            <Select placeholder="选择PFMEA" allowClear>
              {pfmeaOptions.map((p) => (
                <Select.Option key={p.id} value={p.id}>{p.documentNumber} — {p.productName} ({p.partNumber})</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="从PFMEA自动生成控制计划" open={genModalOpen} onCancel={() => setGenModalOpen(false)} onOk={() => genForm.submit()}>
        <Form form={genForm} layout="vertical" onFinish={handleGenerate}>
          <Form.Item name="pfmeaId" label="选择PFMEA" rules={[{ required: true }]}>
            <Select placeholder="选择PFMEA以生成控制计划">
              {pfmeaOptions.map((p) => (
                <Select.Option key={p.id} value={p.id}>{p.documentNumber} — {p.productName} ({p.partNumber})</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="documentNumber" label="控制计划编号">
            <Input placeholder="留空则自动生成" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
