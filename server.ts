import express = require('express');
let app = express();
import httpImport = require('http');
let http = new httpImport.Server(app);
import socketsImport = require('socket.io');
let sockets = socketsImport(http);
import fileSystem = require('fs');

import { ServerGames, User } from './ServerGames/ServerGames';
import { TopDownEngine } from "./TopDownEngine/NodeJS/Engine";

app.get('/sockets/', (req, res) => {
    res.sendFile('/node_modules/socket.io-client/dist/socket.io.js', { root: __dirname });
});

app.use('/components', express.static('Components-ES6'));

app.use('/images', express.static('images'));

app.get('/', (req, res) => {
    res.redirect('./TemplateClient/TemplateClient.html');
    //res.sendFile('/index.html', { root: __dirname });
});
app.use('/LoginProvider', express.static('LoginProvider'));

app.use('/TopDownEngine', express.static('TopDownEngine'));

app.use('/ClientProviders', express.static('ClientProviders'));

app.use('/ChatHost', express.static('ChatHost'));


app.use('/components', express.static('Components-ES6'));

app.use('/images', express.static('images'));

app.get('/', (req, res) => {
    res.redirect('./TemplateClient/TemplateClient.html');
    // res.sendFile('/index.html', { root: __dirname });
});

app.use('/TemplateClient', express.static('TemplateClient'));

let portNumber = 3000;

http.listen(portNumber, () => {
    console.log(`listening on *:${portNumber}`); 
});

// ServerGames is where users connect to a socket, and thier game data is managed
let gameServer = new ServerGames.ServerGames(sockets);

class FeatureClickerGame extends ServerGames.ServerGame {

    scene = new TopDownEngine.Scene();

    constructor(gameData: any, renderCallback: (...param: any[]) => any) {
        super(gameData, renderCallback);
    }

    gameData: any;
    renderCallback: any;
    gameDataPath: string = '';
    localGameDataPath: string = '';
    start() {
        super.start();
        
        // Temp code
        this.scene.features = [];
        for (let i=0; i<10; i++) {
            let newFeature = new TopDownEngine.BasicFeature(Math.random()*1000 + 200, Math.random()*500 + 200, 5, 5);
            this.scene.registerFeature(newFeature);
        }
        console.log(`Clicker: Registered ${this.scene.features.length} features!`);
    }
    join(user: User) {
        if (super.join(user)) {
            user.theSocket.on('ready', () => {
                console.log(`Clicker: ${ user.username } joined!`);
                if (user.theSocket) {
                    // User indicates ready to go!
                    user.theSocket.on('request-feature', (d: { rx: number, ry: number, sx: number, sy: number }) => {
                        console.log(`Clicker: Feature requested from ${ user.username }`);
                        this.addFeature(d.rx, d.ry, d.sx, d.sy);
                    });
                    let features = (this.scene.export()).features;
                    console.log(`Clicker: Exporting ${features.length} of ${this.scene.features.length} features!`)
                    
                    user.theSocket.emit('joined', { features: features });

                    this.renderCallback(`SERVER: ${ user.username} has joined.`);
                }
            });
            return true;
        }
        return false;
    }
    admin(user: User) {
        return this.join(user);
    }
    drop(user: User) {
        return super.drop(user);
    }
    end() {
        
    }
    export() {
        return {};
    }

    addFeature(addX: number, addY: number, sizeX: number, sizeY: number) {
        let newFeature = new TopDownEngine.BasicFeature(addX, addY, sizeX, sizeY);
        this.scene.registerFeature(newFeature);
        this.broadcastNewFeature(newFeature);
    }

    broadcastNewFeature(feature: TopDownEngine.BasicFeature) {
        let sent = 0;
        // For every user, send out add-feature!
        for (let i = 0; i < this.currentUserIds.length; i++) {
            let user = this.usersData[this.currentUserIds[i]].user;
            if (user.theSocket) {
                user.theSocket.emit('add-feature', { rx: feature.pos.x, ry: feature.pos.y, sx: feature.size.x, sy: feature.size.y });
                sent++;
            }
            else {
                // We dont have a handle on the user's socket?
                this.drop(user);
            }
        }
        console.log(`Clicker: Broadcast to ${sent} users!`);
    };
}

let clickerGame = gameServer.newGame(FeatureClickerGame, {}, (messageString: string) => {
    //Render callback here

    if (messageString.indexOf('SERVER:') >= 0) {
        gameServer.chatServer.broadcast({ text: messageString, channel: 'lobby', userId: 1 });
        console.log(`DEV: Sent SERVER message`);
    }
    else {
        console.log(messageString);
    }
});

clickerGame.start();

gameServer.start();