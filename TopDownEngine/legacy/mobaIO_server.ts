import { MobaIO_Base } from './mobaIO_base_module';
import { User, IServerGame } from './ServerGames';
import { Admin, ServerGame } from './ServerGames';

export interface IWorldDataJson extends MobaIO_Base.IWorldDataJson {

}
export interface IWorld extends MobaIO_Base.IWorld {
}
export class World extends MobaIO_Base.World {
    _addAmbient;
    _addFeature;
    _addUnit;

    emitsTrackingIds: string[] = [];
    emitsByTrackingId: { [ trackingId: string ]: MobaIO_Base.ControlData[] } = {};
    
    constructor (params: IWorld) {
        super(params);
        this._addAmbient = MobaIO_Base.World.prototype.addAmbient;
        this._addFeature = MobaIO_Base.World.prototype.addFeature;
        this._addUnit = MobaIO_Base.World.prototype.addUnit;
    }

    addAmbient(ambient: MobaIO_Base.Ambient, attachTo?: MobaIO_Base.Movable): MobaIO_Base.Ambient {
        this._addAmbient(ambient, attachTo);
        //this.addEmit({ message: 's', spawnAmbientInterface: ambient.export() } as MobaIO_Base.SpawnAmbient );
        return ambient;
    }
    addFeature<T>(feature: T & MobaIO_Base.MapFeature) {
        this._addFeature(feature);
        this.addEmit({ message: 'c', createFeatureInterface: feature.export() } as MobaIO_Base.SpawnFeature );
        return feature;
    }
    addUnit<T>(unit: T & MobaIO_Base.Unit) {
        this._addUnit(unit);
        this.addEmit({ message: 's', sourceTrackingId: unit.trackingId, spawnUnitInterface: unit.export(unit) } as MobaIO_Base.SpawnUnit );
        return unit;
    }

    addEmit(emitData: MobaIO_Base.ControlData) {
        let theseEmits = this.emitsByTrackingId[`${emitData.sourceTrackingId}`];
        if (!theseEmits) {
            theseEmits = this.emitsByTrackingId[`${emitData.sourceTrackingId}`] = [];
        }
        theseEmits.push(emitData);
    }

    // This method should only be called once all emits have been added
    emitAll(thesePlayers: (Player | Admin)[]) {
        let trackingIds = Object.keys(this.emitsByTrackingId);
        if (!trackingIds.length) {
            return;
        }
        let allEmits = trackingIds.map((eachTrackingId) => {
            return this.emitsByTrackingId[eachTrackingId]
        }).reduce((emitArray, eachEmitArrayById) => {
            return emitArray.concat(eachEmitArrayById);
        }, []).filter((eachEmit) => {
            return !!(eachEmit);
        });
        if (!allEmits.length) {
            return;
        }

        for (let eachPlayer of thesePlayers) {
            eachPlayer.theSocket.emit('d', allEmits);
        }
    }
    resetEmits() {
        this.emitsByTrackingId = {};
    }
}

export interface IMobaIO_Game extends MobaIO_Base.IMobaIO_Game, IServerGame {
    gameData: MobaIO_Base.MobaIO_GameData;
    gameWorldDataPath: string;
    renderCallback?: (game: ServerMobaIO_Game) => any;
}
export class ServerMobaIO_Game extends MobaIO_Base.MobaIO_Game implements ServerGame {
    public randomTranslate = MobaIO_Base.Coord.randomTranslate;

    static playerStampNames = [ 'edgar', 'cyan', 'celes', 'bowser' ];
    public players: (Player | Admin)[] = [];
    //public admins: User[] = [];

    gameData: MobaIO_Base.MobaIO_GameData;
    static LocalGameDataPath = './mobaIO.json';
    gameDataPath = '/mobaJson';
    gameWorldDataPath: string;
    worldParam: { [ worldNames: string ]: IWorldDataJson };

    worlds: World[];

    static _gameFrame: (self: ServerMobaIO_Game, frameFn: () => any) => boolean = MobaIO_Base.MobaIO_Game.prototype.gameFrame;

    private renderCallback: (game: ServerMobaIO_Game) => any;

    constructor (paramObject: IMobaIO_Game) {
        super(paramObject);

        this.players = [];

        this.gameData = paramObject.gameData;

        this.renderCallback = paramObject.renderCallback || (() => { return; });

        this.timerFn = () => {
            var hrTime = process.hrtime();
            return (hrTime[0] * 1000000 + hrTime[1] / 1000) / 1000;
        }
    }

    createWorlds () {
        this.worlds = Object.keys(this.worldParam).map((eachWorldName) => {
            let eachWorldJson = this.worldParam[eachWorldName];

            let newWorld = new World({
                featureFactory: this.featureFactory
            });
            newWorld.create(eachWorldJson);

            return newWorld;
        });
    }

    async start(thenFn?: (gameReference: ServerMobaIO_Game) => any, self = this) {
        self.gameTimer = self.timerFn();

        if (!self.worlds || self.worlds.length === 0) {
            self.createWorlds();
        }
        setTimeout(() => {
            self.gameFrame(self);
            self.running = true;
        }, 0);

        return Promise.resolve(thenFn ? thenFn(self) : null);
    }
    async end (thenFn?: (gameReference: ServerMobaIO_Game) => any, self = this): Promise<IMobaIO_Game> {
        return new Promise<IMobaIO_Game>((resolve) => {
            self.gameFrame = () => {
                return false;
            }
            self.running = false;
            resolve({} as any);
        });
    }

    gameFrame (self: ServerMobaIO_Game): boolean {
        if ( !ServerMobaIO_Game._gameFrame(self, null) ) {
            this.renderCallback(self);

            // Extract emits from worlds
            self.worlds[0].emitAll(self.players);
            self.worlds[0].resetEmits();
            return true;
        }
        return false;
    }

    join (user: User, self = this): boolean {
        // Check to see if this user has a player already
        let joiningPlayer = (() => { 
            for (let eachPlayerIndex in self.players) {
                let eachPlayer = self.players[eachPlayerIndex];
                if (eachPlayer.userID === user.userID) {
                    eachPlayer.theSocket = user.theSocket;
                    eachPlayer = self.players[eachPlayerIndex] = eachPlayer;
                    return eachPlayer;
                }
            }
            let heroChoice = self.gameData.units[ ServerMobaIO_Game.playerStampNames[Math.floor(Math.random() * ServerMobaIO_Game.playerStampNames.length)] ];
            let newPlayer = Player.newPlayerFromUser(user, heroChoice);
            if (newPlayer.attach(self.worlds[0])) {
                self.players.push(newPlayer);
                return newPlayer
            }
            else {
                return null;
            }
        })() as Player;

        if (joiningPlayer) {
            if (!joiningPlayer.currentWorld && (joiningPlayer.trackingId && joiningPlayer.heroReference)) {
                if (!joiningPlayer.attach(self.worlds[0])) {
                    return false;
                }
            }

            joiningPlayer.theSocket.on('ready', () => {
                // Join the player's socket to it's character
                if (!joiningPlayer.activate()) {
                    joiningPlayer.theSocket.emit('mobaIOerror', {
                        errorMessage: `Couldn't join game!` 
                    });
                    console.log(`User ${user.userID}, ${user.username} failed activation.`);
                    this.drop(user);
                    return false;
                }
                let sun = joiningPlayer.currentWorld.sun;
                joiningPlayer.theSocket.on('started', () => {
                    console.log(`User ${user.userID}, ${user.username} client has started.`);
                    console.log(`World: ${joiningPlayer.currentWorld.luminance}`);
                    console.log(`Sun illumination: ${sun.illumination}, frameCounter: ${sun.frameCounter}, dayTimeAdjust: ${sun.dayTimeAdjust}`);
                    joiningPlayer.theSocket.emit('status', {
                        gameFrames: self.gameFrames,
                        worldStatus: {
                            sunStatus: sun.sunStatus()
                        }
                    } as MobaIO_Base.MobaIO_GameStatus);
                    
                    // let playerTorch = joiningPlayer.currentWorld.addNewFeature({

                    //     name: "player torch",
                    //     drawablesName: "torch",
                    //     constructorKey: "PhysicalObject",
                    //     mapPos: joiningPlayer.heroReference.mapPos,
                    //     size: { "x": 8, "y": 8 },
                    //     sizeD: 8,
                    //     mass: 0,
                    //     light: {
                    //         sizeD: 100,
                    //         center: 25,
                    //         illumination: 60
                    //     },
                    //     attachToId: joiningPlayer.trackingId
                    // } as any);

                });
                // Send the world's information with player information back to the client 
                // TRIM THE WORLD INFO and send that instead
                joiningPlayer.theSocket.emit('joined', {
                    playerName: joiningPlayer.playerName,
                    userID: joiningPlayer.userID,
                    worldName: joiningPlayer.currentWorld.name,
                    trackingId: joiningPlayer.trackingId,
                    gameWorldDataPath: self.gameWorldDataPath
                });

                console.log(`User ${user.userID}, ${user.username} has joined game. (tid: ${joiningPlayer.trackingId})`);
            });
                
            return true;
        }
        return false;
    }

    admin (user: User, self = this): boolean {
        let currentWorld = this.worlds[0];
        this.players.push(user);

        user.theSocket.on('ready', () => {
            user.theSocket.on('started', () => {
                user.theSocket.on('d', (clientData) => {
                    for (let eachData of clientData) {
                        currentWorld.controls.messages[eachData.message].controlFn(eachData, currentWorld);
                        currentWorld.addEmit(eachData);
                    }
                });
                user.theSocket.emit('status', {
                    gameFrames: self.gameFrames,
                    worldStatus: {
                        sunStatus: currentWorld.sun.sunStatus()
                    }
                } as MobaIO_Base.MobaIO_GameStatus);
                console.log(`Admin ${user.userID}, ${user.username} is moderating game.`);
            });
            user.theSocket.emit('joined', {
                userID: user.userID,
                worldName: currentWorld.name,
                gameWorldDataPath: self.gameWorldDataPath
            });
            console.log(`Admin ${user.userID}, ${user.username} has authenticated.`);
        });

        return true;
    }

    drop (user: User): boolean {
        let droppedPlayer = (() => {
            for (let eachPlayerIndex in this.players) {
                let eachPlayer = this.players[eachPlayerIndex];
                if (eachPlayer.userID === user.userID) {
                    return eachPlayer;
                }
            }
        })() as Player;
        if (!user.admin) {
            droppedPlayer.deactivate();
        }
        else {
            this.players = this.players.filter((eachPlayer) => { return eachPlayer.userID !== user.userID; });
        }
        console.log(`${ user.admin ? 'Admin' : 'User' } ${user.userID}, ${user.username} has dropped.`);
        return true;
    }
}
export class Player extends MobaIO_Base.Player {
    currentWorld: World;
    emits: MobaIO_Base.ControlData[] = [];
    theSocket?: Socket;
    constructor (param: MobaIO_Base.IPlayer) {
        super(param);
    }
    static newPlayerFromUser(user: User, heroChoice?: MobaIO_Base.IHero): Player {
        let newPlayer = new Player({
            userID: user.userID,
            playerName: `${user.username} The Neophyte`,
            trackingId: null,
            heroReference: heroChoice
        });
        newPlayer.theSocket = user.theSocket;
        return newPlayer;
    }

    activate() {
        if (!this.currentWorld) {
            this.active = false;
            return false;
        }
        // Perform the steps to tie the Unit Control to Player Input
        this.heroReference.ai.active = false;
        
        // Register the player's controls
        this.theSocket.on('d', (clientData) => {
            this.processClientPackage(clientData);
        });

        this.active = true;

        return true;
    }
    processClientPackage(clientData: MobaIO_Base.ControlData[]) {
        for (let eachData of clientData) {
            if (eachData.sourceTrackingId === this.trackingId) {
                this.currentWorld.controls.messages[eachData.message].controlFn(eachData, this.currentWorld);

                eachData.sourcePos = { x: this.heroReference.mapPos.x, y: this.heroReference.mapPos.y };
                this.currentWorld.addEmit(eachData);
                // this.theSocket.emit('d', [
                //     eachData
                // ]);
            }
            else {
                // HAXZOR~!!!
            }
        }
    }

    deactivate() {
        // Perform the steps to reinstate AI Control over Unit
        this.theSocket.removeListener('d', this.processClientPackage);
        this.active = false;
        this.heroReference.ai.active = true;
        return true;
    }

}
export interface Socket extends SocketIO.Socket {
    userID: number;
    messageCount?: number;
}

