import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import {
  HomeOutlined,
  FileTextOutlined,
  BuildOutlined,
  BookOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import PfmeaList from './modules/pfmea/PfmeaList'
import PfmeaEditor from './modules/pfmea/PfmeaEditor'
import CappDesigner from './modules/capp/CappDesigner'
import KnowledgeBase from './modules/knowledge-base/KnowledgeBase'
import ControlPlanList from './modules/control-plan/ControlPlanList'
import ControlPlanEditor from './modules/control-plan/ControlPlanEditor'

const { Header, Sider, Content } = Layout

function App() {
  const location = useLocation()

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    { key: '/pfmea', icon: <FileTextOutlined />, label: <Link to="/pfmea">PFMEA管理</Link> },
    { key: '/capp', icon: <BuildOutlined />, label: <Link to="/capp">工艺设计</Link> },
    { key: '/control-plans', icon: <FileTextOutlined />, label: <Link to="/control-plans">控制计划</Link> },
    { key: '/knowledge-base', icon: <BookOutlined />, label: <Link to="/knowledge-base">知识库</Link> },
    { key: '/settings', icon: <SettingOutlined />, label: <Link to="/settings">系统设置</Link> },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', color: '#fff' }}>
        <h2 style={{ color: '#fff', margin: 0 }}>CAPP-PFMEA</h2>
      </Header>
      <Layout>
        <Sider theme="light" width={200}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
              borderRadius: 8,
            }}
          >
            <Routes>
              <Route path="/" element={<div><h1>欢迎使用 CAPP-PFMEA 系统</h1><p>基于 AIAG-VDA 七步法的工艺设计与风险分析平台</p></div>} />
              <Route path="/pfmea" element={<PfmeaList />} />
              <Route path="/pfmea/:id" element={<PfmeaEditor />} />
              <Route path="/capp" element={<CappDesigner />} />
              <Route path="/control-plans" element={<ControlPlanList />} />
              <Route path="/control-plans/:id" element={<ControlPlanEditor />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/settings" element={<div>系统设置</div>} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  )
}

export default App
