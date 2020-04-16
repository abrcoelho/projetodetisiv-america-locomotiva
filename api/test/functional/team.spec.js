'use strict'

const { test, trait } = use('Test/Suite')('Team')

trait('Test/ApiClient')
trait('DatabaseTransactions')
trait('Auth/Client')

const Database = use('Database')
const UserRole = use('App/Models/UserRole')

const UserModel = require('../../app/Models/User')

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use('Factory')

/** @type {typeof import('../../app/Models/Team')} */
const Team = use('App/Models/Team')

/** @type {typeof import('../../app/Models/User')} */
const User = use('App/Models/User')

/** @type {typeof import('../../app/Models/Group')} */
const Group = use('App/Models/Group')

test('cadastro de times', async ({ assert, client }) => {
  const login = await Factory.model('App/Models/User').create()

  const data = await Factory.model('App/Models/Team').make()

  const response = await client
    .post('api/v1/team')
    .send({
      name: data.name,
      description: data.description,
    })
    .loginVia(login)
    .end()

  const team = await Database.from('teams').where({
    name: data.name,
    description: data.description,
  })

  response.assertStatus(201)
  assert.exists(team)
})

test('detalhe do time', async ({ assert, client }) => {
  const login = await Factory.model('App/Models/User').create()

  const user = await Factory.model('App/Models/User').create()
  const team = await Factory.model('App/Models/Team').create()
  const group = await Factory.model('App/Models/Group').create()
  const role = await Factory.model('App/Models/Role').create()

  const userRole = await UserRole.create({
    team_id: team.id,
    user_id: user.id,
    group_id: group.id,
    role_id: role.id,
  })

  const response = await client.get(`api/v1/team/${team.id}`).loginVia(login).end()

  const expected = {
    ...team.toJSON(),
    members: [{
      ...userRole.toJSON(),
      role: role.toJSON(),
      user: user.toJSON()
    }],
  }

  response.assertStatus(200)
  assert.deepInclude(response.body, expected)
})

test('listagem de times', async ({ assert, client }) => {
  const login = await Factory.model('App/Models/User').create()

  await Factory.model('App/Models/Team').createMany(5)

  const response = await client.get('api/v1/team/').loginVia(login).end()

  const { body } = response
  const [team] = body

  response.assertStatus(200)
  assert.equal(5, body.length)
  assert.exists(team.members)
})

test('edicao de times', async ({ assert, client }) => {
  const login = await Factory.model('App/Models/User').create()

  const team = await Factory.model('App/Models/Team').create()
  const newData = {
    name: 'novo nome',
    description: 'nova descricao',
  }

  const response = await client
    .put(`/api/v1/team/${team.id}`)
    .send(newData)
    .loginVia(login)
    .end()

  await team.reload()

  response.assertStatus(200)
  assert.deepInclude(team.toJSON(), newData)
})

test('desativacao de times', async ({ assert, client }) => {
  const login = await Factory.model('App/Models/User').create()

  const team = await Factory.model('App/Models/Team').create()

  const response = await client.delete(`/api/v1/team/${team.id}`).loginVia(login).end()

  const teamVerify = await Team.find(team.id)

  response.assertStatus(200)
  assert.equal(teamVerify.active, false)
})

test('associacao usuario a um time', async ({ assert, client }) => {
  const login = await Factory.model('App/Models/User').create()

  const team = await Factory.model('App/Models/Team').create()
  const user = await Factory.model('App/Models/User').create()
  const group = await Factory.model('App/Models/Group').create()
  const role = await Factory.model('App/Models/Role').create()

  const response = await client
    .post(`/api/v1/team/${team.id}/member/${user.id}`)
    .send({
      group_id: group.id,
      role_id: role.id,
    })
    .loginVia(login)
    .end()

  // atualizando para pegar o usuário adicionado
  await team.loadMany({
    members: (builder) => {
      builder.with('user')
      builder.with('role')
      builder.with('group')
    }
  })

  const { members } = team.toJSON()
  const [member] = members

  response.assertStatus(200)
  assert.deepInclude(member.user, user.toJSON())
  assert.deepInclude(member.role, role.toJSON())
  assert.deepInclude(member.group, group.toJSON())
})

test('remover usuario de um time', async ({ assert, client }) => {
  const login = await Factory.model('App/Models/User').create()

  const team = await Factory.model('App/Models/Team').create()
  const user = await Factory.model('App/Models/User').create()
  const group = await Factory.model('App/Models/Group').create()
  const role = await Factory.model('App/Models/Role').create()

  await UserRole.create({
    user_id: user.id,
    team_id: team.id,
    group_id: group.id,
    role_id: role.id,
  })

  const response = await client
    .delete(`/api/v1/team/${team.id}/member/${user.id}`)
    .loginVia(login)
    .end()

  await team.load('members')

  const actual = team.toJSON()

  response.assertStatus(200)
  assert.equal(actual.members.length, 0)
})
