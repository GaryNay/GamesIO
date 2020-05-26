import { LoginProvider } from './LoginProvider';
import { Admin, User, IServerGame, Socket } from './ServerGames';
import { MobaIO_Base } from './mobaIO_base_module';
declare function io(options?: { forceNew?: boolean, path?: string, autoConnect?: boolean }): Socket;

class MobaAdmin extends Admin {
    currentWorld: MobaIO_Base.World;

    processServerPackage(serverData: MobaIO_Base.ControlData[]) {
        for (let eachData of serverData) {
            this.currentWorld.controls.messages[eachData.message].controlFn(eachData, this.currentWorld);
        }
    }
}

class Monitor {
    public sourceDocument: Document;
    public containerDiv: HTMLDivElement;
    public monitoringGame: AdminGame;
    public monitoredFeatures: MonitoredFeature[] = [];

    constructor(params) {
        this.sourceDocument = params.sourceDocument || document;
        this.containerDiv = params.containerDiv ||
            (() => {
                this.containerDiv = this.sourceDocument.createElement('div');
                this.sourceDocument.appendChild(this.containerDiv);
                return this.containerDiv;
            })();
    }

    pollGame () {

    }

    monitorGame(gameToMonitor?: AdminGame) {
        this.monitoringGame = gameToMonitor || this.monitoringGame;
        if (!this.monitoringGame) {
            return;
        }
        // Monitor each feature
        this.monitoredFeatures = <any>this.monitoringGame.worlds[0].features;
    }

    monitor(featureToMonitor: MobaIO_Base.MapFeature) {
        // Assign a div
    }
}
class MonitoredFeature {
    lastPolledFrame?: number;
    constructor(public monitoredFeature: MobaIO_Base.MapFeature) {
    }   
}

class AdminGame extends MobaIO_Base.MobaIO_Game {
    public admin: MobaAdmin;
    public clientSocket: Socket;
    constructor(params: MobaIO_Base.IMobaIO_Game & { socket: Socket }) {
        super(params);

        this.timerFn = () => {
            return performance.now();
        }
        this.clientSocket = params.socket;
    }
    createWorlds () {
        this.worlds = Object.keys(this.worldParam).map((eachWorldName) => {
            let eachWorldJson = this.worldParam[eachWorldName];

            let newWorld = new MobaIO_Base.World({
                featureFactory: this.featureFactory
            });

            newWorld.create(eachWorldJson);

            return newWorld;
        });
    }
    async start(thenFn?: (self: AdminGame) => any) {

        this.gameTimer = this.timerFn();

        if (!this.worlds || this.worlds.length === 0) {
            if (this.worldParam) {
                this.createWorlds();
            }
            else return Promise.resolve(thenFn ? thenFn(this) : null);

        }
        let self = this;
        setTimeout(() => { self.gameFrame(self); }, 0);

        return Promise.resolve(thenFn ? thenFn(self) : null);
    }
    async bind (data: { playerName: string, userID: number, worldName: string, trackingId: number, gameWorldDataPath: string }, self = this) {
        return new Promise(async (resolve) => { 
            self.admin = new MobaAdmin();
            self.admin.currentWorld = self.worlds[0];
            self.admin.theSocket = self.clientSocket;

            self.worldParam = await (async () => {
                return new Promise<MobaIO_Base.IGameWorldData>((resolve) => {
                    let req = new XMLHttpRequest();
                    req.open('GET', data.gameWorldDataPath);
                    req.onreadystatechange = async () => {
                        if (req.readyState == 4) {
                            req.onreadystatechange = null;
                            if (req.status == 200) {
                                console.log('Loaded World Json');
                                resolve(JSON.parse(req.response));
                            }
                        }
                    };
                    req.send();
                }); 
            })();
            console.log('Creating Worlds');
            
            self.createWorlds();
            self.start();

            self.admin.theSocket.on('status', (serverStatus: MobaIO_Base.MobaIO_GameStatus) => {
                let oldFrames = self.gameFrames;
                self.gameFrames = serverStatus.gameFrames;
                for (let eachWorld of self.worlds) {
                    eachWorld.sun = eachWorld.sun.applyStatus(serverStatus.worldStatus.sunStatus, eachWorld.sun);
                    eachWorld.setLuminance(eachWorld.sun.illumination);
                    eachWorld.gameFrames = self.gameFrames;
                }

            });

            self.clientSocket.emit('started', {});
            resolve();
        });
    }
}

var adminMonitor: Monitor;

function entry() {
    let adminGame: AdminGame;
    //let adminMonitor: Monitor;
    let loginProvider = new LoginProvider(
        document.getElementById('loginModalDiv') as HTMLDivElement,
        document.getElementById('usernameInput') as HTMLInputElement,
        document.getElementById('passwordInput') as HTMLInputElement,
        document.getElementById('loginButton') as HTMLButtonElement,
        io({ autoConnect: false }) as any
    );
    let modalDiv = document.getElementById('loginModalElement') as HTMLDivElement;
    loginProvider.onConnected(() => {
        modalDiv.style.display = 'block';
    });
    loginProvider.onLogin(async (user, gameInfo: MobaIO_Base.MobaIO_GameData) => {
        modalDiv.style.display = 'none';

        adminGame = new AdminGame({ 
            gameData: gameInfo,
            socket: loginProvider.loginSocket
        });

        adminMonitor = new Monitor({
            sourceDocument: document,
            containerDiv: document.getElementById('containerDiv')
        });

        loginProvider.loginSocket.on('joined', async (joinData) => {
            // Join local emulation
            await adminGame.bind(joinData, adminGame);
            adminMonitor.monitorGame(adminGame);
        });

        loginProvider.loginSocket.emit('ready', {});
    });
};
