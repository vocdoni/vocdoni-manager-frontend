import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
// import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const EntityNewPage = props => {
    // Get the global context props we might use
    const { onGatewayError } = useContext(AppContext)

    return <EntityNew onGatewayError={onGatewayError} />
}

type State = {
    id?: string
    // TODO:
}

// Stateful component
class EntityNew extends Component<IAppContext, State> {
    state: State = {}

    componentDidMount() {
        this.setState({ id: location.hash })
    }

    render() {
        return <div id="entity-new">
            <p>Entity New</p>
            <pre>{this.state.id}</pre>
        </div>
    }
}


// // Using a custom layout
// EntityNewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default EntityNewPage
