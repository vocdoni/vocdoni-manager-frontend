import Link from "next/link"
import { Menu } from "antd"
import { getNetworkState } from "../lib/network"
import { getEntityId } from "dvote-js/dist/api/entity"
import { useContext } from "react"
import AppContext from "./app-context"

type ISelected = "profile" | "entity-edit" | "feed" | "new-post" | "processes-active" | "processes-ended" | "new-vote" | "processes-details"

const SideMenu = (props: { selected: ISelected, entityId: string }) => {
  const context = useContext(AppContext)
  const { entityId, selected } = props;

  const { readOnly } = getNetworkState()
  const address = context.web3Wallet.getAddress()
  let hideEditControls = readOnly || !address
  if(!hideEditControls) {
    const ownEntityId = getEntityId(address)
    hideEditControls = entityId != ownEntityId
  }

  return <div id="page-menu">
    <Menu mode="inline" defaultSelectedKeys={[selected]} style={{ width: 200 }}>
      <Menu.Item key="profile">
        <Link href={"/entities#/" + entityId}>
          <a>Profile</a>
        </Link>
      </Menu.Item>
      {!hideEditControls && 
        <Menu.Item key="entity-edit">
          <Link href={"/entities/edit#/" + entityId}>
            <a>Edit profile</a>
          </Link>
        </Menu.Item>
      }
      <Menu.Item key="feed">
        <Link href={"/posts#/" + entityId}>
          <a>News feed</a>
        </Link>
      </Menu.Item>
      {!hideEditControls && 
        <Menu.Item key="new-post">
          <Link href={"/posts/new"}>
            <a>Create post</a>
          </Link>
        </Menu.Item>
      }
      <Menu.Item key="processes-active">
        <Link href={"/processes/active#/" + entityId}>
          <a>Active votes</a>
        </Link>
      </Menu.Item>
      <Menu.Item key="processes-ended">
        <Link href={"/processes/ended#/" + entityId}>
          <a>Ended votes</a>
        </Link>
      </Menu.Item>
      {!hideEditControls && 
        <Menu.Item key="new-vote">
          <Link href={"/processes/new"}>
            <a>Create vote</a>
          </Link>
        </Menu.Item>
      }
    </Menu>
  </div>
}

export default SideMenu
