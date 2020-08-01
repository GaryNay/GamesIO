import { User } from '../ServerGames/ServerGames';
import fileSystem = require('fs');

export interface ClientChatPackage {
    userId?: number;
    channel?: string;
    text?: string;
    timeStamp?: string;
}

export interface ServerChatPackage {
    history?: ServerChatPackage[];

    info?: string;

    userId?: number;
    username?: string;
    channel?: string;
    timeStamp?: string;
    text?: string;

    rate?: number;
}

export module ChatHostServer {
    export class ChatHost {

        channels: {
            [ channelName: string ]: { ownerId: number, currentUserIds: number[] }
        } = { lobby: { ownerId: 0, currentUserIds: [] }}; // Lobby, owned by admin

        userData: {
                active?: boolean,
                socket?: SocketIO.Socket,
                userId: number,
                subscriptions: string[],
                chatHistory: ClientChatPackage[]
            }[] = [];

        currentUserIds: number[];

        constructor (public masterUserList: User[]) {
            this.currentUserIds = [];
        }

        start() {
            // Load user data json
            if (fileSystem.existsSync('./UserChatData.json')) {
                this.userData = JSON.parse(fileSystem.readFileSync('./UserChatData.json', 'utf8'));
            }
        }

        end() {
            fileSystem.writeFileSync('./UserChatData.json', JSON.stringify(this.userData.map((eachData) => {
                return eachData ? {
                    userId: eachData.userId,
                    subscriptions: eachData.subscriptions,
                    chatHistory: eachData.chatHistory
                } : null;
            })), 'utf8');
        }

        broadcast(toBroadcast: ServerChatPackage) {
            let channel = this.channels[ toBroadcast.channel ];
            let broadcastAudit = 0;

            if (toBroadcast.userId && !toBroadcast.username) {
                toBroadcast.username = this.masterUserList[ toBroadcast.userId - 1].username;
            }

            for (let userIndex = 0; userIndex < channel.currentUserIds.length; userIndex++) {
                let user = this.masterUserList[ channel.currentUserIds[ userIndex ] - 1 ];
                if (user.active && user.theSocket) {
                    user.theSocket.emit(
                        'chat message',
                        toBroadcast
                    );
                    broadcastAudit++;
                }
                else {
                    // Cleanup required
                    console.log(`ChatHost: Incorrect channel config detected!`);
                }
            }
            
            console.log(`ChatHost: ${ this.masterUserList[ toBroadcast.userId - 1 ].username } says "${ toBroadcast.text }" to ${ broadcastAudit } users`);
        }

        join(user: User): boolean {
            if (!this.userData[ user.userId ]) {
                // New userdata, subscribe to the lobby
                this.userData[ user.userId ] = { active: true, userId: user.userId, subscriptions: [], chatHistory: [], socket: user.theSocket };
                this.subscribe(user);
                console.log(`ChatHost: Welcome ${ user.username } to the lobby.`);
            }
            else {
                // Resume subscriptions
                let userData = this.userData[ user.userId ];
                userData.active = true;
                userData.socket = user.theSocket;
            }
            this.userData[ user.userId ].socket.on('client input', (data) => { return this.inputHandler(data); });
            this.resume(user);
            return true;
        }

        inputHandler(data: ClientChatPackage) {
            if (data.text && data.userId >= 0) {
                let userData = this.userData[ data.userId ];
                if (userData) {
                    userData.chatHistory.push(data);
                    this.broadcast(data);
                }
            }
        }
        
        drop(user: User): boolean {
            this.userData[ user.userId ].active = false;
            this.userData[ user.userId ].socket = null;
            for (let si=0; si< this.userData[ user.userId ].subscriptions.length; si++) {
                this.channels[ this.userData[ user.userId ].subscriptions[si] ].currentUserIds =
                    this.channels[ this.userData[ user.userId ].subscriptions[si] ].currentUserIds.filter((eachId) => { return eachId !== user.userId; });
            }
            console.log(`ChatHost: ${ user.username } dropped.`);
            return true;
        }

        resume(user: User, channelName?: string): boolean {
            if (!channelName) {
                let userData = this.userData[ user.userId ];
                for (let si=0; si< userData.subscriptions.length; si++) {
                    this.resume(user, userData.subscriptions[si]);
                }
                console.log(`ChatHost: ${ user.username } resumed ${ userData.subscriptions.length } subscriptions.`);
                return true;
            }
            if (this.userData[ user.userId ].subscriptions.includes(channelName) && !this.channels[channelName].currentUserIds.includes(user.userId)) {
                this.channels[channelName].currentUserIds.push(user.userId);
            }
            return true;
        }

        subscribe(user: User, channelName: string = 'lobby'): boolean {

            for (let si=0; si < this.userData[ user.userId ].subscriptions.length; si++) {
                if (this.userData[ user.userId ].subscriptions[si] == channelName) {
                    
                    return true;
                }
            }

            this.userData[ user.userId ].subscriptions.push(channelName);

            console.log(`ChatHost: Subscribing ${ user.username } to ${ channelName } (total: ${ this.userData[ user.userId ].subscriptions.length })`);

            return true;
        }

        unsubscribe(user: User, channelName?: string): boolean {            
            if (!channelName) {
                for (let eachSub of this.userData[ user.userId ].subscriptions) {
                    this.channels[eachSub].currentUserIds.filter((eachId) => { return eachId !== user.userId });
                }
                this.userData[ user.userId ].subscriptions = [];
                return true;
            }
            this.channels[channelName].currentUserIds.filter((eachId) => { return eachId !== user.userId });
            this.userData[ user.userId ].subscriptions = this.userData[ user.userId ].subscriptions
                .filter((eachSub) => {
                    return eachSub != channelName;
                });
            return true;
        }
    }
}
