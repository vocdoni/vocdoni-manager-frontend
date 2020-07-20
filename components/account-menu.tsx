import React, { useContext, useState, useEffect } from "react"
import AppContext from "./app-context"
import Link from "next/link"
import { Button, Row, Col } from "antd"
import { UserOutlined } from "@ant-design/icons"

const UserMenu = () => {
    const context = useContext(AppContext)
    const hasWallet = context.web3Wallet.hasWallet()
    let address = ''

    if (hasWallet) {
        address = context.web3Wallet.getAddress()
    }

    const [enoughEther, setEnoughEther] = useState(false)
    useEffect(() => {
        hasEnoughEther()
    })

    const hasEnoughEther = async () => {
        if (context.web3Wallet.hasWallet() && context.web3Wallet.getProvider()) {
            const balance = await context.web3Wallet.getBalance()
            setEnoughEther((+balance / Math.pow(10, 16) > 1))
        }
    }

    if (!context.isWriteReady) {
        return null
    }

    return <>
        {!hasWallet &&
            <Link href={'/'}><a className="sign-in-link">Sign in</a></Link>
        }

        {hasWallet &&
            <>
                <UserOutlined style={{ marginLeft: "10px" }} />
                <span className="md-hide">Ready</span>
            </>
        }
    </>
}

export default UserMenu
