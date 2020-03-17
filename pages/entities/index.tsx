import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
// import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const EntityViewPage = props => {
  // Get the global context props we might use
  const { onGatewayError } = useContext(AppContext)

  return <EntityView onGatewayError={onGatewayError} />
}

type State = {
  id?: string
  // TODO:
}

// Stateful component
class EntityView extends Component<IAppContext, State> {
  state: State = {}

  componentDidMount() {
    this.setState({ id: location.hash })
  }

  render() {
    return <div id="entity-view">
      <p>Entity view</p>
      <pre>{this.state.id}</pre>
    </div>
  }
}


// // Using a custom layout
// EntityViewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default EntityViewPage
