import { Input } from 'antd'
import React, { Component, ReactNode } from 'react'

import { sanitizeHtml } from '../lib/util'

let Editor: any // = await import('react-draft-wysiwyg')
let EditorState, convertToRaw, ContentState
let draftToHtml, htmlToDraft: any // = await import('draftjs-to-html')

type Props = {
    toolbar?: string,
    onContentChanged?: (contents: string) => void,
    value?: string,
}

type State = {
    editorState: string,
    toolbar: any,
    html: string,
}

export default class HTMLEditor extends Component<Props, State> {
    state = {
        editorState: null,
        toolbar: null,
        html: null,
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
            options: ['inline', 'blockType', 'list', 'link', 'emoji', 'image', 'remove', 'history'],
            inline: {
                options: ['bold', 'italic', 'underline'],
                // inDropdown: true,
            },
            link: {
                defaultTargetOption: '_blank',
            },
            list: { inDropdown: true },
            image: { inDropdown: true },
            blockType: {inDropdown: true},
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
        ContentState = DraftJS.ContentState
        convertToRaw = DraftJS.convertToRaw
        draftToHtml = (await import('draftjs-to-html')).default
        htmlToDraft = (await import('html-to-draftjs')).default

        let state = EditorState.createEmpty()

        if (this.props.value?.length) {
            const block = htmlToDraft(this.props.value)
            const contents = ContentState.createFromBlockArray(block.contentBlocks)
            state = EditorState.createWithContent(contents)
        }

        let toolbar = this.props.toolbar
        if (!toolbar?.length) {
            toolbar = 'full'
        }

        this.setState({
            editorState: state,
            toolbar: this.toolbars[toolbar],
            html: this.props.value,
        })
    }

    editorContentChanged(editorState: any) : void {
        const html = draftToHtml(convertToRaw(editorState.getCurrentContent()))
        this.setState({
            editorState,
            html,
        })

        if (this.props.onContentChanged) {
            this.props.onContentChanged(
                sanitizeHtml(html)
            )
        }
    }

    render() : ReactNode{
        if (!Editor || !this.state.editorState) {
            return null
        }

        return (
            <Editor
                editorState={this.state.editorState}
                toolbarClassName='toolbar-box'
                toolbar={this.state.toolbar}
                wrapperClassName='wrapper-box'
                editorClassName='editor-box'
                onEditorStateChange={this.editorContentChanged.bind(this)}
            />
        )
    }
}
