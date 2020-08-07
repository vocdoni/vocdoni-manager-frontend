import Link from "next/link"
import AppContext from './app-context'
import { useContext } from "react"
import { Layout as ALayout, Button, Row, Col } from "antd"
import SideMenu from "./side-menu"
import AccountMenu from "./account-menu"
import { MenuOutlined } from "@ant-design/icons"


type Props = {
    children: any,
    title?: string
}

export default function Layout({ children, ...props }: Props) {
    let title = props && props.title
    const context = useContext(AppContext)
    if (!title) {
        if (context) title = context.title
    }

    return <ALayout id="layout">
        <ALayout.Header className="top-bar">
            <Row>
                { context.menuVisible &&
                    <Col xs={2} md={0}>
                        <Button ghost={true} onClick={() => context.setMenuCollapsed(!context.menuCollapsed)}>
                            <MenuOutlined />
                        </Button>
                    </Col>
                }
                <Col xs={12} md={14}>
                    <h1 style={{marginLeft:20}}><Link href="/"><a id="logo">{title || " "}</a></Link></h1>
                </Col>
                <Col xs={10} style={{textAlign: "right"}}>
                    <AccountMenu />
                </Col>
            </Row>
        </ALayout.Header>
        <ALayout>
            {context.menuVisible && <ALayout.Sider style={{height:"100vh"}}
                width={220}
                collapsible
                breakpoint="md"
                collapsedWidth={0}
                trigger={null}
                collapsed={context.menuCollapsed}
                onCollapse={() => context.setMenuCollapsed(!context.menuCollapsed)}
            >
                <SideMenu />
            </ALayout.Sider>}
            <ALayout.Content className="content">
                {children}
            </ALayout.Content>
        </ALayout>
    </ALayout>
}
