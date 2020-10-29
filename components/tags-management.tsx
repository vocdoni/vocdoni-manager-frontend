import { DeleteOutlined } from '@ant-design/icons'
import { Col, message, Popconfirm, Row, Select } from 'antd'
import React, { Component } from 'react'

import { IAppContext } from './app-context'

type TagsManagementState = {
    tagsSelectorVisible: boolean,
    selectedTags: string[]
    tags: any
}

interface TagsManagementProps extends IAppContext {
    onChange?: (values: any[], options: any[], tags: any[]) => void
    onDeleted?: (tags: any[], selectedTags: any[]) => void
    selectedTags?: string[]
    selectedTagIds?: number[]
    disabled?: boolean
    onActionCall?: () => void
    onActionComplete?: () => void
}

export default class TagsManagement extends Component<TagsManagementProps, TagsManagementState>  {
    state = {
        tagsSelectorVisible: false,
        selectedTags: [],
        tags: [],
    }

    componentDidMount() : void {
        const req = {
            method: 'listTags'
        }
        if (this.props.onActionCall) {
            this.props.onActionCall()
        }
        this.props.managerBackendGateway.sendMessage(req as any, this.props.web3Wallet.getWallet())
            .then((res) => {
                if (res.ok) {
                    if (this.props.onActionComplete) {
                        this.props.onActionComplete()
                    }

                    const tags = res.tags?.length ? res.tags : []
                    this.setState({tags})


                    if (this.props.selectedTagIds?.length) {
                        const { selectedTagIds } = this.props
                        this.setState({
                            selectedTags: tags.filter((tag) => selectedTagIds.includes(tag.id))
                                .map((tag) => tag.name),
                        })
                    }
                }
            })
    }

    static getDerivedStateFromProps(nextProps: TagsManagementProps, prevState: TagsManagementState) : TagsManagementState {
        if (!nextProps.selectedTags) {
            return prevState
        }
        return {
            ...prevState,
            selectedTags: nextProps.selectedTags,
        }
    }

    onDeleteTag(tag): void {
        const { id, name } = tag
        const req = {
            method: 'deleteTag',
            tagID: id,
        }
        const wallet = this.props.web3Wallet.getWallet()

        if (this.props.onActionCall) {
            this.props.onActionCall()
        }

        this.props.managerBackendGateway.sendMessage(req as any, wallet)
            .then(() => {
                let tags = [...this.state.tags]
                let selectedTags = [...this.state.selectedTags]
                const index = selectedTags.indexOf(name)
                const tIndex = tags.findIndex((tag) => tag.id === id)

                delete selectedTags[index]
                delete tags[tIndex]

                tags = tags.filter((val) => val !== null)
                selectedTags = selectedTags.filter((val) => val !== null)

                this.setState({
                    tags,
                    selectedTags,
                }, () => {
                    if (this.props.onActionComplete) {
                        this.props.onActionComplete()
                    }
                    if (this.props.onDeleted) {
                        this.props.onDeleted(tags, selectedTags)
                    }
                })
            })
            .catch((error) => {
                message.error('There was an error removing that tag')
                console.error(error)
            })
    }

    async createTag(tagName: string) {
        const req = {
            method: 'createTag',
            tagName,
        }

        const { ok, tag } = await this.props.managerBackendGateway.sendMessage(req as any, this.props.web3Wallet.getWallet())
        if (ok && tag) {
            this.setState({tags: [...this.state.tags, tag]})

            return tag
        }

        const msg = 'There was an error creating the new tag'
        message.error(msg)
        throw new Error(msg)
    }

    async onChange(values: any[], options: any[]): Promise<void> {
        this.setState({selectedTags: values})

        // Check for new tags
        let newTag = ''
        options.forEach((option, key) => {
            if (option?.key) {
                return
            }
            newTag = values[key]
        })
        if (newTag.length) {
            const tag = await this.createTag(newTag)

            // Ensure options has the new option, so onChange callback receives all of them
            options[options.length - 1] = {
                key: String(tag.id),
                value: tag.name,
            }
        }

        if (this.props.onChange) {
            this.props.onChange(values, options, this.state.tags)
        }
    }

    render() : React.ReactNode {
        const { tags } = this.state
        const { disabled } = this.props

        return (
            <Select
                mode='tags'
                placeholder='Select &amp; create new tags'
                onChange={this.onChange.bind(this)}
                style={{width: '100%'}}
                open={this.state.tagsSelectorVisible}
                onFocus={() => this.setState({tagsSelectorVisible: true})}
                onBlur={() => this.setState({tagsSelectorVisible: false})}
                value={this.state.selectedTags}
                disabled={disabled}
            >
                {
                    tags.map((tag) => (
                        <Select.Option key={tag.id} value={tag.name}>
                            <Row>
                                <Col span={22}>
                                    {tag.name}
                                </Col>
                                <Col span={2} style={{textAlign: 'right'}} onClick={(e) => e.stopPropagation()}>
                                    <Popconfirm
                                        onConfirm={this.onDeleteTag.bind(this, tag)}
                                        title={<RemoveTitle tag={tag} />}
                                    >
                                        <DeleteOutlined />
                                    </Popconfirm>
                                </Col>
                            </Row>
                        </Select.Option>
                    ))
                }
            </Select>
        )
    }
}

const RemoveTitle = (props: any) => {
    return (
        <>
            <p>
                Are you sure you want to remove the tag "{props.tag.name}"?
            </p>
            <p>
                Note that it will be unassigned from any assigned member, but won't remove any member at all.
            </p>
        </>
    )
}
