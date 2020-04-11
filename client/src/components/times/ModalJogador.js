import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, Modal, message, Typography, Form, Select } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { connect } from 'react-redux'

import * as timeStore from '../../store/ducks/times'

const { Title } = Typography
const { Option } = Select;

class ModalJogador extends Component {
  constructor(props) {
    super(props)
    this.state = {
      modalVisible: false,
      loading: false,
      user: false
    }
  }

  hideModal = () => this.setState({ modalVisible: false })

  showModal = () => this.setState({ modalVisible: true })

  handleUserChange = (user) => this.setState({ user: user })

  addJogador = async () => {
    const { time, updateTime } = this.props
    const { user_id } = this.state
    const group_id = '' //fetchGroup() // Todo: recuperar grupo jogador

    this.setState({ loading: true })

    try {
      await updateTime(time.id, user_id, group_id) // Todo: chamar função no back que adiciona usuários em um time

      this.setState({ loading: false, modalVisible: false })
      message.success('Jogador inserido no time com sucesso!')

    } catch (error) {
      message.error('Ocorreu um erro ao tentar inserir o jogador no time.')
    }
  }

  render() {
    const { loading, modalVisible } = this.state
    const { users } = this.props

    return (
      <>
        <div className="flex mb-sm">
            <Button className="success"  htmlType="submit" icon={<PlusOutlined />} onClick={this.showModal} ></Button>
            <Title level={4} className="ml-md mb-0" style={{paddingTop: "3px" }} >Jogadores</Title>

            <Modal
            title="Jogador"
            onCancel={this.hideModal}
            onOk={this.addJogador}
            cancelButtonProps={{ disabled: loading }}
            confirmLoading={loading}
            closable={!loading}
            keyboard={!loading}
            maskClosable={!loading}
            visible={modalVisible}
            >
              <Form layout="inline" >
                <Form.Item style={{width: "15pc", marginBottom: "5px"}}>
                  <Select placeholder="Usuário" onChange={this.handleUserChange} >
                      {users && users.length ? users.map(user => {
                        return <Option value={user.id} key={user.id} >{user.nomeCompleto}</Option>
                      }) : null}
                  </Select>
                </Form.Item>
              </Form>
            </Modal>
        </div>
      </>
    )
  }
}

ModalJogador.propTypes = {
  time: PropTypes.shape({
    id: PropTypes.number.isRequired,
    nome: PropTypes.string,
    descricao: PropTypes.string,
  }).isRequired,
  user: PropTypes.shape({
    id: PropTypes.number,
    apelido: PropTypes.string,
    nomeCompleto: PropTypes.string,
  }),
  updateTime: PropTypes.func.isRequired,
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
    })
  ).isRequired,
}

const mapDispatchToProps = {
  updateTime: timeStore.updateTime,
}

export default connect(null, mapDispatchToProps)(ModalJogador)