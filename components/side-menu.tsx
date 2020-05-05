import React from "react"
import Link from "next/link"
import { Menu } from "antd"
import { HomeOutlined } from '@ant-design/icons';
import { getNetworkState } from "../lib/network"
import { getEntityId } from "dvote-js/dist/api/entity"
import { useContext } from "react"
import AppContext from "./app-context"

const SideMenu = () => {
  const context = useContext(AppContext)
  const entityId = context.entityId;
  const processId = context.processId;
  const selectedKeys = context.menuSelected;

  const { readOnly } = getNetworkState()
  const address = context.web3Wallet.getAddress()
  let hideEditControls = readOnly || !address
  if(!hideEditControls) {
    const ownEntityId = getEntityId(address)
    hideEditControls = entityId != ownEntityId
  }

  return <Menu mode="inline" defaultSelectedKeys={[selectedKeys]} defaultOpenKeys={['entity', 'census']} style={{ height: '100%', borderRight: 0 }}>
    <Menu.SubMenu title="Entity" key="entity" icon={<HomeOutlined />} disabled={context.menuDisabled}>
      <Menu.Item key="profile" disabled={context.menuDisabled}>
        <Link href={"/entities#/" + entityId}>
          <a>Profile</a>
        </Link>
      </Menu.Item>
      {!hideEditControls && 
        <Menu.Item key="entity-edit" disabled={context.menuDisabled}>
          <Link href={"/entities/edit#/" + entityId}>
            <a>Edit profile</a>
          </Link>
        </Menu.Item>
      }
      <Menu.Item key="feed" disabled={context.menuDisabled}>
        <Link href={"/posts#/" + entityId}>
          <a>News feed</a>
        </Link>
      </Menu.Item>
      {!hideEditControls && 
        <Menu.Item key="new-post" disabled={context.menuDisabled}>
          <Link href={"/posts/new"}>
            <a>Create post</a>
          </Link>
        </Menu.Item>
      }
      <Menu.Item key="processes-active" disabled={context.menuDisabled}>
        <Link href={"/processes/active#/" + entityId}>
          <a>Active votes</a>
        </Link>
      </Menu.Item>
      <Menu.Item key="processes-ended" disabled={context.menuDisabled}>
        <Link href={"/processes/ended#/" + entityId}>
          <a>Ended votes</a>
        </Link>
      </Menu.Item>
      {!hideEditControls && 
        <Menu.Item key="new-vote" disabled={context.menuDisabled}>
          <Link href={"/processes/new"}>
            <a>Create vote</a>
          </Link>
        </Menu.Item>
      }
    </Menu.SubMenu>
    {/* <Menu.SubMenu title="Census" key="census">
      <Menu.Item key="census1"><Link href={"/"}><a>Census 1</a></Link></Menu.Item>
      <Menu.Item key="census2"><Link href={"/"}><a>Census 2</a></Link></Menu.Item>
      <Menu.Item key="census3"><Link href={"/"}><a>Census 3</a></Link></Menu.Item>
    </Menu.SubMenu> */}
  </Menu>
}

export default SideMenu
