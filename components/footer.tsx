import React, { Component } from 'react'
import i18n from '../i18n'

export default class Footer extends Component {
    render() : React.ReactNode {
        return (
            <footer className='poweredby'>
                <a href='https://vocdoni.io' target='_blank' rel='noreferrer'>
                    {i18n.t('powered_by')}
                    <img src='/media/logo_squared.png' alt='Vocdoni logo' />
                </a>
            </footer>
        )
    }
}
