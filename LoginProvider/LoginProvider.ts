import { Socket, User } from '../ServerGames/ServerGames';
import { ClientProviders } from '../ClientProviders/ClientProviders.js';
export module LoginProviders {

    export class LoginProvider {
        private connected: boolean = false;
        private loginCallback: (user: any, gameInfo: any) => void = () => { return; };
        private connectedCallback: () => void = () => { return; };
        constructor (
            usernameInput: HTMLInputElement,
            passwordInput: HTMLInputElement,
            loginButton: HTMLButtonElement,
            public loginSocket: Socket,
            public behaviors?: { actionHtmlElement: HTMLElement, attributeNames?: { ready?: string, busy?: string, loggedIn?: string, error?: string, connected?: string } },
            private xhrProvider: ClientProviders.XhrProvider = new ClientProviders.XhrProvider()
        ) {
    
            this.loginSocket.on('loggedIn', (data) => { return this.loggedInHandler(data); });
    
            loginButton.addEventListener('click', () => { return this.requestLogin(usernameInput.value, passwordInput.value); });
    
            this.loginSocket.on('connect', () => { return this.connectedHandler(); });

            this.loginSocket.open();
        }

        requestLogin(username: string, password: string) {
            if (this.behaviors) {
                this.behaviors.actionHtmlElement.removeAttribute('log-in-error');
                this.behaviors.actionHtmlElement.removeAttribute('logged-in');
                if (this.behaviors.attributeNames && this.behaviors.attributeNames.busy) {
                    this.behaviors.actionHtmlElement.setAttribute(this.behaviors.attributeNames.busy, '');
                }
                else {
                    this.behaviors.actionHtmlElement.setAttribute('log-in-busy', '');
                }
            }

            this.loginSocket.emit('login', {
                username: username,
                password: password
            });
        }

        connectedHandler() {
            if (this.behaviors) {
                this.behaviors.actionHtmlElement.removeAttribute('log-in-error');
                this.behaviors.actionHtmlElement.removeAttribute('logged-in');
                this.behaviors.actionHtmlElement.removeAttribute('log-in-busy');

                if (this.behaviors.attributeNames && this.behaviors.attributeNames.connected) {
                    this.behaviors.actionHtmlElement.setAttribute(this.behaviors.attributeNames.connected, '');
                }
                else {
                    this.behaviors.actionHtmlElement.setAttribute('connected', '');
                }
            }
            if (this.connected) {
                location.reload();
            }
            this.connected = true;
            this.connectedCallback();
        }

        async loggedInHandler (data) {
            if (this.behaviors) {
                this.behaviors.actionHtmlElement.removeAttribute('log-in-busy');
                if (this.behaviors.attributeNames && this.behaviors.attributeNames.loggedIn) {
                    this.behaviors.actionHtmlElement.setAttribute(this.behaviors.attributeNames.loggedIn, '');
                }
                else {
                    this.behaviors.actionHtmlElement.setAttribute('logged-in', '');
                }
            }
            let gameData = data.gameDataPath ? (await this.xhrProvider.getAsync<any>(data.gameDataPath)).firstOrDefault() : {};
            this.loginCallback(data, gameData);
        }
    
        onLogin(callbackFn: (user: User, gameInfo: any) => void) {
            this.loginCallback = callbackFn;
        }
        
        onConnected(callbackFn: () => void) {
            this.connectedCallback = callbackFn;
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
//         (<any>window).setRequire('./LoginProvider', { LoginProviders: LoginProviders } );
//         (<any>window).setRequire('./LoginProvider.js', { LoginProviders: LoginProviders } );
//         (<any>window).setRequire('../LoginProvider/LoginProvider', { LoginProviders: LoginProviders } );
//         (<any>window).setRequire('../LoginProvider/LoginProvider.js', { LoginProviders: LoginProviders } );
//     }
// }
