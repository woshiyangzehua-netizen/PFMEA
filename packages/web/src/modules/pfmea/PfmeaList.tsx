import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Table, Space, Tag, Modal, Form, Input, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, BuildOutlined } from '@ant-design/icons'
import client from '../../api/client'

interface PfmeaRecord {
  id: string
  documentNumber: string
  revision: string
  status: string
  productName: string
  partNumber: string
  currentStep: number
  createdAt: string
}

export default function PfmeaList() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<PfmeaRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await client.get('/pfmea')
      setRecords(res.data)
    } catch (e) {
      message.error('加载PFMEA列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (values: any) => {
    try {
      await client.post('/pfmea', values)
      message.success('创建成功')
      setModalOpen(false)
      form.resetFields()
      fetchData()
    } catch (e) {
      message.error('创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await client.delete(`/pfmea/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleGenerateCP = async (record: PfmeaRecord) => {
    try {
      const res = await client.post(`/control-plans/from-pfmea/${record.id}`, {
        documentNumber: `CP-${record.partNumber}-${Date.now()}`,
      })
      message.success(res.data.message || '控制计划生成成功')
    } catch (e) {
      message.error('生成控制计划失败')
    }
  }

  const stepNames = ['', '策划准备', '结构分析', '功能分析', '失效分析', '风险分析', '优化', '结果文件化']

  const columns = [
    { title: '文件编号', dataIndex: 'documentNumber', key: 'documentNumber' },
    { title: '版本', dataIndex: 'revision', key: 'revision', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => {
        const colors: Record<string, string> = { draft: 'default', in_review: 'processing', approved: 'success', obsolete: 'default' }
        const labels: Record<string, string> = { draft: '草案', in_review: '审核中', approved: '已批准', obsolete: '作废' }
        return <Tag color={colors[s] || 'default'}>{labels[s] || s}</Tag>
      },
    },
    { title: '产品名称', dataIndex: 'productName', key: 'productName' },
    { title: '零件号', dataIndex: 'partNumber', key: 'partNumber' },
    {
      title: '当前步骤',
      dataIndex: 'currentStep',
      key: 'currentStep',
      width: 120,
      render: (s: number) => stepNames[s] || `步骤${s}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: PfmeaRecord) => (
        <Space>
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => navigate(`/pfmea/${record.id}`)}>
            编辑
          </Button>
          <Button icon={<BuildOutlined />} size="small" onClick={() => handleGenerateCP(record)}>
            生成CP
          </Button>
          <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>PFMEA 管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建PFMEA
        </Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={records} loading={loading} />

      <Modal title="新建PFMEA" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="documentNumber" label="文件编号" rules={[{ required: true }]}>
            <Input placeholder="PFMEA-2024-001" />
          </Form.Item>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="partNumber" label="零件号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="analysisBoundary" label="分析边界">
            <Input placeholder="如来料检验、工序加工、成品检验等" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
