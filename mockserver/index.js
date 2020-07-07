const PORT = 8000;

const listMembers = require('./data/listMembers.json');
const getMember = require('./data/getMember.json');
const deleteMember = require('./data/deleteMember.json');
const updateMember = require('./data/updateMember.json');
const importMembers = require('./data/importMembers.json');
const listTargets = require('./data/listTargets.json');
const getTarget = require('./data/getTarget.json');
const deleteTarget = require('./data/deleteTarget.json');
const updateTarget = require('./data/updateTarget.json');
const exportTarget = require('./data/exportTarget.json');
const listTags = require('./data/listTags.json');
const listCensus = require('./data/listCensus.json');
const getCensus = require('./data/getCensus.json');
const deleteCensus = require('./data/deleteCensus.json');

const responseMocks = { 
  listMembers,
  getMember,
  deleteMember,
  updateMember,
  importMembers,
  listTargets,
  getTarget,
  deleteTarget,
  updateTarget,
  exportTarget,
  listTags,
  listCensus,
  getCensus,
  deleteCensus,
};

const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: PORT });

console.log('WebSocket Server listening on port', PORT);

wss.on('connection', socket => {
  socket.on('message', data => {
    data = JSON.parse(data);

    console.log('Got Request: ', JSON.stringify(data, null, 4));

    const response = { 
      id: data.id,
      response: { 
        ok: true, 
        request: data.id,
        ...responseMocks[data.request.method]
      },
    }
    socket.send(JSON.stringify(response))

    console.log('Replying with:', JSON.stringify(response, null, 4));
  })
})
