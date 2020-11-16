import { any } from 'prop-types'
import React, { Component, ReactNode } from 'react'

import { sanitizeHtml } from '../lib/util'

let Editor: any // = await import('react-draft-wysiwyg')
let EditorState, convertToRaw
let draftToHtml: any // = await import('draftjs-to-html')

type Props = {
    toolbar?: string,
    onContentChanged?: (contents: string) => void,
}

type State = {
    editorState: string,
    toolbar: any,
}

export default class HTMLEditor extends Component<Props, State> {
    state = {
        editorState: null,
        toolbar: null,
    }

    toolbars = {
        full: {
            options: ['inline', 'blockType', 'list', 'link', 'emoji', 'image', 'remove', 'history'],
            inline: {
                options: ['bold', 'italic', 'underline'],
                inDropdown: true,
            },
            link: {
                defaultTargetOption: '_blank',
            },
            blockType: { inDropdown: true },
            list: { inDropdown: true },
            image: { inDropdown: true },
        },
        reduced: {
            options: ['inline', 'list', 'link', 'emoji', 'image', 'remove', 'history'],
            inline: {
                options: ['bold', 'italic', 'underline'],
                // inDropdown: true,
            },
            link: {
                defaultTargetOption: '_blank',
            },
            list: { inDropdown: true },
            image: { inDropdown: true },
        },
        simple: {
            options: ['inline', 'link'],
            inline: {
                options: ['bold', 'italic', 'underline'],
            },
            link: {
                defaultTargetOption: '_blank',
            },
        },
    }

    async componentDidMount() : Promise<void> {
        Editor = (await import('react-draft-wysiwyg')).Editor
        const DraftJS = await import('draft-js')
        EditorState = DraftJS.EditorState
        // ContentState = DraftJS.ContentState
        convertToRaw = DraftJS.convertToRaw
        draftToHtml = (await import('draftjs-to-html')).default
        // htmlToDraft = (await import('html-to-draftjs')).default

        let toolbar = this.props.toolbar
        if (!toolbar?.length) {
            toolbar = 'full'
        }

        this.setState({
            editorState: EditorState.createEmpty(),
            toolbar: this.toolbars[toolbar],
        })
    }

    editorContentChanged(editorState: any) : void {
        this.setState({editorState})

        if (this.props.onContentChanged) {
            this.props.onContentChanged(
                sanitizeHtml(draftToHtml(convertToRaw(editorState.getCurrentContent())))
            )
        }
    }

    render() : ReactNode{
        if (!Editor || !this.state.editorState) {
            return null
        }

        return <Editor
            editorState={this.state.editorState}
            toolbarClassName='toolbar-box'
            toolbar={this.state.toolbar}
            wrapperClassName='wrapper-box'
            editorClassName='editor-box'
            onEditorStateChange={state => this.editorContentChanged(state)}
        />
    }
}
