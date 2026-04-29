import { useEffect, useState } from 'react'
import { Tabs, Table, Button, Space, Tag, Modal, Form, Input, Select, message, InputNumber, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons'
import client from '../../api/client'

interface KbItem { id: string; code: string; name: string; category?: string; description?: string; usageCount?: number }
interface KbStep { id: string; processItemId?: string; code: string; name: string; standardEquipmentTypes?: string; typicalParameters?: string; usageCount?: number }
interface KbFailure { id: string; failureType: string; parentId?: string; code?: string; description: string; category?: string; defaultSeverity?: number; usageCount?: number }

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState('items')
  const [items, setItems] = useState<KbItem[]>([])
  const [steps, setSteps] = useState<KbStep[]>([])
  const [failures, setFailures] = useState<KbFailure[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [itemsRes, stepsRes, failuresRes] = await Promise.all([
        client.get('/kb/process-items'),
        client.get('/kb/process-steps'),
        client.get('/kb/failures'),
      ])
      setItems(itemsRes.data)
      setSteps(stepsRes.data)
      setFailures(failuresRes.data)
    } catch (e) {
      message.error('加载知识库失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (record: any) => {
    setEditingRecord(record)
    if (activeTab === 'items') {
      form.setFieldsValue({ code: record.code, name: record.name, category: record.category, description: record.description })
    } else if (activeTab === 'steps') {
      form.setFieldsValue({ code: record.code, name: record.name, processItemId: record.processItemId })
    } else {
      form.setFieldsValue({
        failureType: record.failureType,
        parentId: record.parentId,
        code: record.code,
        description: record.description,
        category: record.category,
        defaultSeverity: record.defaultSeverity,
      })
    }
    setModalOpen(true)
  }

  const handleSave = async (values: any) => {
    try {
      if (activeTab === 'items') {
        if (editingRecord) {
          await client.patch(`/kb/process-items/${editingRecord.id}`, values)
        } else {
          await client.post('/kb/process-items', values)
        }
      } else if (activeTab === 'steps') {
        if (editingRecord) {
          await client.patch(`/kb/process-steps/${editingRecord.id}`, values)
        } else {
          await client.post('/kb/process-steps', values)
        }
      } else {
        if (editingRecord) {
          await client.patch(`/kb/failures/${editingRecord.id}`, values)
        } else {
          await client.post('/kb/failures', values)
        }
      }
      message.success(editingRecord ? '更新成功' : '添加成功')
      setModalOpen(false)
      form.resetFields()
      setEditingRecord(null)
      fetchData()
    } catch (e) {
      message.error('保存失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const endpoint = activeTab === 'items' ? `/kb/process-items/${id}` : activeTab === 'steps' ? `/kb/process-steps/${id}` : `/kb/failures/${id}`
      await client.delete(endpoint)
      message.success('删除成功')
      fetchData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const getItemName = (id?: string) => {
    if (!id) return '-'
    const found = items.find((i) => i.id === id)
    return found ? `${found.name} (${found.code})` : id
  }

  const filteredItems = items.filter((i) =>
    (i.name?.includes(searchText) || i.code?.includes(searchText) || i.category?.includes(searchText))
  )
  const filteredSteps = steps.filter((s) =>
    (s.name?.includes(searchText) || s.code?.includes(searchText) || getItemName(s.processItemId).includes(searchText))
  )
  const filteredFailures = failures.filter((f) =>
    (f.description?.includes(searchText) || f.code?.includes(searchText) || f.category?.includes(searchText) || f.failureType?.includes(searchText))
  )

  const itemColumns = [
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>修改</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const stepColumns = [
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '所属过程项', dataIndex: 'processItemId', key: 'processItemId', render: (id: string) => getItemName(id) },
    { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>修改</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const failureColumns = [
    { title: '类型', dataIndex: 'failureType', key: 'failureType', width: 100, render: (t: string) => <Tag>{t}</Tag> },
    { title: '编码', dataIndex: 'code', key: 'code' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '类别', dataIndex: 'category', key: 'category' },
    { title: '默认严重度', dataIndex: 'defaultSeverity', key: 'defaultSeverity', width: 100 },
    { title: '使用次数', dataIndex: 'usageCount', key: 'usageCount', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)}>修改</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'items',
      label: `过程项 (${items.length})`,
      children: <Table rowKey="id" columns={itemColumns} dataSource={filteredItems} loading={loading} size="small" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'steps',
      label: `过程步骤 (${steps.length})`,
      children: <Table rowKey="id" columns={stepColumns} dataSource={filteredSteps} loading={loading} size="small" pagination={{ pageSize: 10 }} />,
    },
    {
      key: 'failures',
      label: `失效知识 (${failures.length})`,
      children: <Table rowKey="id" columns={failureColumns} dataSource={filteredFailures} loading={loading} size="small" pagination={{ pageSize: 10 }} />,
    },
  ]

  const entityName = activeTab === 'items' ? '过程项' : activeTab === 'steps' ? '过程步骤' : '失效'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>知识库管理</h2>
        <Space>
          <Input
            placeholder="搜索..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
            allowClear
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            添加{entityName}
          </Button>
        </Space>
      </div>
      <Tabs activeKey={activeTab} onChange={(k) => { setActiveTab(k); setSearchText('') }} items={tabItems} />

      <Modal
        title={`${editingRecord ? '修改' : '添加'}${entityName}`}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingRecord(null); form.resetFields() }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          {activeTab === 'items' && (
            <>
              <Form.Item name="code" label="编码" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="category" label="类别"><Input placeholder="如：机加工、热处理" /></Form.Item>
              <Form.Item name="description" label="描述"><Input.TextArea rows={2} /></Form.Item>
            </>
          )}
          {activeTab === 'steps' && (
            <>
              <Form.Item name="code" label="编码" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
              <Form.Item name="processItemId" label="所属过程项">
                <Select placeholder="选择过程项" allowClear>
                  {items.map((i: any) => <Select.Option key={i.id} value={i.id}>{i.name} ({i.code})</Select.Option>)}
                </Select>
              </Form.Item>
            </>
          )}
          {activeTab === 'failures' && (
            <>
              <Form.Item name="failureType" label="失效类型" rules={[{ required: true }]} initialValue="mode">
                <Select>
                  <Select.Option value="effect">失效影响</Select.Option>
                  <Select.Option value="mode">失效模式</Select.Option>
                  <Select.Option value="cause">失效起因</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="parentId" label="关联上级失效">
                <Select placeholder="选择关联的失效模式/影响（构建失效链）" allowClear>
                  {failures.filter((f: any) => f.failureType === 'mode' || f.failureType === 'effect').map((f: any) => (
                    <Select.Option key={f.id} value={f.id}>{f.description} ({f.failureType})</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="code" label="编码"><Input /></Form.Item>
              <Form.Item name="description" label="描述" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
              <Form.Item name="category" label="类别"><Input placeholder="如：尺寸偏差、表面缺陷" /></Form.Item>
              <Form.Item name="defaultSeverity" label="默认严重度">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}
