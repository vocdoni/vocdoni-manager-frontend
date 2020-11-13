import React, { Component, ReactNode } from 'react'
import { EntityMetadata, ProcessMetadata } from 'dvote-js'

import If from '../if'
import { Avatar } from 'antd'

type Props = {
    process?: ProcessMetadata,
    entity?: EntityMetadata,
}

export default class HeaderImage extends Component<Props, undefined> {
    render() : ReactNode {
        const { process, entity } = this.props
        let headerImage = null,
            entityImage = null,
            headerAlt = null,
            entityAlt = null
        if (process?.details?.headerImage?.length) {
            headerImage = process.details.headerImage
            headerAlt = `${process.details.title.default} header image`
        }
        if (entity?.media?.avatar?.length) {
            entityImage = entity.media.avatar
            entityAlt = `${entity.name.default} avatar`
        }

        return (
            <If condition={headerImage}>
                <img className='header-image' src={headerImage} alt={headerAlt} />
                <If condition={entityImage}>
                    <div className='entity-avatar'>
                        <Avatar icon={<img src={entityImage} alt={entityAlt} />} size={150} />
                    </div>
                </If>
            </If>
        )
    }
}
