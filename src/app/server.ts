import * as express from 'express';
import * as cors from 'cors';
import * as vscode from 'vscode';
import * as bodyParser from 'body-parser';
import { DebugSession } from 'vscode';

export default class AppServer {
    port = 9695;
    app = express();

    socketPort = 9696;
    io = require('socket.io')(this.socketPort);

    debugSessions: any[] = [];
    debugConfigurations: any[] = [];

    emitRequestDebugConfigurations() {
        this.io.emit('request-debug-configurations');
    }

    emitAddDebugConfiguration(workspaceFolder: string, debugConfiguration: string) {
        this.io.emit('add-debug-configuration', workspaceFolder, debugConfiguration);
    }

    emitRemoveDebugConfiguration(workspaceFolder: string, debugConfigurationName: string) {
        this.io.emit('remove-debug-configuration', workspaceFolder, debugConfigurationName);
    }

    emitRestartSession(debugSession: any) {
        this.io.emit('restart', debugSession._id);
    }

    emitStartSession(debugConfigurationName: any) {
        this.io.emit('start', debugConfigurationName);
    }

    emitStopSession(debugSession: any) {
        this.io.emit('stop', debugSession._id);
    }

    constructor() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));

        this.app.use((req, res, next) => {
            res.header('Content-Type', 'application/json');
            next();
        });

        this.app.use((err: any, req: any, res: any, next: Function) => {
            console.error(err.stack)
            res.status(500).send('Something broke!')
        })

        this.app.get('/', (req: any, res: any) => {
            res.send(JSON.stringify(this.debugSessions));
        });

        this.app.get('/d', (req: any, res: any) => {
            res.sendStatus(200);
        });

        this.app.get('/debug-configurations', (req: any, res: any) => {
            this.debugConfigurations = [];

            setTimeout(() => res.send(JSON.stringify(this.debugConfigurations)), 3000);
        });

        this.app.delete('/debug-configurations/:workspaceFolder/:debugConfigurationName', (req: any, res: any) => {
            if (typeof req.params.debugConfigurationName === 'undefined' ||
                typeof req.params.workspaceFolder === 'undefined') {
                res.sendStatus(400);
                return;
            }

            let { workspaceFolder, debugConfigurationName } = req.params;

            this.emitRemoveDebugConfiguration(workspaceFolder, debugConfigurationName);
            res.sendStatus(200);
        });

        this.app.post('/debug-configurations', (req: any, res: any) => {
            let { workspaceFolder, debugConfiguration } = req.body;

            if (typeof workspaceFolder !== 'string' || typeof debugConfiguration !== 'object') {
                res.sendStatus(500);
                return;
            }

            this.emitAddDebugConfiguration(workspaceFolder, debugConfiguration);

            res.sendStatus(200);
        });

        this.app.get('/restart/:id', (req: any, res: any) => {
            if (typeof req.params.id === 'undefined' || req.params.id === 'all') {
                this.debugSessions.forEach(this.emitRestartSession);
            } else {
                let debugSession = this.debugSessions.filter((debugSession) => debugSession._id === req.params.id);
                this.emitRestartSession(debugSession);
            }
            res.sendStatus(200);
        });

        this.app.get('/start/:id', (req: any, res: any) => {
            if (typeof req.params.id === 'undefined' || req.params.id === 'all') {
                this.debugSessions.forEach(this.emitStartSession);
            } else {
                let debugSession = this.debugSessions.filter((debugSession) => debugSession._id === req.params.id);
                this.emitStartSession(debugSession);
            }
            res.sendStatus(200);
        });

        this.app.get('/stop/:id', (req: any, res: any) => {
            if (typeof req.params.id === 'undefined' || req.params.id === 'all') {
                this.debugSessions.forEach(this.emitStopSession);
            } else {
                let debugSession = this.debugSessions.filter((debugSession) => debugSession._id === req.params.id);
                this.emitStopSession(debugSession);
            }
            res.sendStatus(200);
        });

        this.app.listen(this.port, () => console.log(`VSCode Debug API AppServer listening on port ${this.port}!`));

        this.io.on('connection', (socket: any) => {
            console.log('a user connected');

            socket.on('channel', (command: string, debugSession: any) => {
                if (command === 'push') {
                    this.debugSessions.push(debugSession);
                    console.log('pushed', debugSession);
                    console.log(this.debugSessions);
                }

                if (command === 'remove') {
                    this.debugSessions = this.debugSessions.filter((_debugSession: any) => {
                        return _debugSession._id !== debugSession._id;
                    });
                    console.log('removed', debugSession);
                    console.log(this.debugSessions);
                }
            });

            socket.on('emit-debug-configurations', (debugConfigurations: any[]) => {
                this.debugConfigurations = this.debugConfigurations.concat(debugConfigurations);
            });
        });
    }
}
