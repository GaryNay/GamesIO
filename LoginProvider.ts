import { User, Socket } from './ServerGames';
export class LoginProvider {
    private connected: boolean;
    private loginCallback: (user: any, gameInfo: any) => void = () => { return; };
    private connectedCallback: () => void = () => { return; };
    constructor (
        private modalDiv: HTMLDivElement,
        private usernameInput: HTMLInputElement,
        private passwordInput: HTMLInputElement,
        private loginButton: HTMLButtonElement,
        public loginSocket: Socket,
    ) {

        this.loginSocket.on('loggedIn', async (data: any) => {
            let gameData: any = await (async () => {
                return new Promise<any> ((resolve) => {
                    let req = new XMLHttpRequest();
                    req.open('GET', data.gameDataPath);
                    req.onreadystatechange = async () => {
                        if (req.readyState == 4) {
                            req.onreadystatechange = null;
                            if (req.status == 200) {
                                resolve(JSON.parse(req.response));
                            }
                        }
                    };
                    req.send();
                });
            })();
            this.loginCallback(data.userID, gameData);
        });

        loginButton.addEventListener('click', () => {
            this.loginSocket.emit('login', {
                username: usernameInput.value,
                password: passwordInput.value
            });
        });

        this.loginSocket.on('connect', () => {
            if (this.connected) {
                location.reload();
            }
            this.connected = true;
            this.connectedCallback();
        });
        this.loginSocket.open();
    }

    onLogin(callbackFn: (user: User, gameInfo: any) => void) {
        this.loginCallback = callbackFn;
    }
    onConnected(callbackFn: () => void) {
        this.connectedCallback = callbackFn;
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
        (<any>window).setRequire('./LoginProvider', { LoginProvider: LoginProvider } );
    }
}
