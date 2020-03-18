import { useContext, Component } from 'react'
import AppContext, { IAppContext } from '../../components/app-context'
// import Link from "next/link"
// import MainLayout from "../../components/layout"
// import { main } from "../i18n"
// import MultiLine from '../components/multi-line-text'
// import { } from '../lib/types'

// MAIN COMPONENT
const PostNewPage = props => {
    // Get the global context and pass it to our stateful component
    const context = useContext(AppContext)
  
    return <PostNew {...context} />
}

type State = {
    // TODO:
}

// Stateful component
class PostNew extends Component<IAppContext, State> {
    state = {}

    componentDidMount() {
        this.props.setTitle("Create post")
    }

    render() {
        return <div id="post-new">
            <p>Post New</p>
        </div>
    }
}


// // Using a custom layout
// PostNewPage.Layout = props => <MainLayout>
//   {props.children}
// </MainLayout>

export default PostNewPage
