import React from 'react'
import Head from 'next/head'
import App from 'next/app'
import AppContext from '../components/app-context'
import MainLayout from "../components/layout"
import GeneralError from '../components/error'
import { IAppContext } from "../components/app-context"
// import { } from "../lib/types"
// import { isServer } from '../lib/util'

import "../styles/index.css"
import 'antd/lib/message/style/index.css'

type Props = {
    // injectedArray: any[],
}

class MainApp extends App<Props> {
    // static async getInitialProps(appContext) {
    //     // calls page's `getInitialProps` and fills `appProps.pageProps`
    //     const appProps = await App.getInitialProps(appContext)
    //
    //     // Fetch data and provide it on the first render
    //     const injectedArray = []
    //
    //     return { injectedArray, ...appProps }
    // }

    componentDidMount() {
        // Force a reload to provide the locally-stored cart data
        // instead of the one initially loaded
        // setTimeout(() => this.cartRefresh(), 10)
    }

    onGatewayError(type: "private" | "public") {
        // TODO: reconnect or shift
    }

    componentDidCatch(error: Error, _errorInfo: any/*ErrorInfo*/) {
        console.error(error)
        return <GeneralError />
    }

    render() {
        const { Component, pageProps } = this.props

        // Get data from getInitialProps and provide it as the global context to children
        // const { injectedArray } = this.props

        const injectedGlobalContext: IAppContext = {
            onGatewayError: this.onGatewayError
        }

        // Does the current component want its own layout?
        const Layout = (Component as any).Layout || MainLayout
        return <AppContext.Provider value={injectedGlobalContext}>
            <Head>
                <title>Vocdoni</title>
            </Head>
            <Layout>
                {<Component {...pageProps} /> as any}
            </Layout>
        </AppContext.Provider>
    }
}

export default MainApp
