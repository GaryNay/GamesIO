
import socketsImport = require('socket.io');

export interface User {
    username: string;
    password: string;
    theSocket?: Socket;
    color?: string;
    userID: number;
    active: boolean;
    guest: boolean;
    admin?: boolean;
    inGame?: boolean;
    inGameType?: string;
}

export class Admin implements User {
    username: string;
    password: string;
    theSocket?: Socket;
    color?: string;
    userID: number;
    active: boolean;
    guest: boolean;
    admin?: boolean;
    inGame?: boolean;
    inGameType?: string;
    constructor() {
    }
}

export interface Socket extends SocketIO.Socket {
    userID: number;
    messageCount?: number;
    open: ()=> void
}

export interface IServerGame {
    gameData: any;
    renderCallback?: (...param: any[]) => any;
}

export class ServerGame {
    gameDataPath: string;
    gameData: any;
    start: (...param: any[]) => any;
    join: (user: User) => boolean;
    admin: (user: User) => boolean;
    drop: (user: User) => boolean;
    end: (...param: any[]) => any;
}

export class ServerGames {
    activeGames: ServerGame[] = [];

    constructor(socketServer: SocketIO.Server, public masterUserList: User[] = []) {
        socketServer.on('connection', (socket: SocketIO.Socket) => {
            console.log('Got a connection');

            let thisGame = this.activeGames[0];
            socket.on('login', (loginInfo: { username: string, password: string }) => {
                // -later- Determine who this user is or make a new one
                let user: User;
                for (let eachUserIndex in this.masterUserList) {
                    let eachUser = this.masterUserList[eachUserIndex];
                    if (eachUser.username.toLowerCase() === loginInfo.username.toLowerCase()) {
                        if (eachUser.password === loginInfo.password) {
                            user = this.masterUserList[eachUserIndex];
                            user.theSocket = socket as Socket;
                        }
                        else {
                            socket.emit('serverGamesError', {
                                errorMessage: `Incorrect password!` 
                            });
                            console.log(`User ${eachUser.userID}, ${eachUser.username} used incorrect password.`);
                            return;
                        }
                    }
                }
                if (!user) {
                    user = this.newUser(socket);
                    user.username = loginInfo.username;
                    user.password = loginInfo.password;
                }

                if (user.admin) {
                    if (!thisGame.admin(user)) {
                        socket.emit('serverGamesError', {
                            errorMessage: `Couldn't access game!` 
                        });
                        console.log(`Admin ${user.userID}, ${user.username} failed join.`);
                        return;
                    }
                    user.active = true;
                }
                else {
                    // assume this login user gets into the first game
                    
                    // login client is waiting for 'loggedIn' message and game data!
                    // server game will wait for a 'ready' message
                    if (!thisGame.join(user)) {
                        socket.emit('serverGamesError', {
                            errorMessage: `Couldn't join game!` 
                        });
                        console.log(`User ${user.userID}, ${user.username} failed join.`);
                        return;
                    }
                }

                user.active = true;

                // Send user and game info!
                socket.emit('loggedIn', {
                    userId: user.userID,
                    gameDataPath: thisGame.gameDataPath
                });
                console.log(`User ${user.userID}, ${user.username} has logged in.`);

                socket.on('disconnecting', (reason) => {
                    thisGame.drop(user);
                    user.active = false;
                });

            });
        });
    }

    newUser (socket: SocketIO.Socket): User {
        let theUser = {
            username: `User ${this.masterUserList.length + 1}`,
            password: 'password',
            userID: this.masterUserList.length + 1,
            guest: true,
            active: false,
            theSocket: socket as Socket
        }
        theUser.theSocket.userID = theUser.userID;
        this.masterUserList.push(theUser);
        return theUser;
    }

    newGame<T> (gameData: any, gameConstructor: any, renderCallback?: (...param: any[]) => any): T & ServerGame {

        let newGame = new gameConstructor({
            gameData: gameData,
            renderCallback
        } as IServerGame) as T & ServerGame;

        this.activeGames.push(newGame);
        return newGame;
    }
}

var document;
if (document) {
    var require;
    if (!require) {
        let requires = {};
        (<any>window).require = (filePath) => {
            return requires[filePath] || {};
        };
        (<any>window).setRequire = (filePath, requiredObject) => {
            requires[filePath] = requiredObject || {};
        };
    }
    if ((<any>window).setRequire) {
        (<any>window).setRequire('./ServerGames', { ServerGames: ServerGames, ServerGame: ServerGame, Admin: Admin } );
    }
}

