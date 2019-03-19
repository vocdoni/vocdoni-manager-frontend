import {
    Row,
    Col,
    Card,
    Form,
    Select,
    InputNumber,
    DatePicker,
    Switch,
    Slider,
    Button
} from 'antd'
import Layout from "../components/layout"

const FormItem = Form.Item
const Option = Select.Option

// BACKEND URL:
// const URL = process.env.BACKEND_URL_PREFIX + "/dummy"

export default () => (
    <Layout>
        <style jsx>{`
        #content {}
        #content > div {
            margin: auto;
        }
        `}</style>
        <Row id="content">
            <Col xs={{ span: 24 }} sm={{ span: 18, offset: 3 }} md={{ span: 12, offset: 6 }}>
                <Card title="Form title" extra={<a href="#">More</a>} >
                    <Form layout='horizontal'>
                        <FormItem
                            label='Input Number'
                            labelCol={{ span: 8 }}
                            wrapperCol={{ span: 8 }}
                        >
                            <InputNumber
                                size='large'
                                min={1}
                                max={10}
                                style={{ width: 100 }}
                                defaultValue={3}
                                name='inputNumber'
                            />{' '}
                            <a href='#'>Link</a>
                        </FormItem>

                        <FormItem label='Switch' labelCol={{ span: 8 }} wrapperCol={{ span: 8 }}>
                            <Switch defaultChecked name='switch' />
                        </FormItem>

                        <FormItem label='Slider' labelCol={{ span: 8 }} wrapperCol={{ span: 8 }}>
                            <Slider defaultValue={70} />
                        </FormItem>

                        <FormItem label='Select' labelCol={{ span: 8 }} wrapperCol={{ span: 8 }}>
                            <Select
                                size='large'
                                defaultValue='lucy'
                                style={{ width: 192 }}
                                name='select'
                            >
                                <Option value='jack'>jack</Option>
                                <Option value='lucy'>lucy</Option>
                                <Option value='disabled' disabled>disabled</Option>
                                <Option value='yiminghe'>yiminghe</Option>
                            </Select>
                        </FormItem>

                        <FormItem
                            label='DatePicker'
                            labelCol={{ span: 8 }}
                            wrapperCol={{ span: 8 }}
                        >
                            <DatePicker name='startDate' />
                        </FormItem>
                        <FormItem style={{ marginTop: 48 }} wrapperCol={{ span: 8, offset: 8 }}>
                            <Button size='large'>Cancel</Button>
                            <Button size='large' style={{ marginLeft: 8 }} type='primary' htmlType='submit'>Confirm</Button>
                        </FormItem>
                    </Form>
                </Card>
            </Col>
        </Row>
    </Layout >
)
