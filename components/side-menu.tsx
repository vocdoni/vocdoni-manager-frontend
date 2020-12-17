import React from 'react'
import Link from 'next/link'
import { Menu } from 'antd'
import { TeamOutlined, SettingOutlined, BookOutlined, CommentOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useContext } from 'react'

import AppContext from './app-context'

const SideMenu = () : JSX.Element => {
    const context = useContext(AppContext)
    const entityId = context.entityId
    const selectedKeys = context.menuSelected
    const isReadOnly = context.isReadOnly

    return <Menu mode='inline' selectedKeys={[selectedKeys]} defaultOpenKeys={['entity', 'census']} style={{ height: '100%', borderRight: 0 }}>
        <Menu.Item key='profile' disabled={context.menuDisabled} icon={<InfoCircleOutlined />}>
            <Link href={'/entities#/' + entityId}>
                <a>Details</a>
            </Link>
        </Menu.Item>
        <Menu.SubMenu title='News' key='news' icon={<BookOutlined />} disabled={context.menuDisabled}>
            <Menu.Item key='feed' disabled={context.menuDisabled}>
                <Link href={'/posts#/' + entityId}>
                    <a>Feed</a>
                </Link>
            </Menu.Item>
            {
                !isReadOnly &&
                <Menu.Item key='new-post' disabled={context.menuDisabled}>
                    <Link href={'/posts/new'}>
                        <a>Create post</a>
                    </Link>
                </Menu.Item>
            }
        </Menu.SubMenu>
        <Menu.Item key='processes' disabled={context.menuDisabled} icon={<CommentOutlined />}>
            <Link href={`/processes/list#/${entityId}`}>
                <a>Participation</a>
            </Link>
        </Menu.Item>
        {
            !isReadOnly &&
            <Menu.SubMenu title='Users Management' key='census' icon={<TeamOutlined />} disabled={context.menuDisabled}>
                <Menu.Item key='members-import' disabled={context.menuDisabled}>
                    <Link href={'/members/import#/' + entityId}><a>Import Members</a></Link>
                </Menu.Item>
                <Menu.Item key='members' disabled={context.menuDisabled}>
                    <Link href={'/members#/' + entityId}><a>Members</a></Link>
                </Menu.Item>
                <Menu.Item key='census' disabled={context.menuDisabled}>
                    <Link href={'/census#/' + entityId}><a>Censuses</a></Link>
                </Menu.Item>
            </Menu.SubMenu>
        }
        {
            !isReadOnly &&
            <Menu.SubMenu title='Settings' key='settings' icon={<SettingOutlined />} disabled={context.menuDisabled}>
                <Menu.Item key='account-edit' disabled={context.menuDisabled}>
                    <Link href={'/account/edit#/' + entityId}>
                        <a>Account</a>
                    </Link>
                </Menu.Item>
            </Menu.SubMenu>
        }
    </Menu>
}

export default SideMenu
