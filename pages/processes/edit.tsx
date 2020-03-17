import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
// import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const ProcessEditPage = props => {
  // Get the global context props we might use
  const { onGatewayError } = useContext(AppContext)

  return <ProcessEdit onGatewayError={onGatewayError} />
}

type State = {
  // TODO:
}

// Stateful component
class ProcessEdit extends Component<IAppContext, State> {
  state = {}

  render() {
    return <div id="process-edit">
      <p>Process Edit</p>
    </div>
  }
}


// // Using a custom layout
// ProcessEditPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default ProcessEditPage
