import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
// import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const EntityNewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)

    return <EntityNew {...context} />
}

type State = {
    id?: string
    // TODO:
}

// Stateful component
class EntityNew extends Component<IAppContext, State> {
    state: State = {}

    componentDidMount() {
        this.props.setTitle("Create entity")
    }

    render() {
        return <div id="entity-new">
            <p>Entity New</p>
        </div>
    }
}


// // Using a custom layout
// EntityNewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default EntityNewPage
