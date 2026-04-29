import { useEffect, useState } from 'react'
import { Button, Table, Space, Tag, Modal, Form, Input, Drawer, InputNumber, Popconfirm, Divider, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, BuildOutlined, ToolOutlined } from '@ant-design/icons'
import client from '../../api/client'
import type { ColumnsType } from 'antd/es/table'

interface RoutingRecord {
  id: string
  routingNumber: string
  partNumber: string
  partName: string
  partRevision: string
  routingType: string
  status: string
}

interface OperationRecord {
  id: string
  processRoutingId: string
  operationNumber: string
  operationName: string
  operationDescription?: string
  department?: string
  workCenter?: string
  equipmentCode?: string
  setupTimeMinutes?: number
  cycleTimeMinutes?: number
  displayOrder: number
}

export default function CappDesigner() {
  const [records, setRecords] = useState<RoutingRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedRouting, setSelectedRouting] = useState<RoutingRecord | null>(null)
  const [operations, setOperations] = useState<OperationRecord[]>([])
  const [opLoading, setOpLoading] = useState(false)
  const [opForm] = Form.useForm()
  const [editingOpId, setEditingOpId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await client.get('/capp/routings')
      setRecords(res.data)
    } catch (e) {
      message.error('加载工艺路线失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (values: any) => {
    try {
      await client.post('/capp/routings', values)
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
      await client.delete(`/capp/routings/${id}`)
      message.success('删除成功')
      fetchData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const openOperationsDrawer = async (record: RoutingRecord) => {
    setSelectedRouting(record)
    setDrawerOpen(true)
    setOpLoading(true)
    try {
      const res = await client.get(`/capp/routings/${record.id}`)
      setOperations(res.data.operations || [])
    } catch (e) {
      message.error('加载工序失败')
    } finally {
      setOpLoading(false)
    }
  }

  const refreshOperations = async () => {
    if (!selectedRouting) return
    setOpLoading(true)
    try {
      const res = await client.get(`/capp/routings/${selectedRouting.id}`)
      setOperations(res.data.operations || [])
    } catch (e) {
      message.error('刷新工序失败')
    } finally {
      setOpLoading(false)
    }
  }

  const handleSaveOperation = async (values: any) => {
    if (!selectedRouting) return
    try {
      if (editingOpId) {
        await client.patch(`/capp/operations/${editingOpId}`, values)
        message.success('更新成功')
      } else {
        await client.post(`/capp/routings/${selectedRouting.id}/operations`, {
          ...values,
          displayOrder: operations.length + 1,
        })
        message.success('添加成功')
      }
      opForm.resetFields()
      setEditingOpId(null)
      refreshOperations()
    } catch (e) {
      message.error('保存失败')
    }
  }

  const handleDeleteOperation = async (id: string) => {
    try {
      await client.delete(`/capp/operations/${id}`)
      message.success('删除成功')
      refreshOperations()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const startEditOperation = (op: OperationRecord) => {
    setEditingOpId(op.id)
    opForm.setFieldsValue({
      operationNumber: op.operationNumber,
      operationName: op.operationName,
      operationDescription: op.operationDescription,
      department: op.department,
      workCenter: op.workCenter,
      equipmentCode: op.equipmentCode,
      setupTimeMinutes: op.setupTimeMinutes,
      cycleTimeMinutes: op.cycleTimeMinutes,
    })
  }

  const cancelEditOperation = () => {
    setEditingOpId(null)
    opForm.resetFields()
  }

  const columns: ColumnsType<RoutingRecord> = [
    { title: '路线编号', dataIndex: 'routingNumber', key: 'routingNumber' },
    { title: '零件号', dataIndex: 'partNumber', key: 'partNumber' },
    { title: '零件名称', dataIndex: 'partName', key: 'partName' },
    { title: '版本', dataIndex: 'partRevision', key: 'partRevision', width: 80 },
    {
      title: '类型',
      dataIndex: 'routingType',
      key: 'routingType',
      width: 100,
      render: (t: string) => {
        const labels: Record<string, string> = { manufacturing: '制造', assembly: '装配', inspection: '检验' }
        return labels[t] || t
      },
    },
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
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: RoutingRecord) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openOperationsDrawer(record)}>编辑工序</Button>
          <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  const opColumns: ColumnsType<OperationRecord> = [
    { title: '序号', dataIndex: 'displayOrder', key: 'displayOrder', width: 60 },
    { title: '工序号', dataIndex: 'operationNumber', key: 'operationNumber', width: 100 },
    { title: '工序名称', dataIndex: 'operationName', key: 'operationName', width: 140 },
    { title: '描述', dataIndex: 'operationDescription', key: 'operationDescription', ellipsis: true },
    { title: '部门', dataIndex: 'department', key: 'department', width: 100 },
    { title: '工作中心', dataIndex: 'workCenter', key: 'workCenter', width: 100 },
    { title: '设备', dataIndex: 'equipmentCode', key: 'equipmentCode', width: 100 },
    { title: '准备时间', dataIndex: 'setupTimeMinutes', key: 'setupTimeMinutes', width: 90, render: (v?: number) => v != null ? `${v}min` : '-' },
    { title: '节拍时间', dataIndex: 'cycleTimeMinutes', key: 'cycleTimeMinutes', width: 90, render: (v?: number) => v != null ? `${v}min` : '-' },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_: any, record: OperationRecord) => (
        <Space>
          <Button size="small" onClick={() => startEditOperation(record)}>修改</Button>
          <Popconfirm title="确认删除此工序？" onConfirm={() => handleDeleteOperation(record.id)}>
            <Button danger size="small">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2><BuildOutlined /> 工艺路线设计</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新建工艺路线
        </Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={records} loading={loading} />

      <Modal title="新建工艺路线" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="routingNumber" label="路线编号" rules={[{ required: true }]}>
            <Input placeholder="ROUTE-2024-001" />
          </Form.Item>
          <Form.Item name="partNumber" label="零件号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="partName" label="零件名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="partRevision" label="版本">
            <Input placeholder="A" />
          </Form.Item>
          <Form.Item name="routingType" label="路线类型" initialValue="manufacturing">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={<span><ToolOutlined /> {selectedRouting?.routingNumber} — 工序编辑</span>}
        width={960}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingOpId(null); opForm.resetFields(); }}
      >
        <div style={{ marginBottom: 16 }}>
          <Space size="large">
            <span><b>零件号:</b> {selectedRouting?.partNumber}</span>
            <span><b>零件名称:</b> {selectedRouting?.partName}</span>
            <span><b>版本:</b> {selectedRouting?.partRevision}</span>
          </Space>
        </div>

        <Divider orientation="left">{editingOpId ? '修改工序' : '添加工序'}</Divider>
        <Form form={opForm} layout="vertical" onFinish={handleSaveOperation}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <Form.Item name="operationNumber" label="工序号" rules={[{ required: true }]}>
              <Input placeholder="010" />
            </Form.Item>
            <Form.Item name="operationName" label="工序名称" rules={[{ required: true }]}>
              <Input placeholder="车削外圆" />
            </Form.Item>
            <Form.Item name="department" label="部门">
              <Input placeholder="机加车间" />
            </Form.Item>
            <Form.Item name="workCenter" label="工作中心">
              <Input placeholder="WC-01" />
            </Form.Item>
            <Form.Item name="equipmentCode" label="设备代码">
              <Input placeholder="LATHE-001" />
            </Form.Item>
            <Form.Item name="setupTimeMinutes" label="准备时间(分钟)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="cycleTimeMinutes" label="节拍时间(分钟)">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="operationDescription" label="工序描述">
            <Input.TextArea rows={2} placeholder="详细描述工序内容和要求..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={() => opForm.submit()}>{editingOpId ? '保存修改' : '添加工序'}</Button>
              {editingOpId && <Button onClick={cancelEditOperation}>取消</Button>}
            </Space>
          </Form.Item>
        </Form>

        <Divider orientation="left">工序列表</Divider>
        <Table
          rowKey="id"
          columns={opColumns}
          dataSource={operations}
          loading={opLoading}
          size="small"
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Drawer>
    </div>
  )
}
