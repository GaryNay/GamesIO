import { ClientProviders } from '../ClientProviders/ClientProviders';
import { ClientChatPackage, ServerChatPackage } from './ChatHost_Server';

export module ChatHostClient {
    export class ChatHost {
        inputRate: number;
        socket: SocketIO.Socket;
        clientHeader: ClientChatPackage;

        constructor(private ioDiv: ClientProviders.InputOutputDiv, private infoBox: HTMLDivElement, socket?: SocketIO.Socket, clientHeader?: ClientChatPackage) {
            this.inputRate = Math.floor((1 / 10) * 1000);

            this.ioDiv.onInput(document, (text: string) => {
                this.sendClientInput(text);
            });

            socket && this.recieveSocket(socket, this.clientHeader = clientHeader);

        }

        recieveSocket(socket: SocketIO.Socket, clientHeader: ClientChatPackage) {
            this.socket = socket;
            this.clientHeader = clientHeader;

            this.socket.on('chat history', (theHistory: ServerChatPackage) => {
                // clear the div!
                this.ioDiv.clearOutput();
                for (let eachMsg of theHistory.history) {
                    this.ioDiv.output(eachMsg.text);
                }
            });
            this.socket.on('chat message', (msg: ServerChatPackage) => {
                this.ioDiv.output(`<b>${ msg.username }:</b> ${ msg.text }`);
                console.log(`ChatHost: Recieved message: "${ msg.text }"`);
            });
            this.socket.on('info box', (newInfo: ServerChatPackage) => {
                this.infoBox.innerHTML = newInfo.info;
            });
            this.socket.on('input rate', (newRate: ServerChatPackage) => {
                console.log("Changed input rate!");
                this.inputRate = newRate.rate;
            });
        }

        sendClientInput (text: string) {
            if (this.socket) {
                var inputPackage: ClientChatPackage = {
                    userId: this.clientHeader.userId,
                    text: text,
                    channel: this.clientHeader.channel,
                    timeStamp: new Date(Date.now()).toISOString()
                };
                this.socket.emit('client input', inputPackage);
            }
        }

    }
}

// var document;
// if (document) {
//     var require;
//     if (!require) {
//         let requires: any = {};
//         (<any>window).require = (filePath: string) => {
//             return requires[filePath] || {};
//         };
//         (<any>window).setRequire = (filePath: string, requiredObject: any) => {
//             requires[filePath] = requiredObject || {};
//         };
//     }
//     if ((<any>window).setRequire) {
//         (<any>window).setRequire('./ChatHost_Client', { ChatHostClient: ChatHostClient } );
//         (<any>window).setRequire('./ChatHost_Client.js', { ChatHostClient: ChatHostClient } );
//         (<any>window).setRequire('../ChatHost/ChatHost_Client', { ChatHostClient: ChatHostClient } );
//         (<any>window).setRequire('../ChatHost/ChatHost_Client.js', { ChatHostClient: ChatHostClient } );
//     }
// }
