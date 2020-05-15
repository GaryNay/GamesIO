/// <reference path="./LoginProvider.ts"/>
/// <reference path="./mobaIO_Admin.ts"/>

import express = require('express');
let app = express();
import httpImport = require('http');
let http = new httpImport.Server(app);
import socketsImport = require('socket.io');
let sockets = socketsImport(http);
import fileSystem = require('fs');

import { ServerGames } from './ServerGames';
import { User } from './ServerGames';
import { ServerMobaIO_Game } from './mobaIO_server';
import { MobaIO_Base } from './mobaIO_base_module';

app.get('/sockets/', (req, res) => {
    res.sendFile('/node_modules/socket.io-client/dist/socket.io.js', { root: __dirname });
});
app.get('/loginProvider/', (req, res) => {
    res.sendFile('/LoginProvider.js', { root: __dirname });
});
app.get('/serverGames/', (req, res) => {
    res.sendFile('/ServerGames.js', { root: __dirname });
});
app.get('/mobaAdmin/', (req, res) => {
    res.sendFile('/mobaIO_admin.js', { root: __dirname });
});
app.get('/mobaComponents/', (req, res) => {
    res.sendFile('/mobaIO_components.js', { root: __dirname });
});
app.get('/mobaBase/', (req, res) => {
    res.sendFile('/mobaIO_base_module.js', { root: __dirname });
});
app.get('/mobaClient/', (req, res) => {
    res.sendFile('/mobaIO_client.js', { root: __dirname });
});
app.get('/mobaJson/', (req, res) => {
    res.json(JSON.parse(fileSystem.readFileSync(ServerMobaIO_Game.LocalGameDataPath, 'utf8')));
});
app.get('/TRPGJson/', (req, res) => {
    if (mobaGame) {
        let exported = mobaGame.export();
        res.json(exported);
    }
    else {
        res.status(500).send('Game not running!');
    }
});

app.use('/images', express.static('images'));

app.get('/', (req, res) => {
    res.sendFile('/index.html', { root: __dirname });
});
app.get('/mobaIO/', (req, res) => {
    res.sendFile('/mobaIO.html', { root: __dirname });
});
app.get('/mobaIOAdmin/', (req, res) => {
    res.sendFile('/mobaIO_admin.html', { root: __dirname });
});

let portNumber = 3000;

http.listen(portNumber, () => {
    console.log(`listening on *:${portNumber}`); 
});

let userList = [
    {
        username: `admin`,
        password: 'password',
        userID: 1,
        admin: true,
        guest: false,
        active: false,
        theSocket: null
    }
] as User[];

// ServerGames is where users connect to a socket, and thier game data is managed
let gameServer = new ServerGames(sockets, userList);

let mobaGame = gameServer.newGame<ServerMobaIO_Game>(JSON.parse(fileSystem.readFileSync(ServerMobaIO_Game.LocalGameDataPath, 'utf8')), ServerMobaIO_Game);

mobaGame.worldParam = JSON.parse(fileSystem.readFileSync('./TRPG.json', 'utf8'));
mobaGame.gameWorldDataPath = '/TRPGJson';

mobaGame.start(() => {
    // setInterval(() => {
    //     console.log(mobaGame.gameFrames);
    //     // console.log(`World luminance: ${mobaGameWorld.luminance}`);
    //     // console.log(`Sun illumination: ${sun.illumination}, frameCounter: ${sun.frameCounter}, dayTimeAdjust: ${sun.dayTimeAdjust}`);
    // }, 5000);

    // let mobaGameWorld = mobaGame.worlds[0];
    // let spawnInterface = {
    //         name: 'Bowser Monster',
    //         size: { x: 76, y: 76 },
    //         sizeD: 45,
    //         moveSpeed: 1 / 1.5 + 2,
    //         turnSpeed: 18,
    //         attack: new MobaIO_Base.Skill({
    //                     range: 10 * 1,
    //                     cooldown: 50,
    //                     attack: new MobaIO_Base.Attack({
    //                         rules: [
    //                             new MobaIO_Base.AttackRule({
    //                                 bonusHpPercentDamages: { melee: 4, ability: 0 }
    //                             })
    //                         ],
    //                         damages: { melee: 30, ability: 0 }
    //                     })
    //         }),
    //         defense: new MobaIO_Base.Defense({
    //             rules: [
    //                 new MobaIO_Base.DefenseRule({ percentDamages: { melee: -50, ability: -90 } })
    //             ]
    //         }),
    //         drawablesName: 'bowser',
    //         scale: 1.5,
    //         constructorKey: 'Minion'
    //     } as MobaIO_Base.IMinion;
    // let spawnPoint = new MobaIO_Base.Coord(mobaGameWorld.spawnPoint);
    // setInterval(() => {
    //     let scale = Math.random() * .5 + .2
    //     spawnPoint = MobaIO_Base.Coord.randomTranslate(mobaGameWorld.spawnPoint, 1500);
    //     spawnInterface.mapPos = { x: spawnPoint.x, y: spawnPoint.y };
    //     spawnInterface.moveSpeed = 1 / (scale * 1.5) + 2;
    //     spawnInterface.scale = scale;

    //     mobaGameWorld.addNewUnit(spawnInterface);
    // }, 10000);
});