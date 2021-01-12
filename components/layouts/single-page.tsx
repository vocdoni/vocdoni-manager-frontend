import { Col, Row } from 'antd'
import React, { Component, ReactChild, ReactNode } from 'react'

type SinglePageLayoutProps = {
    children: ReactChild,
    responsive?: any,
}

export default class SinglePageLayout extends Component<SinglePageLayoutProps, undefined> {
    render() : ReactNode {
        let resp = {
            xs: {
                span: 24,
            },
            md: {
                span: 14,
                push: 5,
            },
            xl: {
                span: 10,
                push: 7,
            },
            xxl: {
                span: 8,
                push: 8,
            }
        }

        if (this.props.responsive) {
            resp = this.props.responsive
        }

        return (
            <Row className='vote-process login'>
                <Col {...resp}>
                    {this.props.children}
                </Col>
                <footer className='poweredby'>
                    <a href='https://vocdoni.io' target='_blank' rel='noreferrer'>
                        Powered by Vocdoni
                        <img src='/media/logo_square_white.png' alt='Vocdoni logo' />
                    </a>
                </footer>
            </Row>
        )
    }
}
