import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import client from '../../../api/client'

interface Props {
  pfmea: any
  onRefresh: () => void
}

export default function Step7Documentation({ pfmea }: Props) {
  const handleExport = async () => {
    try {
      const pfmeaId = pfmea?.pfmea?.id
      const res = await client.get(`/pfmea/${pfmeaId}/export`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${pfmea?.pfmea?.documentNumber || 'PFMEA'}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (e) {
      message.error('导出失败')
    }
  }

  return (
    <div>
      <h3>结果文件化</h3>
      <p>PFMEA分析完成后，可导出为标准格式的Excel文件。</p>
      <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
        导出Excel (AIAG-VDA格式)
      </Button>
    </div>
  )
}
