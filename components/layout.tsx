import { Component } from 'react'
// import Link from "next/link"
// import AppContext from './app-context'

type Props = {
    children: Element[]
}
type State = {}

export default class MainLayout extends Component<Props, State> {
    state = {}

    render() {
        return <div className="layout">
            {this.props.children}
        </div>
    }
}
