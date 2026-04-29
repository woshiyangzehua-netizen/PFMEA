import { useEffect } from 'react'
import { Form, Input, DatePicker, Button, message } from 'antd'
import dayjs from 'dayjs'
import client from '../../../api/client'

interface Props {
  pfmea: any
  onRefresh: () => void
}

export default function Step1Planning({ pfmea, onRefresh }: Props) {
  const [form] = Form.useForm()

  useEffect(() => {
    if (pfmea) {
      form.setFieldsValue({
        ...pfmea,
        startDate: pfmea.startDate ? dayjs(pfmea.startDate) : null,
        targetCompletionDate: pfmea.targetCompletionDate ? dayjs(pfmea.targetCompletionDate) : null,
      })
    }
  }, [pfmea, form])

  const handleSave = async (values: any) => {
    try {
      await client.patch(`/pfmea/${pfmea.id}`, {
        ...values,
        startDate: values.startDate?.toISOString(),
        targetCompletionDate: values.targetCompletionDate?.toISOString(),
      })
      message.success('保存成功')
      onRefresh()
    } catch (e) {
      message.error('保存失败')
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleSave}>
      <Form.Item name="documentNumber" label="文件编号" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="partNumber" label="零件号" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name="analysisBoundary" label="分析边界">
        <Input placeholder="如来料检验、工序加工、成品检验、仓储物流等" />
      </Form.Item>
      <Form.Item name="startDate" label="开始日期">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="targetCompletionDate" label="目标完成日期">
        <DatePicker style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">保存</Button>
      </Form.Item>
    </Form>
  )
}
