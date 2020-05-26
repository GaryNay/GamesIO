
// import socketsImport = require('socket.io');
import { ChatHostServer } from '../ChatHost/ChatHost_Server';
import fileSystem = require('fs');

export interface Socket extends SocketIO.Socket {
    userId: number;
    messageCount?: number;
    open: ()=> void
}

export interface IUser {
    username: string;
    password: string;
    color: string;
    userId: number;
    admin?: boolean;
}
export interface User {
    username: string;
    password: string;
    theSocket?: Socket;
    color?: string;
    userId: number;
    active: boolean;
    guest: boolean;
    admin?: boolean;
    inGame?: boolean;
    inGameType?: string;
}

export module ServerGames {

    export class Admin implements User {
        username: string = 'admin';
        password: string = 'password';
        theSocket?: Socket;
        color?: string;
        userId: number = NaN;
        active: boolean = false;
        guest: boolean = false;
        admin?: boolean = true;
        inGame?: boolean = false;
        inGameType?: string = '';
        constructor() {
        }
    }

    export interface ServerGameParameters {
        gameData: any;
        renderCallback?: (...param: any[]) => any;
    }

    export interface ServerGameConstructor {
        new (gameConstructor: ServerGameConstructor, gameData: any): ServerGame;
    }

    export interface IServerGame {
        gameData: any;
        renderCallback?: any;
        gameDataPath: string;
        start: (...param: any[]) => any;
        join: (user: User) => boolean;
        admin: (user: User) => boolean;
        drop: (user: User) => boolean;
        end: (...param: any[]) => any;
        export: (...param: any[]) => any;
    }

    export interface IUserData {
        userId: number;
        userName: string;
        logins: number;
        user?: User,
        currentUserIdIndex?: number
    }

    export class ServerGame implements IServerGame {
        gameData: any;
        renderCallback?: any;        
        gameDataPath: string = '/.';
        localGameDataPath: string = '/.';

        currentUserIds: number[];
        usersData: { [ userId: number ]: IUserData } = {};

        constructor(gameData: any, renderCallback: (...param: any[]) => any) {
            this.gameData = gameData;
            this.renderCallback = renderCallback;
        }
        start() {
            this.currentUserIds = []; // Nobody active in a newly started game
            // Fetch users data

            return;
        };
        join(user: User) {
            if (user.theSocket) {
                if (!this.usersData[ user.userId ]) {
                    this.usersData[ user.userId ] = { userId: user.userId, userName: user.username, logins: 0, user: user };
                }
                else {
                    this.usersData[ user.userId ].user = user;
                    this.usersData[ user.userId ].logins++;
                }
    
                this.usersData[user.userId].currentUserIdIndex = this.currentUserIds.length;
                this.currentUserIds.push(user.userId);
                return true;
            }
            return false;
        };
        admin(user: User) {
            return this.join(user);
        };
        drop(user: User) {
            if (this.usersData[user.userId].currentUserIdIndex >= 0 || this.currentUserIds.includes(user.userId)) {
                this.currentUserIds = this.currentUserIds.filter((eachId) => {
                    return eachId !== user.userId;
                });
                this.usersData[user.userId].currentUserIdIndex = null;
                this.usersData[user.userId].user = null;
            }
            return true;
        };
        end() {
            return;
        };
        export() {
            return {}
        };
    }

    export class ServerGames {
        activeGames: { game: ServerGame }[] = [];
        chatServer: ChatHostServer.ChatHost;

        constructor(private socketServer: SocketIO.Server, public masterUserList: User[] = [
            {
                username: `admin`,
                password: 'password',
                userId: 1,
                admin: true,
                guest: false,
                active: false
            }
        ] as User[]) {


            this.chatServer = new ChatHostServer.ChatHost(this.masterUserList);
        }

        start() {
            this.chatServer.start();

            this.socketServer.on('connection', (socket: SocketIO.Socket) => { return this.connectionHandler(socket); });

            process.stdin.on('data', (consoleInput: string) => {
                if (consoleInput.indexOf('/end') >= 0) {
                    console.log(`ServerGames: Ending session...`);
                    this.end();
                }
            });

            if (fileSystem.existsSync('./UserServerData.json')) {
                let userList: User[] = JSON.parse(fileSystem.readFileSync('./UserServerData.json', 'utf8'));
                for (let eachUser of userList) {
                    this.masterUserList[ eachUser.userId ] = {
                        userId: eachUser.userId,
                        username: eachUser.username,
                        password: eachUser.password,
                        color: eachUser.color,
                        active: false,
                        admin: eachUser.admin,
                        guest: false
                    };
                }
            }
            
        }

        end() {
            this.chatServer.end();
            for (let eachGame of this.activeGames) {
                eachGame.game.end();
            }
            fileSystem.writeFileSync('./UserServerData.json', JSON.stringify(this.masterUserList.map((eachUser) => {
                let userData: IUser = {
                    userId: eachUser.userId,
                    username: eachUser.username,
                    password: eachUser.password,
                    color: eachUser.color,
                    admin: eachUser.admin
                };
                return userData;
            })), 'utf8');
            console.log(`ServerGames: Session exit success.`);
            process.exit();
        }

        newUser (socket: SocketIO.Socket): User {
            let theUser = {
                username: `User ${this.masterUserList.length + 1}`,
                password: 'password',
                userId: this.masterUserList.length + 1,
                guest: true,
                active: false,
                theSocket: socket as Socket
            }
            theUser.theSocket.userId = theUser.userId;
            this.masterUserList.push(theUser);
            console.log(`ServerGames: Created new user ${theUser.userId}, ${theUser.username}`);
            return theUser;
        }

        newGame<T> (gameConstructor: ServerGameConstructor, gameData: any, renderCallback?: (...param: any[]) => any): T & ServerGame {

            let newGame = new gameConstructor(
                gameData,
                renderCallback
            ) as T & ServerGame;

            this.activeGames.push({ game: newGame });
            return newGame;
        }

        connectionHandler(socket: SocketIO.Socket) {
            console.log('ServerGames: Got a connection');

            if (!this.activeGames || !this.activeGames[0]) {
                return;
            }

            socket.on('login', (loginInfo) => { return this.loginHandler(socket, loginInfo); });
        }

        loginHandler(socket: SocketIO.Socket, loginInfo: { username: string, password: string, gameIndex: number }) {
            let thisGame: ServerGame = this.activeGames[ loginInfo.gameIndex || 0].game;
            if (!thisGame) {
                socket.emit('serverGamesError', {
                    errorMessage: `Bad game request!` 
                });
                console.log(`ServerGames: Bad game request, ${ loginInfo.gameIndex } from "${ loginInfo.username }"`);
                return;
            }
            // -later- Determine who this user is or make a new one
            let user: User = null as any;
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
                        console.log(`ServerGames: User ${eachUser.userId}, ${eachUser.username} used incorrect password.`);
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
                if (!thisGame || !thisGame.admin(user)) {
                    socket.emit('serverGamesError', {
                        errorMessage: `Couldn't access game!` 
                    });
                    console.log(`ServerGames: Admin ${user.userId}, ${user.username} failed join.`);
                    return;
                }
            }
            else {
                // assume this login user gets into the first game
                
                // login client is waiting for 'loggedIn' message and game data!
                // server game will wait for a 'ready' message
                if (!thisGame || !thisGame.join(user)) {
                    socket.emit('serverGamesError', {
                        errorMessage: `Couldn't join game!` 
                    });
                    console.log(`ServerGames: User ${user.userId}, ${user.username} failed join.`);
                    return;
                }
            }

            user.active = true;

            // Send user and game info!
            socket.emit('loggedIn', {
                userId: user.userId,
                gameDataPath: thisGame.gameDataPath
            });
            console.log(`ServerGames: User ${user.userId}, ${user.username} has logged in.`);

            this.chatServer.join(user);

            socket.on('disconnecting', (reason) => { return this.disconnectionHandler(user, thisGame, reason); });
        }

        disconnectionHandler (user: User, game: ServerGame, reason: any) {
            console.log(`ServerGames: User ${user.userId} disconnected.`);
            game.drop(user);
            this.chatServer.drop(user);
            user.active = false;
        }

    }
}
