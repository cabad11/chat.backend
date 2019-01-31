let { Server } =require('http');
let Io = require('socket.io');

/**
 * Start sockets observing.
 * @param {Server} server - The instance of the node Server.
 */
const runSockets = (server) => {
    const io = Io.listen(server);
    let channels = {};
    let sockets = {};

    console.log('sockets are running ......');

    function sendMessage(socket, room, message,name) {
        let stringDate = new Date().toLocaleString('ru', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric'
        });
        let msg = {
            name,
            date: stringDate,
            text: message
        }
        socket.broadcast.to(room).emit('message', msg);
    }

    io.sockets.on('connection', (socket) => {
        socket.channels = {};
        sockets[socket.id] = socket;

        function removePeer(socket) {
            for (var channel in socket.channels) {
                delete socket.channels[channel];
                delete channels[channel][socket.id];
                // Remove user from video chat
                socket.broadcast.to(channel).emit('removePeer', {'peerId': socket.id});
                // Remove user from text chat
                socket.broadcast.to(channel).emit('removeUser', {name: socket.name});
            }
            delete sockets[socket.id];
        }

        socket.on('initUser', (name) => {
            socket.name = name.name;
            socket.on('addRoom',(config)=> {
                socket.leaveAll();
                socket.join(String(config.room));

                let room = config.room;

                if (room in socket.channels) {
                    return;
                }

                if (!(room in channels)) {
                    channels[room] = {};
                }
                let names = []
                for (id in channels[room]) {
                    socket.emit('addPeer', {'peerId': id, 'shouldCreateOffer': true});
                    names.push(channels[room][id].name)
                }
                // Add user for video chat
                socket.broadcast.to(room).emit('addPeer', {'peerId': socket.id, 'shouldCreateOffer': false});
                // Add user for text chat
                socket.broadcast.to(room).emit('addUser', {name: socket.name});
                socket.emit('addUser', {name: names});

                channels[room][socket.id] = socket;
                socket.channels[room] = room;
            });

            socket.on('relayICECandidate', function(config) {
                let peerId = config.peerId;
                let iceCandidate = config.iceCandidate;

                if (peerId in sockets) {
                    sockets[peerId].emit('iceCandidate', {'peerId': socket.id, 'iceCandidate': iceCandidate});
                }
            });

            socket.on('relaySessionDescription', function(config) {
                let peerId = config.peerId;
                let sessionDescription = config.sessionDescription;

                if (peerId in sockets) {
                    sockets[peerId].emit('sessionDescription', {'peerId': socket.id, 'sessionDescription': sessionDescription});
                }
            });

            socket.on('disconnect', function () {
                removePeer(socket);
            });

            // When person leave room
            socket.on('changeRoom',()=>{
                removePeer(socket);
                socket.channels = {};
                sockets[socket.id] = socket;
            });

            // When person send message
            socket.on('text', (msg) => {
                sendMessage(socket, String(msg.room),msg.text,name.name);
            })
        });
    });
};

module.exports = runSockets;
