import * as React from 'react'
import { Layout, Menu, Icon } from 'antd'

const { Header, Sider } = Layout
const { SubMenu } = Menu

type Props = {
}

const MainLayout: React.FunctionComponent<Props> = ({ children }) => (
    <div>
        <style jsx global>{`
            body {
                background: #f0f2f5;
                margin: 0;
            }
            #main-layout {

            }
            #main-header h2 {
                color: white;
            }
            #main-header.header {
                background-color: #25658a;
            }
        `}</style>

        <Layout id="main-layout">
            <Header id="main-header" className="header">
                <h2>Vocdoni Entity Manager</h2>
            </Header>
            <Layout>
                <Sider width={200} style={{ background: '#fff' }}>
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={['1']}
                        defaultOpenKeys={['entity']}
                        style={{ height: '100%', borderRight: 0 }}
                    >
                        <SubMenu key="entity" title={<span><Icon type="user" />Entity</span>}>
                            <Menu.Item key="metadata">Metadata</Menu.Item>
                        </SubMenu>
                        <SubMenu key="sub2" title={<span><Icon type="laptop" />Content</span>}>
                            <Menu.Item key="diary">Official Diary</Menu.Item>
                            <Menu.Item key="processes">Voting processes</Menu.Item>
                        </SubMenu>
                        <SubMenu key="sub3" title={<span><Icon type="notification" />Infrastructure</span>}>
                            <Menu.Item key="census-service">Census Service</Menu.Item>
                            <Menu.Item key="relays">Relays</Menu.Item>
                        </SubMenu>
                    </Menu>
                </Sider>
                <Layout style={{ padding: '24px' }}>
                    {children}
                </Layout>
            </Layout>
        </Layout>

    </div>
)

export default MainLayout