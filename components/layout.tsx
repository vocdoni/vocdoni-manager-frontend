import * as React from 'react'
import { Layout, Menu, Icon, Row, Col } from 'antd'

const { Header, Sider } = Layout
const { SubMenu } = Menu

type Props = {
    currentAddress: string,
    entityName: string,
    menuClicked: (key: string) => void
}

const MainLayout: React.FunctionComponent<Props> = ({ children, entityName, currentAddress, menuClicked }) => (
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
            #main-header #account-status {
                text-align: right;
                color: #ddd;
            }

            .ant-layout-header > h1, .ant-layout-header > h2, .ant-layout-header > h3 {
                color: white;
            }
        `}</style>

        <Layout id="main-layout">
            <Header id="main-header" className="header">
                <Row>
                    <Col span={12}>
                        <h2>Vocdoni Entity Manager</h2>
                    </Col>
                    <Col span={12}>
                        {
                            entityName ? <div id="account-status">{entityName}</div> :
                                currentAddress ? <div id="account-status">(No entity)</div> :
                                    <div id="account-status">(No address)</div>
                        }
                    </Col>
                </Row>
            </Header>
            <Layout>
                <Sider width={200} style={{ background: '#fff' }}>
                    <Menu
                        mode="inline"
                        defaultSelectedKeys={['1']}
                        defaultOpenKeys={['entity']}
                        style={{ height: '100%', borderRight: 0 }}
                    >
                        <Menu.Item key="home" onClick={() => menuClicked && menuClicked("Home")}>
                            <Icon type="home" />
                            <span>General</span>
                        </Menu.Item>
                        <SubMenu key="entity" title={<span><Icon type="form" />Entity</span>}>
                            <Menu.Item key="metadata" onClick={() => menuClicked && menuClicked("EntityMeta")}>
                                Metadata
                            </Menu.Item>
                        </SubMenu>
                        <SubMenu key="content" title={<span><Icon type="file-text" />Content</span>}>
                            <Menu.Item key="diary" onClick={() => menuClicked && menuClicked("OfficialDiary")}>
                                Official Diary
                            </Menu.Item>
                            <Menu.Item key="processes" onClick={() => menuClicked && menuClicked("VotingProcesses")}>
                                Voting processes
                            </Menu.Item>
                        </SubMenu>
                        <SubMenu key="settings" title={<span><Icon type="setting" />Infrastructure</span>}>
                            <Menu.Item key="census-service" onClick={() => menuClicked && menuClicked("CensusService")}>
                                Census Service
                            </Menu.Item>
                            <Menu.Item key="relays" onClick={() => menuClicked && menuClicked("Relays")}>
                                Relays
                            </Menu.Item>
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