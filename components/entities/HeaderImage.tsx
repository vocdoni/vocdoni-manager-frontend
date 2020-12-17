import { Avatar } from 'antd'
import React, { Component, ReactNode } from 'react'

import { ImageType } from '../image'
import ImageAndUploader from '../image-and-uploader'

interface HeaderImageProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    alt?: string,
    type?: ImageType,
    onHeaderConfirm?: (image: string) => void,
    onAvatarConfirm?: (image: string) => void,
    uploaderActive?: boolean,
    header?: string,
    avatar?: string,
    name?:string,
}

export default class HeaderImage extends Component<HeaderImageProps, undefined> {
    onHeaderConfirm(image: string) : void {
        if (this.props.onHeaderConfirm) {
            this.props.onHeaderConfirm(image)
        }
    }

    onAvatarConfirm(image: string) : void {
        if (this.props.onAvatarConfirm) {
            this.props.onAvatarConfirm(image)
        }
    }

    render() : ReactNode {
        const { header, avatar, name } = this.props

        return (
            <header>
                <div className='header-image'>
                    <ImageAndUploader
                        className='header-image'
                        src={header}
                        alt={`${name} header image`}
                        onConfirm={this.onHeaderConfirm.bind(this)}
                        uploaderActive={this.props.uploaderActive}
                    />
                </div>
                <div className='entity-avatar'>
                    <Avatar
                        size={100}
                        icon={(
                            <ImageAndUploader
                                src={avatar}
                                alt={`${name} avatar`}
                                onConfirm={this.onAvatarConfirm.bind(this)}
                                uploaderActive={this.props.uploaderActive}
                            />
                        )}
                    />
                </div>
            </header>
        )
    }
}
