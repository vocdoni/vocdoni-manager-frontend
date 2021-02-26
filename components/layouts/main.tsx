import Link from 'next/link'
import { useContext } from 'react'
import { Layout as ALayout, Button, Row, Col } from 'antd'
import { MenuOutlined } from '@ant-design/icons'

import SideMenu from '../side-menu'
import AppContext from '../app-context'

type Props = {
    children: any,
    title?: string
}

export default function MainLayout({ children, ...props }: Props) {
    let title = props && props.title
    const context = useContext(AppContext)
    if (!title) {
        if (context) title = context.title
    }

    return <ALayout id='layout'>
        <ALayout.Header className='top-bar'>
            <Row className='h-full'>
                { context.menuVisible &&
                    <Col xs={2} md={0}>
                        <Button ghost={true} onClick={() => context.setMenuCollapsed(!context.menuCollapsed)}>
                            <MenuOutlined />
                        </Button>
                    </Col>
                }
                <Col xs={12} md={14}>
                    <h1 id='logo' className='text-white'>{title || ' '}</h1>
                </Col>
                <Col xs={10} style={{textAlign: 'right'}}>
                    <div className='vocdoni-logo'>
                        Vocdoni
                        <img src='/media/logo.png' />
                    </div>
                </Col>
            </Row>
        </ALayout.Header>
        <ALayout>
            {context.menuVisible && <ALayout.Sider style={{minHeight: '100vh'}}
                width={220}
                collapsible
                breakpoint='md'
                collapsedWidth={0}
                trigger={null}
                collapsed={context.menuCollapsed}
                onCollapse={() => context.setMenuCollapsed(!context.menuCollapsed)}
            >
                <SideMenu />
            </ALayout.Sider>}
            <ALayout.Content className='content'>
                {children}
            </ALayout.Content>
        </ALayout>
    </ALayout>
}
