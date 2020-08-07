import React from "react"
import Link from "next/link"
import { Menu } from "antd"
import { HomeOutlined, TeamOutlined, SettingOutlined, BarsOutlined, BookOutlined } from '@ant-design/icons'
import { getNetworkState } from "../lib/network"
import { getEntityId } from "dvote-js/dist/api/entity"
import { useContext } from "react"
import AppContext from "./app-context"

const SideMenu = () => {
    const context = useContext(AppContext)
    const entityId = context.entityId
    const processId = context.processId
    const selectedKeys = context.menuSelected

    const { readOnly } = getNetworkState()
    const address = context.web3Wallet.getAddress()
    let hideEditControls = readOnly || !address
    if (!hideEditControls) {
        const ownEntityId = getEntityId(address)
        hideEditControls = entityId !== ownEntityId
    }

    return <Menu mode="inline" selectedKeys={[selectedKeys]} defaultOpenKeys={['entity', 'census']} style={{ height: '100%', borderRight: 0 }}>
        <Menu.SubMenu title="Entity" key="entity" icon={<HomeOutlined />} disabled={context.menuDisabled}>
            <Menu.Item key="profile" disabled={context.menuDisabled}>
                <Link href={"/entities#/" + entityId}>
                    <a>Summary</a>
                </Link>
            </Menu.Item>
        </Menu.SubMenu>
        <Menu.SubMenu title="News" key="news" icon={<BookOutlined />} disabled={context.menuDisabled}>
            <Menu.Item key="feed" disabled={context.menuDisabled}>
                <Link href={"/posts#/" + entityId}>
                    <a>Feed</a>
                </Link>
            </Menu.Item>
            {!hideEditControls &&
        <Menu.Item key="new-post" disabled={context.menuDisabled}>
            <Link href={"/posts/new"}>
                <a>Create post</a>
            </Link>
        </Menu.Item>
            }
        </Menu.SubMenu>
        <Menu.SubMenu title="Voting Processes" key="voting" icon={<BarsOutlined />} disabled={context.menuDisabled}>
            <Menu.Item key="processes-active" disabled={context.menuDisabled}>
                <Link href={"/processes/active#/" + entityId}>
                    <a>Active</a>
                </Link>
            </Menu.Item>
            <Menu.Item key="processes-ended" disabled={context.menuDisabled}>
                <Link href={"/processes/ended#/" + entityId}>
                    <a>Ended</a>
                </Link>
            </Menu.Item>
            {!hideEditControls &&
        <Menu.Item key="new-vote" disabled={context.menuDisabled}>
            <Link href={"/processes/new"}>
                <a>Create</a>
            </Link>
        </Menu.Item>
            }
        </Menu.SubMenu>
        {
            !hideEditControls &&
            <Menu.SubMenu title="Users Management" key="census" icon={<TeamOutlined />} disabled={context.menuDisabled}>
                <Menu.Item key="members-import" disabled={context.menuDisabled}>
                    <Link href={"/members/import#/" + entityId}><a>Import Members</a></Link>
                </Menu.Item>
                <Menu.Item key="members" disabled={context.menuDisabled}>
                    <Link href={"/members#/" + entityId}><a>Members</a></Link>
                </Menu.Item>
                {/* <Menu.Item key="targets" disabled={context.menuDisabled}>
            <Link href={"/targets#/" + entityId}><a>Targets</a></Link>
        </Menu.Item> */}
                <Menu.Item key="census" disabled={context.menuDisabled}>
                    <Link href={"/census#/" + entityId}><a>Censuses</a></Link>
                </Menu.Item>
            </Menu.SubMenu>
        }
        {
            !hideEditControls &&
            <Menu.SubMenu title="Settings" key="settings" icon={<SettingOutlined />} disabled={context.menuDisabled}>
                <Menu.Item key="entity-edit" disabled={context.menuDisabled}>
                    <Link href={"/entities/edit#/" + entityId}>
                        <a>Edit profile</a>
                    </Link>
                </Menu.Item>
                <Menu.Item key="account-edit" disabled={context.menuDisabled}>
                    <Link href={"/account/edit#/" + entityId}>
                        <a>Account</a>
                    </Link>
                </Menu.Item>
            </Menu.SubMenu>
        }
    </Menu>
}

export default SideMenu
