import { TopDownEngine } from '../TopDownEngine/Engine.js';
import { ClientProviders } from '../ClientProviders/ClientProviders.js';
import { LoginProviders } from '../LoginProvider/LoginProvider.js';
import { ChatHostClient } from '../ChatHost/ChatHost_Client.js';
declare function io(options?: { forceNew?: boolean, path?: string, autoConnect?: boolean }): ClientProviders.ClientSocketInterface;

namespace TopDownClient {
    export class Scene extends TopDownEngine.Scene {};
    export class MovableFeature extends TopDownEngine.MovableFeature {};
    export class BasicFeature extends TopDownEngine.BasicFeature {};
    export class QueryTree extends TopDownEngine.QueryTree {};

    export class FeatureClicker extends ClientProviders.FeatureClickerClient {};
    export class WindowHandler extends ClientProviders.WindowHandler {}
    export class IODiv extends ClientProviders.InputOutputDiv {}

    export class LoginProvider extends LoginProviders.LoginProvider {}
    export class ChatClient extends ChatHostClient.ChatHost {}
}

(<any>window).entry = function (canvasX, canvasY) {

    var canvas = document.getElementById('outputCanvas') as HTMLCanvasElement;

    var clicker = new TopDownClient.FeatureClicker(canvas);
    (<any>window).clicker = clicker;

    var windowHandler = new TopDownClient.WindowHandler(canvas as HTMLCanvasElement & any, clicker);
    windowHandler.initialize();

    var loginProvider = new TopDownClient.LoginProvider(
        document.getElementById('usernameInput') as HTMLInputElement,
        document.getElementById('passwordInput') as HTMLInputElement,
        document.getElementById('loginButton') as HTMLButtonElement,
        io({ autoConnect: false }) as any,
        { actionHtmlElement: document.getElementById('mainMenuDiv') as HTMLDivElement }
    );

    loginProvider.onConnected(() => {
        console.log(`We've connected!`);
    });

    loginProvider.onLogin(async (user, gameInfo) => {
        console.log(`Login success`); 

        chatHandler.recieveSocket(loginProvider.loginSocket, { userId: user.userId, channel: 'lobby' });

        loginProvider.loginSocket.on('joined', (joinData: { features: TopDownEngine.IBasicFeature[] }) => {
            console.log(`Join success`);

            var tree = new TopDownClient.QueryTree();
            clicker.tree = (<any>window).tree = tree; // Expose tree
        
            var features: TopDownClient.BasicFeature[] = (joinData.features as TopDownEngine.IBasicFeature[])
            .map((eachIFeature) => {
                return new TopDownEngine.BasicFeature(eachIFeature.pos.x, eachIFeature.pos.y, eachIFeature.size.x, eachIFeature.size.y, eachIFeature.angle, eachIFeature.scale, eachIFeature.type);
            });
            for (let i = 0; i < features.length; i++) {
                features[i].index = i;
                tree.insert(features[i]);
            }
            clicker.objectArray = (<any>window).features = features; // Expose features

            tree.renderVisually(canvas);

            loginProvider.loginSocket.on('add-feature', (d: { rx: number, ry: number, sx: number, sy: number }) => {
                console.log(`Adding feature!`);
                let newFeature = new TopDownEngine.BasicFeature(d.rx, d.ry, d.sx, d.sy);
                newFeature.index = features.length;
                features.push(newFeature);
                tree.insert(newFeature);
                tree.renderVisually(canvas);
            });

            clicker.onClick = (point: TopDownEngine.Coord) => {
                console.log(`Attempting Click!`);
                loginProvider.loginSocket.emit('request-feature', { rx: point.x, ry: point.y, sx: 5, sy: 5})
            };
                
        });

        loginProvider.loginSocket.emit('ready', {});
    });

    var ioDiv = new TopDownClient.IODiv(
        document.getElementById('outputDiv') as any,
        document.getElementById('textDiv') as HTMLDivElement,
        document.getElementById('chatInput') as HTMLInputElement
    );
    (<any>window).ioDiv = ioDiv;

    var chatHandler = new TopDownClient.ChatClient(ioDiv, document.createElement('div'));
    (<any>window).chatHandler = chatHandler;
}
