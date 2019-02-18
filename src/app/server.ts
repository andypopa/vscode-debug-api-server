import * as express from 'express';
import * as vscode from 'vscode';
import { DebugSession } from 'vscode';

export default class AppServer {
    port = 9695;
    app = express();

    socketPort = 9696;
    io = require('socket.io')(this.socketPort);

    debugSessions: any[] = [];

    emitRestartSession(debugSession:any) {
        this.io.emit('restart', debugSession._id);
    }

    constructor() {
        this.app.get('/', (req: any, res: any) => {
            const promises = this.debugSessions.map(this.emitRestartSession.bind(this));
            Promise.all(promises)
                .then(res.send)
                .catch(res.send);
        });

        this.app.listen(this.port, () => console.log(`VSCode Debug API AppServer listening on port ${this.port}!`));

        this.io.on('connection', (socket:any) => {
            console.log('a user connected');

            socket.on('channel', (command:string, debugSession:any) => {
                if (command === 'push') {
                    this.debugSessions.push(debugSession);
                    console.log('pushed', debugSession);
                    console.log(this.debugSessions);
                }

                if (command === 'remove') {
                    this.debugSessions = this.debugSessions.filter((_debugSession:any) => {
                        return _debugSession._id !== debugSession._id;
                    });
                    console.log('removed', debugSession);
                    console.log(this.debugSessions);
                }
              });
        });
    }
}
