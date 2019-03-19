import * as React from 'react'
import { Layout } from 'antd'

const { Header, Content } = Layout

type Props = {
}

const MainLayout: React.FunctionComponent<Props> = ({ children }) => (
    <div>
        <style jsx global>{`
            body {
                background: #f0f2f5;
                margin: 0;
            }
            #main-layout {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            #main-header {
                width: 100%;
                background-color: #233f54;
            }
            #main-header h2 {
                color: white;
            }
            #main-section {
                // flex: 1;
                padding: 50px;
                width: 850px;
                max-width: 1000px;
                min-height: 500px;
            }
        `}</style>

        <Layout id="main-layout">
            <Header id="main-header">
                <div className="logo" />
                <h2>Vocdoni</h2>
            </Header>
            <Content id="main-section">
                {children}
            </Content>
        </Layout>

    </div>
)

export default MainLayout