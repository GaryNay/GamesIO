namespace ChatHost {
    interface KeyMap {
        ([number]): number;
    }
    class ChatHost {
        socket;
        theCanvas;
        theChatBox;
        theInfoBox;
        theChatForm;
        theMessageDiv;
        theChatInput;
        theGameCell;
        keyMap: {};
        remoteKeyMaps;
        remotePlayers;
        theMouse: {};
        inputRate: number;

        constructor(paramObject) {

            this.socket = paramObject.theSocket;
            this.theCanvas = paramObject.theCanvas;
            this.theChatBox = paramObject.theChatBox;
            this.theInfoBox = paramObject.theInfoBox;
            this.theChatForm = paramObject.theChatForm;
            this.theMessageDiv = paramObject.theMessageDiv;
            this.theChatInput = paramObject.theChatInput;
            this.theGameCell = paramObject.theGameCell;
            this.keyMap = { };
            this.remoteKeyMaps = [];
            this.remotePlayers = [];
            this.theMouse = { down: 0, mx: 0, my: 0, bMap: [], tileX: 0, tileY: 0, wheel: 0, wheelVec: 0, owheel: 0, theCanvasRect: paramObject.theCanvas.getBoundingClientRect() };
            this.inputRate = Math.floor((1 / 10) * 1000);

            this.socket.on('game frame', function (frameData) {
                });

            if (this.theChatForm) {
                this.theChatForm.onsubmit = function () {
                    this.socket.emit('chat message', this.theChatInput.value);
                    this.theChatInput.value = "";
                    return false;
                }
            }

            this.socket.on('chat history', function (theHistory) {
                // clear the div!
                this.theMessageDiv.innerHTML = "";
                theHistory.forEach(function (msg) {
                    //$('#messages').append("<p style=\'color:" + msg["color"] + "\'>" + msg["message"] + "</p>");
                    this.addMessage(msg, this);
                });
            });
            this.socket.on('chat message', function (msg) {
                //$('#messages').append("<p style=\'color:" + msg["color"] + "\'>" + msg["message"] + "</p>");
                this.addMessage(msg, this);
            });
            this.socket.on('info box', function (newInfo) {
                this.theInfoBox.innerHTML = newInfo.toString();
            });
            this.socket.on('input rate', function (newRate) {
                console.log("Changed input rate!");
                this.inputRate = newRate.rate;
            });
            this.socket.on('start game', function (gameInfo) {
                this.startGame(gameInfo);
            });
            this.socket.on('add player', function (playerInfo) {
                this.addPlayer(playerInfo);
            });
            this.socket.on('remove player', function (playerInfo) {
                this.removePlayer(playerInfo);
            });
            this.socket.on('player input', function (playerInfo) {
                this.playerInput(playerInfo, this);
            });
            this.socket.on('game state', function (stateInfo) {
                this.gameState(stateInfo);
            });


            document.oncontextmenu = function (e) { return false }; //disable right-clicking context menus on this document

            document.addEventListener('keyup', function (e) { this.keyMap = this.keyListener("up", e, this.keyMap); }, false);
            document.addEventListener('keydown', function (e) { this.keyMap = this.keyListener("down", e, this.keyMap); }, false);
            //this.theGameCell.addEventListener('keyup',   function (e) { this.keyMap = this.keyListener(  "up", e, this.keyMap); }, false);
            //this.theGameCell.addEventListener('keydown', function (e) { this.keyMap = this.keyListener("down", e, this.keyMap); }, false);

            this.theCanvas.addEventListener('mousemove', function (e) { this.theMouse = this.mouseListener("move", e, this.theMouse); }, false);
            this.theCanvas.addEventListener('mousedown', function (e) { this.theMouse = this.mouseListener("down", e, this.theMouse); }, false);
            this.theCanvas.addEventListener('mouseup', function (e) { this.theMouse = this.mouseListener("up", e, this.theMouse); }, false);
            this.theCanvas.addEventListener('mouseout', function (e) { this.theMouse = this.mouseListener("out", e, this.theMouse); }, false);
            this.theCanvas.addEventListener('wheel', function (e) { this.theMouse = this.mouseListener("wheel", e, this.theMouse); }, false);

            document.getElementById("rlButton").addEventListener('touchstart', function (e) {
                e.preventDefault();
                this.clickbutton({ down: 90 });
            }, false);
            document.getElementById("rrButton").addEventListener('touchstart', function (e) {
                e.preventDefault();
                this.clickbutton({ down: 88 });
            }, false);
            document.getElementById("mlButton").addEventListener('touchstart', function (e) {
                e.preventDefault();
                this.clickbutton({ down: 37 });
            }, false);
            document.getElementById("dButton").addEventListener('touchstart', function (e) {
                e.preventDefault();
                this.clickbutton({ down: 40 });
            }, false);
            document.getElementById("mrButton").addEventListener('touchstart', function (e) {
                e.preventDefault();
                this.clickbutton({ down: 39 });
            }, false);
            document.getElementById("rlButton").addEventListener('touchend', function (e) {
                e.preventDefault();
                this.clickbutton({ up: 90 });
            }, false);
            document.getElementById("rrButton").addEventListener('touchend', function (e) {
                e.preventDefault();
                this.clickbutton({ up: 88 });
            }, false);
            document.getElementById("mlButton").addEventListener('touchend', function (e) {
                e.preventDefault();
                this.clickbutton({ up: 37 });
            }, false);
            document.getElementById("dButton").addEventListener('touchend', function (e) {
                e.preventDefault();
                this.clickbutton({ up: 40 });
            }, false);
            document.getElementById("mrButton").addEventListener('touchend', function (e) {
                e.preventDefault();
                this.clickbutton({ up: 39 });
            }, false);

            this.theCanvas.addEventListener('touchmove', function (e) {
                e.preventDefault();
                var mouseEvent = {
                    buttons: 0,
                    clientX: 0,
                    clientY: 0
                };
                //this.theMouse = this.mouseListener("move", e, this.theMouse);
            }, false);

        }

        sendClientInput (thisHost, thisGame) {

            if (thisGame.inputTimer)
                if (thisGame.inputTimer + thisHost.inputRate > performance.now())
                    return;  // not ready to send input!
            thisGame.inputTimer += thisHost.inputRate;

            //var inputPackage = { "keymap": thisHost.keyMap, "mouse": thisHost.theMouse, timeStamp: {} };
            var inputPackage = { "keymap": thisHost.keyMap, "mouse": {}, timeStamp: {}, frameNumber: (thisGame || { frameNumber: 0 }).frameNumber };
            thisHost.theMouse.owheel = thisHost.theMouse.wheel;
            thisHost.socket.emit('client input', inputPackage);
            //console.log("Sent Input Package!");
            //setTimeout(thisHost.sendClientInput, thisHost.inputRate);
        }
        mouseListener (doing, theEvent, thisMouse) {

            //var thisMouse = thisHost.theMouse;
            var theCanvasRect = thisMouse.theCanvasRect;

            // create the bMap[] for the buttons!
            for (var bit = 0; bit < 3; bit++) {
                thisMouse.bMap[bit] = ((theEvent.buttons & Math.pow(2, bit)) != 0);
            }
            switch (doing) {
                case 'move':
                    thisMouse.mx = theEvent.clientX - theCanvasRect.left;
                    thisMouse.my = theEvent.clientY - theCanvasRect.top;

                    break;
                case 'down':
                    // consider to simulate a keyboard button based on mouse position
                    thisMouse.down = 1;
                    break;
                case 'up':
                    thisMouse.down = 0;
                    break;
                case 'wheel':
                    //theMouse.wx += theEvent.deltaX;
                    thisMouse.wheel += theEvent.deltaY;

                    thisMouse.wheelVec = theEvent.deltaY;
                    //theMouse.wz += theEvent.deltaZ;

                    break;
                case 'out': break;
                default:
                    break;
            }
            return thisMouse;
        }
        keyListener (doing, theEvent: { keyCode: number }, thisKeyMap: KeyMap): KeyMap {
            //var returnKeyMap = thisKeyMap;
            //var key = theEvent.keyCode;
            //document.getElementById('infoBox').innerHTML += "the keyboard is " + doing + ", key: "+theEvent.key +";" ;

            switch (doing) {
                case 'down':
                    thisKeyMap[theEvent.keyCode] = 1;
                    //document.getElementById('infoBox').innerHTML = key;
                    break;
                case 'up':
                    thisKeyMap[theEvent.keyCode] = undefined;
                    break;
            }

            return thisKeyMap;
        }
        addMessage (theMessage, thisHost) {
            var newPara = document.createElement("p");
            newPara.style.color = theMessage["color"];
            newPara.innerHTML = theMessage["username"] + ": " + theMessage["message"];

            thisHost.theMessageDiv.appendChild(newPara);
            thisHost.theMessageDiv.scrollTop = thisHost.theMessageDiv.scrollHeight;
        }
        startGame () { return; }
        addPlayer () {
            return;
        }
        removePlayer () {
            return;
        }
        gameState () {
            return;
        }

        playerInput (playerInfo, thisHost) {
            if (thisHost.remotePlayers[playerInfo.playerID]) { // Is this a player we have?
                //thisHost.remoteKeyMaps[playerInfo.playerID] = playerInfo.keyMap;
                thisHost.remotePlayers[playerInfo.playerID].inputFrame = playerInfo.keyFrame;
                thisHost.remotePlayers[playerInfo.playerID].inputReady = true;
            } else {
                // We don't have this player, request it from the server!
            }
        }

        submitJoin = function () {
            this.socket.emit('chat message', "/join");
        }
        clickButton = function (which) {
            if (which.down)
                this.keyMap = this.keyListener("down", { keyCode: which.down }, this.keyMap);
            if (which.up)
                this.keyMap = this.keyListener("up", { keyCode: which.up }, this.keyMap);
        };
    }
}



