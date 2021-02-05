import React, { Component } from 'react'


export default class Footer extends Component {
    render() : React.ReactNode {
        return (
            <footer className='poweredby'>
                <a href='https://vocdoni.io' target='_blank' rel='noreferrer'>
                    Powered by Vocdoni
                    <img src='/media/logo_square_white.png' alt='Vocdoni logo' />
                </a>
                <p>
                    Version&nbsp;
                    <a
                        target='_blank'
                        rel='noreferrer'
                        href={`https://github.com/vocdoni/vocdoni-manager-frontend/commit/${process.env.COMMIT_SHA}`}
                    >
                        {process.env.COMMIT_SHA}
                    </a>
                </p>
            </footer>
        )
    }
}
