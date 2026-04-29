import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Tabs, Button, message, Spin, Radio } from 'antd'
import { UnorderedListOutlined, TableOutlined } from '@ant-design/icons'
import client from '../../api/client'
import Step1Planning from './components/Step1Planning'
import Step2Structure from './components/Step2Structure'
import Step3Function from './components/Step3Function'
import Step4Failure from './components/Step4Failure'
import Step5Risk from './components/Step5Risk'
import Step6Optimization from './components/Step6Optimization'
import Step7Documentation from './components/Step7Documentation'
import PfmeaTableView from './components/PfmeaTableView'

export default function PfmeaEditor() {
  const { id } = useParams<{ id: string }>()
  const [pfmea, setPfmea] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('1')
  const [viewMode, setViewMode] = useState<'wizard' | 'table'>('wizard')

  const fetchData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await client.get(`/pfmea/${id}`)
      setPfmea(res.data)
      setActiveTab(String(res.data.pfmea.currentStep || 1))
    } catch (e) {
      message.error('加载PFMEA失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const updateStep = async (step: number) => {
    if (!id) return
    try {
      await client.patch(`/pfmea/${id}`, { currentStep: step })
      setPfmea((prev: any) => ({ ...prev, pfmea: { ...prev.pfmea, currentStep: step } }))
    } catch (e) {
      message.error('更新步骤失败')
    }
  }

  const tabItems = [
    { key: '1', label: '① 策划与准备', children: <Step1Planning pfmea={pfmea?.pfmea} onRefresh={fetchData} /> },
    { key: '2', label: '② 结构分析', children: <Step2Structure pfmea={pfmea} onRefresh={fetchData} /> },
    { key: '3', label: '③ 功能分析', children: <Step3Function pfmea={pfmea} onRefresh={fetchData} /> },
    { key: '4', label: '④ 失效分析', children: <Step4Failure pfmea={pfmea} onRefresh={fetchData} /> },
    { key: '5', label: '⑤ 风险分析', children: <Step5Risk pfmea={pfmea} onRefresh={fetchData} /> },
    { key: '6', label: '⑥ 优化', children: <Step6Optimization pfmea={pfmea} onRefresh={fetchData} /> },
    { key: '7', label: '⑦ 结果文件化', children: <Step7Documentation pfmea={pfmea} onRefresh={fetchData} /> },
  ]

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />
  if (!pfmea) return <div>未找到PFMEA</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>PFMEA 编辑器 — {pfmea.pfmea.documentNumber}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="wizard">
              <UnorderedListOutlined /> 向导视图
            </Radio.Button>
            <Radio.Button value="table">
              <TableOutlined /> 表格视图
            </Radio.Button>
          </Radio.Group>
          {viewMode === 'wizard' && (
            <>
              <span style={{ marginRight: 16 }}>步骤: {activeTab}/7</span>
              {Number(activeTab) > 1 && (
                <Button onClick={() => { setActiveTab(String(Number(activeTab) - 1)); updateStep(Number(activeTab) - 1) }}>
                  上一步
                </Button>
              )}
              {Number(activeTab) < 7 && (
                <Button type="primary" onClick={() => { setActiveTab(String(Number(activeTab) + 1)); updateStep(Number(activeTab) + 1) }}>
                  下一步
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {viewMode === 'wizard' ? (
        <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k)} items={tabItems} />
      ) : (
        <PfmeaTableView pfmeaId={id!} />
      )}
    </div>
  )
}
