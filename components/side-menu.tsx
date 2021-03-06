import React from 'react'
import Link from 'next/link'
import { Menu } from 'antd'
import { TeamOutlined, SettingOutlined, BookOutlined, CommentOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useContext } from 'react'

import AppContext from './app-context'
import i18n from '../i18n'

const SideMenu = () : JSX.Element => {
    const context = useContext(AppContext)
    const address = context.address
    const selectedKeys = context.menuSelected
    const isReadOnly = context.isReadOnly

    return <Menu mode='inline' selectedKeys={[selectedKeys]} defaultOpenKeys={['entity', 'census']} style={{ height: '100%', borderRight: 0 }}>
        <Menu.Item key='profile' disabled={context.menuDisabled} icon={<InfoCircleOutlined />}>
            <Link href={'/entities#/' + address}>
                <a>{i18n.t('menu.details')}</a>
            </Link>
        </Menu.Item>
        <Menu.SubMenu title={i18n.t('menu.communication')} key='news' icon={<BookOutlined />} disabled={context.menuDisabled}>
            <Menu.Item key='feed' disabled={context.menuDisabled}>
                <Link href={'/posts#/' + address}>
                    <a>{i18n.t('menu.news')}</a>
                </Link>
            </Menu.Item>
            {
                !isReadOnly &&
                <Menu.Item key='new-post' disabled={context.menuDisabled}>
                    <Link href={'/posts/new'}>
                        <a>{i18n.t('menu.create_post')}</a>
                    </Link>
                </Menu.Item>
            }
        </Menu.SubMenu>
        <Menu.Item key='processes' disabled={context.menuDisabled} icon={<CommentOutlined />}>
            <Link href={`/processes/list#/${address}`}>
                <a>{i18n.t('menu.participation')}</a>
            </Link>
        </Menu.Item>
        {
            !isReadOnly &&
            <Menu.SubMenu title={i18n.t('menu.users')} key='census' icon={<TeamOutlined />} disabled={context.menuDisabled}>
                <Menu.Item key='members-import' disabled={context.menuDisabled}>
                    <Link href={'/members/import#/' + address}><a>{i18n.t('menu.import')}</a></Link>
                </Menu.Item>
                <Menu.Item key='members' disabled={context.menuDisabled}>
                    <Link href={'/members#/' + address}><a>{i18n.t('menu.members')}</a></Link>
                </Menu.Item>
                <Menu.Item key='census' disabled={context.menuDisabled}>
                    <Link href={'/census#/' + address}><a>{i18n.t('menu.censuses')}</a></Link>
                </Menu.Item>
            </Menu.SubMenu>
        }
        {
            !isReadOnly &&
            <Menu.SubMenu title={i18n.t('menu.settings')} key='settings' icon={<SettingOutlined />} disabled={context.menuDisabled}>
                <Menu.Item key='account-edit' disabled={context.menuDisabled}>
                    <Link href={'/account/edit#/' + address}>
                        <a>{i18n.t('account.title')}</a>
                    </Link>
                </Menu.Item>
            </Menu.SubMenu>
        }
    </Menu>
}

export default SideMenu
