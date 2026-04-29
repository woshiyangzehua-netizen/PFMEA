import { useEffect, useState, useMemo } from 'react'
import { Button, Space, message, Modal, Form, Input, InputNumber, Select } from 'antd'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, ClientSideRowModelModule } from 'ag-grid-community'
import type { ColDef } from 'ag-grid-community'
import { PlusOutlined, SaveOutlined } from '@ant-design/icons'
import client from '../../../api/client'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'

ModuleRegistry.registerModules([ClientSideRowModelModule])

interface Props {
  pfmeaId: string
}

interface TableRow {
  id: string
  structureId: string
  structurePath: string
  processItem: string
  processStep: string
  workElement: string
  functionId: string
  functionDesc: string
  requirement: string
  failureModeId: string
  failureMode: string
  failureEffect: string
  failureCause: string
  severity: number
  occurrence: number
  detection: number
  ap: string
  currentPrevention: string
  currentDetection: string
  recommendedActions: string
  responsiblePerson: string
  targetDate: string
  actionStatus: string
  riskId: string
}

export default function PfmeaTableView({ pfmeaId }: Props) {
  const [rowData, setRowData] = useState<TableRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'structure' | 'function' | 'failure' | 'risk'>('structure')
  const [form] = Form.useForm()
  const [structures, setStructures] = useState<any[]>([])
  const [functions, setFunctions] = useState<any[]>([])
  const [failures, setFailures] = useState<any[]>([])

  const fetchData = async () => {
    try {
      const res = await client.get(`/pfmea/${pfmeaId}`)
      const { structures: s, functions: f, failures: fa, risks: r } = res.data
      setStructures(s)
      setFunctions(f)
      setFailures(fa)

      // Flatten to table rows
      const rows: TableRow[] = []
      for (const st of s) {
        const stFuncs = f.filter((fn: any) => fn.structureNodeId === st.id)
        for (const fn of stFuncs) {
          const fnFailures = fa.filter((fl: any) => fl.functionId === fn.id)
          const fnModes = fnFailures.filter((fl: any) => fl.failureType === 'failure_mode')
          for (const fm of fnModes) {
            const fmEffects = fnFailures.filter((fl: any) => fl.failureType === 'failure_effect' && (fl.parentFailureId === fm.id || fl.relatedFailureEffectId === fm.id))
            const fmCauses = fnFailures.filter((fl: any) => fl.failureType === 'failure_cause' && fl.parentFailureId === fm.id)
            const risk = r.find((ri: any) => ri.failureModeId === fm.id)

            const parentItem = s.find((p: any) => p.id === st.parentId)
            const grandparent = parentItem ? s.find((p: any) => p.id === parentItem.parentId) : null
            const pathParts: string[] = []
            if (st.nodeType === 'process_item') pathParts.push(st.name)
            else if (st.nodeType === 'process_step') {
              pathParts.push(parentItem?.name || '')
              pathParts.push(st.name)
            } else {
              pathParts.push(grandparent?.name || '')
              pathParts.push(parentItem?.name || '')
              pathParts.push(`${st.name} (${st.dimension4m})`)
            }

            rows.push({
              id: `${st.id}-${fn.id}-${fm.id}`,
              structureId: st.id,
              structurePath: pathParts.join(' > '),
              processItem: st.nodeType === 'process_item' ? st.name : (st.nodeType === 'process_step' ? parentItem?.name || '' : (grandparent?.name || '')),
              processStep: st.nodeType === 'process_step' ? st.name : (st.nodeType === 'work_element' ? parentItem?.name || '' : ''),
              workElement: st.nodeType === 'work_element' ? `${st.name} (${st.dimension4m})` : '',
              functionId: fn.id,
              functionDesc: fn.functionDescription,
              requirement: fn.requirement || '',
              failureModeId: fm.id,
              failureMode: fm.description,
              failureEffect: fmEffects.map((e: any) => e.description).join('; '),
              failureCause: fmCauses.map((c: any) => c.description).join('; '),
              severity: risk?.severity ?? fm.severity ?? '',
              occurrence: risk?.occurrence ?? '',
              detection: risk?.detection ?? '',
              ap: risk?.actionPriority ?? '',
              currentPrevention: risk?.currentPreventionMeasures ? JSON.parse(risk.currentPreventionMeasures).join('; ') : '',
              currentDetection: risk?.currentDetectionMeasures ? JSON.parse(risk.currentDetectionMeasures).join('; ') : '',
              recommendedActions: risk?.recommendedActions ? JSON.parse(risk.recommendedActions).join('; ') : '',
              responsiblePerson: risk?.responsiblePerson || '',
              targetDate: risk?.targetDate || '',
              actionStatus: risk?.actionStatus || '',
              riskId: risk?.id || '',
            })
          }
        }
      }
      setRowData(rows)
    } catch (e) {
      message.error('加载PFMEA数据失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [pfmeaId])

  const columnDefs = useMemo<ColDef[]>(() => [
    {
      headerName: '结构分析',
      children: [
        { field: 'processItem', headerName: '过程项', width: 120, editable: false },
        { field: 'processStep', headerName: '过程步骤', width: 120, editable: false },
        { field: 'workElement', headerName: '工作要素', width: 120, editable: false },
      ],
    },
    {
      headerName: '功能分析',
      children: [
        { field: 'functionDesc', headerName: '功能', width: 180, editable: false },
        { field: 'requirement', headerName: '要求', width: 140, editable: false },
      ],
    },
    {
      headerName: '失效分析',
      children: [
        { field: 'failureMode', headerName: '失效模式', width: 160, editable: false },
        { field: 'failureEffect', headerName: '失效影响', width: 160, editable: false },
        { field: 'failureCause', headerName: '失效起因', width: 160, editable: false },
      ],
    },
    {
      headerName: '风险分析',
      children: [
        { field: 'severity', headerName: 'S', width: 60, editable: true, type: 'numericColumn' },
        { field: 'occurrence', headerName: 'O', width: 60, editable: true, type: 'numericColumn' },
        { field: 'detection', headerName: 'D', width: 60, editable: true, type: 'numericColumn' },
        {
          field: 'ap',
          headerName: 'AP',
          width: 70,
          cellStyle: (params: any) => {
            if (params.value === 'H') return { backgroundColor: '#ffccc7', color: '#cf1322', fontWeight: 'bold' }
            if (params.value === 'M') return { backgroundColor: '#ffe7ba', color: '#d46b08', fontWeight: 'bold' }
            if (params.value === 'L') return { backgroundColor: '#d9f7be', color: '#389e0d', fontWeight: 'bold' }
            return {}
          },
        },
        { field: 'currentPrevention', headerName: '当前预防措施', width: 180, editable: true },
        { field: 'currentDetection', headerName: '当前探测措施', width: 180, editable: true },
      ],
    },
    {
      headerName: '优化',
      children: [
        { field: 'recommendedActions', headerName: '建议措施', width: 180, editable: true },
        { field: 'responsiblePerson', headerName: '责任人', width: 100, editable: true },
        { field: 'targetDate', headerName: '目标日期', width: 110, editable: true },
        {
          field: 'actionStatus',
          headerName: '状态',
          width: 90,
          editable: true,
          cellEditor: 'agSelectCellEditor',
          cellEditorParams: { values: ['open', 'in_progress', 'implemented', 'verified'] },
        },
      ],
    },
  ], [])

  const onCellValueChanged = async (event: any) => {
    const row = event.data as TableRow
    const col = event.colDef.field
    if (!row.riskId && (col === 'severity' || col === 'occurrence' || col === 'detection' || col === 'currentPrevention' || col === 'currentDetection')) {
      // Need to create risk first
      message.warning('请先为此失效模式添加风险分析')
      return
    }

    if (!row.riskId) return

    try {
      const update: any = {}
      if (col === 'severity') update.severity = Number(event.newValue)
      if (col === 'occurrence') update.occurrence = Number(event.newValue)
      if (col === 'detection') update.detection = Number(event.newValue)
      if (col === 'currentPrevention') update.currentPreventionMeasures = event.newValue ? event.newValue.split(';').map((s: string) => s.trim()) : []
      if (col === 'currentDetection') update.currentDetectionMeasures = event.newValue ? event.newValue.split(';').map((s: string) => s.trim()) : []
      if (col === 'recommendedActions') update.recommendedActions = event.newValue ? event.newValue.split(';').map((s: string) => s.trim()) : []
      if (col === 'responsiblePerson') update.responsiblePerson = event.newValue
      if (col === 'targetDate') update.targetDate = event.newValue
      if (col === 'actionStatus') update.actionStatus = event.newValue

      await client.patch(`/pfmea/${pfmeaId}/risks/${row.riskId}`, update)
      message.success('保存成功')
      fetchData()
    } catch (e) {
      message.error('保存失败')
    }
  }

  const openAddModal = (type: 'structure' | 'function' | 'failure' | 'risk') => {
    setModalType(type)
    form.resetFields()
    setModalOpen(true)
  }

  const handleAdd = async (values: any) => {
    try {
      if (modalType === 'structure') {
        await client.post(`/pfmea/${pfmeaId}/structures`, values)
      } else if (modalType === 'function') {
        await client.post(`/pfmea/${pfmeaId}/functions`, values)
      } else if (modalType === 'failure') {
        await client.post(`/pfmea/${pfmeaId}/failures`, values)
      } else if (modalType === 'risk') {
        await client.post(`/pfmea/${pfmeaId}/risks`, {
          ...values,
          severity: Number(values.severity),
          occurrence: Number(values.occurrence),
          detection: Number(values.detection),
        })
      }
      message.success('添加成功')
      setModalOpen(false)
      fetchData()
    } catch (e) {
      message.error('添加失败')
    }
  }

  return (
    <div style={{ height: 'calc(100vh - 220px)' }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openAddModal('structure')}>添加结构</Button>
        <Button icon={<PlusOutlined />} onClick={() => openAddModal('function')}>添加功能</Button>
        <Button icon={<PlusOutlined />} onClick={() => openAddModal('failure')}>添加失效</Button>
        <Button icon={<PlusOutlined />} onClick={() => openAddModal('risk')}>添加风险</Button>
        <Button icon={<SaveOutlined />} onClick={fetchData}>刷新</Button>
      </div>
      <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={{ resizable: true, sortable: true, filter: true }}
          onCellValueChanged={onCellValueChanged}
          animateRows={true}
          loadingOverlayComponentParams={{ loadingMessage: '加载中...' }}
          localeText={{ noRowsToShow: '暂无数据，请在向导中添加结构、功能和失效分析' }}
        />
      </div>

      <Modal
        title={modalType === 'structure' ? '添加结构节点' : modalType === 'function' ? '添加功能' : modalType === 'failure' ? '添加失效' : '添加风险分析'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          {modalType === 'structure' && (
            <>
              <Form.Item name="nodeType" label="节点类型" rules={[{ required: true }]} initialValue="process_step">
                <Select>
                  <Select.Option value="process_item">过程项</Select.Option>
                  <Select.Option value="process_step">过程步骤</Select.Option>
                  <Select.Option value="work_element">工作要素</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="name" label="名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="parentId" label="父节点">
                <Select placeholder="选择父节点（可选）" allowClear>
                  {structures.map((s: any) => (
                    <Select.Option key={s.id} value={s.id}>{s.name} ({s.nodeType})</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="dimension4m" label="4M维度">
                <Select placeholder="选择4M维度">
                  <Select.Option value="Man">人员 (Man)</Select.Option>
                  <Select.Option value="Machine">设备 (Machine)</Select.Option>
                  <Select.Option value="Material">材料 (Material)</Select.Option>
                  <Select.Option value="Milieu">环境/方法 (Milieu)</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
          {modalType === 'function' && (
            <>
              <Form.Item name="structureNodeId" label="关联结构节点" rules={[{ required: true }]}>
                <Select>
                  {structures.map((s: any) => (
                    <Select.Option key={s.id} value={s.id}>{s.name} ({s.nodeType})</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="functionType" label="功能类型" rules={[{ required: true }]} initialValue="process_step_func">
                <Select>
                  <Select.Option value="process_item_func">过程项功能</Select.Option>
                  <Select.Option value="process_step_func">过程步骤功能</Select.Option>
                  <Select.Option value="work_element_func">工作要素功能</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="functionDescription" label="功能描述" rules={[{ required: true }]}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}
          {modalType === 'failure' && (
            <>
              <Form.Item name="functionId" label="关联功能" rules={[{ required: true }]}>
                <Select>
                  {functions.map((f: any) => (
                    <Select.Option key={f.id} value={f.id}>{f.functionDescription}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="failureType" label="失效类型" rules={[{ required: true }]} initialValue="failure_mode">
                <Select>
                  <Select.Option value="failure_effect">失效影响</Select.Option>
                  <Select.Option value="failure_mode">失效模式</Select.Option>
                  <Select.Option value="failure_cause">失效起因</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="description" label="描述" rules={[{ required: true }]}>
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}
          {modalType === 'risk' && (
            <>
              <Form.Item name="failureModeId" label="失效模式" rules={[{ required: true }]}>
                <Select>
                  {failures.filter((f: any) => f.failureType === 'failure_mode').map((f: any) => (
                    <Select.Option key={f.id} value={f.id}>{f.description}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Space>
                <Form.Item name="severity" label="严重度(S)" rules={[{ required: true }]} initialValue={5}>
                  <InputNumber min={1} max={10} />
                </Form.Item>
                <Form.Item name="occurrence" label="频度(O)" rules={[{ required: true }]} initialValue={5}>
                  <InputNumber min={1} max={10} />
                </Form.Item>
                <Form.Item name="detection" label="探测度(D)" rules={[{ required: true }]} initialValue={5}>
                  <InputNumber min={1} max={10} />
                </Form.Item>
              </Space>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}
