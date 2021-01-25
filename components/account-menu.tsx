import React, { useContext } from "react"
import AppContext from "./app-context"
import Link from "next/link"
// import { Button, Row, Col, } from "antd"
import Icon from "@ant-design/icons"
// import Avatar from "antd/lib/avatar/avatar"

const UserMenu = () => {
    const context = useContext(AppContext)
    const hasWallet = context.web3Wallet.hasWallet()

    if (!context.isWriteEnabled) {
        return null
    }

    return <>
        {!hasWallet &&
            // <Link href={'/'}><a className="sign-in-link">Sign in</a></Link>
            <div>
                <Link href={'/'}>
                    <Icon component={() => (<img src="/media/logo_white.png" style={{ marginRight: "1px" }} />)} />
                </Link>
            </div>

            // <link rel="icon" type="image/png" href="/media/logo.png" style={{ width:"18%", height:"27%"}} />
            // <Link href={'/'}><a className="logo"><img src="/media/logo.png" width="18%" height="27%" /></a></Link>
            // <Link href='' icon='/media/logo.png' class="logo"></Link>
            // <Avatar src='/media/logo.png' size='small'></Avatar>
            // <link rel="icon" type="image/png" href="/media/logo.png" />
        }

        {hasWallet &&
            <>
                {/* <UserOutlined style={{ marginLeft: "10px" }} />
                <span className="md-hide">Ready</span> */}
                {/* <Link href={'/'}><a className="logo"><img src="/media/logo.png"/></a></Link> */}
                {/* <Icon component={() => (<img  width="18%" height="27%" src="/media/logo.png"  style={{ marginRight: "1px"}} />) } /> */}
                <div>
                    <Icon component={() => (<img src="/media/logo_white.png" style={{ marginRight: "1px" }} />)} />
                </div>
            </>
        }
    </>
}

export default UserMenu
