/// <reference path="./LoginProvider.ts"/>
import { MobaIO_Base } from './mobaIO_base_module';
import { LoginProvider } from './LoginProvider';
declare function io(options?: { forceNew?: boolean, path?: string, autoConnect?: boolean }): MobaIO_Client.ClientSocketInterface;

namespace MobaIO_Client {
    class KeyMap  {
        keyMap: { ([number]?): number };
        private onKeys: ( () => any)[] = [];
        constructor (public keyElement: HTMLElement) {
            keyElement.addEventListener('keyup', (e) => { e.preventDefault(); this.keyListener("up", e); }, false);
            keyElement.addEventListener('keydown', (e) => { if (e.keyCode !== 123) e.preventDefault(); this.keyListener("down", e); }, false);
            this.keyMap = {} as any;
        }
        keyListener (doing, theEvent) {
            switch (doing) {
                case 'down':
                    this.keyMap[theEvent.keyCode] = 1;
                    
                    (this.onKeys[theEvent.keyCode] || (() => {}))();

                    break;
                case 'up':
                    this.keyMap[theEvent.keyCode] = undefined;
                    break;
            }
        }
        onKey (keyCode: number, callbackFn: () => any) {
            this.onKeys[keyCode] = callbackFn;
        }
    }
    interface KeySet extends MobaIO_Base.InputSet {
        [ keyName: string ]: number;
    }
    class Mouse {
        elementRect: ClientRect
        bMap: boolean[] = [];
        point: MobaIO_Base.Coord = new MobaIO_Base.Coord();
        down: number;
        wheel: number;
        wheelVec: number;
        scaleX: number;
        scaleY: number;

        private onMoves: ( () => any)[] = [];
        private onClicks: ( () => any)[] = [];
        private onDrags: ( () => any)[] = [];
        private onWheels: ( () => any)[] = [];
        private clicked: boolean = false;

        constructor (public mouseElement: HTMLCanvasElement) {
            mouseElement.addEventListener('mousemove', (e) => { this.mouseListener("move", e); }, false);
            mouseElement.addEventListener('mousedown', (e) => { this.mouseListener("down", e); }, false);
            mouseElement.addEventListener('mouseup'  , (e) => { this.mouseListener("up",   e); }, false);
            mouseElement.addEventListener('mouseout' , (e) => { this.mouseListener("out",  e); }, false);
            mouseElement.addEventListener('wheel',     (e) => { this.mouseListener("wheel",e); }, false);
            this.updateRect(mouseElement.getBoundingClientRect());
        }
        updateRect(newRect: ClientRect) {
            this.elementRect = newRect;
            this.scaleY = this.mouseElement.height / this.elementRect.height;
            this.scaleX = this.mouseElement.width / this.elementRect.width;
        }
        mouseListener (doing, theEvent) {

            // create the bMap[] for the buttons!
            for (var bit = 0; bit < 3; bit++) {
                this.bMap[bit] = ((theEvent.buttons & Math.pow(2, bit)) != 0);
            }
            switch (doing) {
                case 'move':
                    this.point.x = (theEvent.clientX - this.mouseElement.offsetLeft) * this.scaleX; //.left;
                    this.point.y = (theEvent.clientY - this.mouseElement.offsetTop) * this.scaleY; //.top;
                    if (this.down)
                        (this.onDrags[0] || (() => {}))();
                    
                    (this.onMoves[0] || (() => {}))();
                    
                    break;
                case 'down':
                    // consider to simulate a keyboard button based on mouse position
                    this.down = 1;
                    (this.onClicks[0] || (() => {}))();
                    break;
                case 'up':
                    this.down = 0;
                    this.clicked = false;
                    break;
                case 'wheel':
                    //theMouse.wx += theEvent.deltaX;
                    this.wheel += theEvent.deltaY;

                    this.wheelVec = theEvent.deltaY;
                    //theMouse.wz += theEvent.deltaZ;

                    (this.onWheels[0] || (() => {}))();
                    
                    break;
                case 'out': break;
                default:
                    break;
            }
        }

        onMove (callBack: () => any) {
            this.onMoves.push(callBack);
        }
        onClick (callback: () => any) {
            this.onClicks.push(callback);
        }
        onDrag (callback: () => any) {
            this.onDrags.push(callback);
        }
        onBounds (callback: () => any, bounds: MobaIO_Base.Rect) {

        }
        onWheel (callback: () => any) {
            this.onWheels.push(callback);
        }
    }
    class Camera extends MobaIO_Base.Movable {
        public scaleToFit: number;
        private screenHalf: MobaIO_Base.ICoord;
        public currentWorld: MobaIO_Client.World;
        public trackedFeature: MobaIO_Base.Movable;
        public viewPort: MobaIO_Base.Rect = new MobaIO_Base.Rect();
        public viewHalf: MobaIO_Base.ICoord;
        public viewCanvas: HTMLCanvasElement;
        public viewContext: CanvasRenderingContext2D;
        public targetPos: MobaIO_Base.Coord;
        public facing: MobaIO_Base.Momentum;
        public ai: CameraAI;
        public scaleTo: number = 1;
        public scaleChange: number = 0;
        constructor(cameraParam) {
            super(cameraParam);
            this.aafeatureName = "Camera";
            if (cameraParam) {
                if (cameraParam.thisWorld)
                    this.currentWorld = cameraParam.thisWorld;
                
                this.size = { x: cameraParam.screenSize.x || 320, y: cameraParam.screenSize.y || 240 };
            }
            this.screenHalf = { x: this.size.x / 2, y: this.size.y / 2 };
            this.zoom(cameraParam.scale);
            this.viewCanvas = document.createElement('canvas');
            this.viewCanvas.width = this.size.x;
            this.viewCanvas.height = this.size.y;
            this.viewContext = this.viewCanvas.getContext('2d');
            
            this.targetPos = new MobaIO_Base.Coord(this.mapPos);
            this.momentum = new MobaIO_Base.Momentum();
            this.facing = new MobaIO_Base.Momentum();
            this.ai = new CameraAI(this, cameraParam.world);
            this.moveSpeeds = { angle: 360, velocity: 0 };
            this.scale = 1;

        }
        doMove() {
            this.moveTo({ x: this.mapPos.x + this.momentum.delta.x, y: this.mapPos.y + this.momentum.delta.y });
        }
        gameFrame() {
            this.ai.gameFrame(this.ai);
            this.momentum = this.facing;
            this.doMove();

            let scaleAdjust = this.scaleChange / 5;
            
            if (Math.abs(this.scaleTo - this.scale) > Math.abs(scaleAdjust))
                this.zoom(this.scale += scaleAdjust);
            else   
                this.zoom(this.scale = this.scaleTo);
            

            //scale + (this.mouse.wheelVec / 1000) * scale
            
            // this.viewPort.p1 = this.mapPos.translate({ x: -this.viewHalf.x, y: -this.viewHalf.y });
            this.viewPort.p1.x = this.mapPos.x - this.viewHalf.x;
            this.viewPort.p1.y = this.mapPos.y - this.viewHalf.y;

            // this.viewPort.p2 = this.mapPos.translate({ x:  this.viewHalf.x, y:  this.viewHalf.y });
            this.viewPort.p2.x = this.mapPos.x + this.viewHalf.x;
            this.viewPort.p2.y = this.mapPos.y + this.viewHalf.y;
        }
        zoom(factor: number) {
            this.scale = factor || 1;
            if (this.scale < .1)
                this.scale = .1;
            this.viewHalf = { x: this.screenHalf.x / this.scale, y: this.screenHalf.y / this.scale };
        }
        viewable(feature: MobaIO_Base.MapFeature): boolean {
            return this.viewPort.containsRect(feature.mapPos, feature.scaleSize);
        }
        getDrawOffset(mapPos: MobaIO_Base.ICoord): MobaIO_Base.ICoord {
            return {
                x: (mapPos.x - (this.mapPos.x - this.viewHalf.x)) * this.scale,
                y: (mapPos.y - (this.mapPos.y - this.viewHalf.y)) * this.scale
                //x: mapPos.x - (this.mapPos.x - this.screenHalf.x),
                //y: mapPos.y - (this.mapPos.y - this.screenHalf.y)
            };
        }
        getMapCoord(mapPos: MobaIO_Base.Coord): MobaIO_Base.ICoord {
            return {
                x: mapPos.x + (this.mapPos.x - this.viewHalf.x),
                y: mapPos.y + (this.mapPos.y - this.viewHalf.y)
            }
        }
        getMouseCoord(pointPos: MobaIO_Base.ICoord): MobaIO_Base.ICoord {
            return {
                x: (pointPos.x / this.scale) + (this.mapPos.x - this.viewHalf.x),
                y: (pointPos.y / this.scale) + (this.mapPos.y - this.viewHalf.y)
            }
        }
        track(target: MobaIO_Base.Movable) {
            this.ai.track(target);
        }
    }
    class CameraAI extends MobaIO_Base.MoveAI {

        static _gameFrame = MobaIO_Base.MoveAI.prototype.gameFrame;

        constructor(public commanding: MobaIO_Base.Movable, world: World) {
            super (commanding);
            this.aiFrameTickCounter = this.aiFrameTicks = 1;
            this.attach(world);
        }
        gameFrame (self?: CameraAI & MobaIO_Base.MoveAI): boolean {
            if (!self)
                self = this;
            return CameraAI._gameFrame(self, () => {
            });
        }

        track (target: MobaIO_Base.Movable) {
            this.tracking = target;
            this.endCommands();
            let trackingGoto: MobaIO_Base.Command = { active: false } as any;
            this.addCustomCommand((self: MobaIO_Base.MoveAI, commanding: MobaIO_Base.Movable) => {
                
                if (!(target = self.tracking))
                    return true;
                
                let velocity;
                if ((velocity = commanding.mapPos.distanceTo(target.mapPos)) > .5) {
                    velocity = velocity / 20;
                    if (velocity < .05) 
                        velocity = 0;
                    commanding.moveSpeeds = { angle: 360, velocity: velocity };
                    if (!trackingGoto.active) {
                        trackingGoto = self.goTo(target.mapPos, .1);
                    }
                    else {
                        self.targetPos.x = target.mapPos.x;
                        self.targetPos.y = target.mapPos.y;
                    }
                }
                
                return false;
            },
            (self: MobaIO_Base.MoveAI) => {
                return true; //!self.tracking ? true : false; // this AI still wants to track!
            },
            `Camera Track ${target.trackingId}/${this.commanding.trackingId}`);

        }
        
    }
    interface IBaseMenu {
        containerMenuDiv: HTMLDivElement;
    }
    class BaseMenu {
        containerMenuDiv: HTMLDivElement;
        menuShowing: boolean = false;
        constructor(param: { containerMenuDiv: HTMLDivElement }) {
            this.containerMenuDiv = param.containerMenuDiv;
            //this.containerMenuDiv.style.display = 'none';
            this.containerMenuDiv.addEventListener("transitionend", () => { this.transitionEnd(this); });

            this.containerMenuDiv.style.display = 'none';
        }
        showMenu (self: BaseMenu) {
            self.containerMenuDiv.style.display = "inline-block";
            self.containerMenuDiv.classList.add("output-div-show");
            self.menuShowing = true;
        }
        hideMenu (self: BaseMenu) {
            self.containerMenuDiv.classList.remove("output-div-show");
        }
        transitionEnd(self: BaseMenu) {
            self.containerMenuDiv.style.display = "none";
            self.menuShowing = false;
        }
    }
    interface ICharacterMenu extends IBaseMenu {
        vitalsDiv: HTMLDivElement;
        craftingDiv: HTMLDivElement;
        inventoryDiv: HTMLDivElement;
        skillsDiv: HTMLDivElement;
        socialDiv: HTMLDivElement;
    }
    class CharacterMenu extends BaseMenu {
        vitalsDiv: HTMLDivElement;
        craftingDiv: HTMLDivElement;
        inventoryDiv: HTMLDivElement;
        skillsDiv: HTMLDivElement;
        socialDiv: HTMLDivElement;

        menuKeys: KeyMap;
        menuMouse: Mouse;

        menuShowing: boolean;

        menuPlayer: MobaIO_Base.Skilled;

        constructor (param: ICharacterMenu) {
            super(param);
            
            // this.menuKeys = new KeyMap(this.characterMenuDiv);
            // // this.menuMouse = new Mouse();

            // this.menuKeys.onKey(27, () => {
            //     this.hideMenu(this);
            // });

            this.vitalsDiv = param.vitalsDiv;
            this.craftingDiv = param.craftingDiv;
            this.inventoryDiv = param.inventoryDiv;
            this.skillsDiv = param.skillsDiv;
            this.socialDiv = param.socialDiv;
            
            this.transitionEnd(this);
        }

        redrawVitals(self: CharacterMenu) {
            let vital = self.menuPlayer.currentVital;
            //self.vitalsDiv.innerHTML = `${vital.hpString}: ${Math.floor(vital.hp)}/${Math.floor(vital.maxHp)}`;
            self.vitalsDiv.innerHTML = `Hit Points: ${Math.floor(vital.current['HP'])}/${Math.floor(vital.max['HP'])}`;
        }

        setPlayer(self: CharacterMenu, player: MobaIO_Base.Skilled) {
            if (player) {
                self.menuPlayer = player;
                self.menuPlayer.currentVital.notifiers.push((currentVital) => {
                    if (self.menuShowing) {
                        self.redrawVitals(self);
                    }
                });
                
            }

        }
        resetPlayer(self: CharacterMenu, player: MobaIO_Base.Skilled) {
            
        }
        showMenu (self: CharacterMenu) {
            BaseMenu.prototype.showMenu(self);
            self.redrawVitals(self);
        }
    }
    interface IOutputDiv extends HTMLDivElement {
        showingDiv: number;
    }
    class OutputDiv {

        private outputDiv: IOutputDiv; // = document.getElementById("outputDiv");// as HTMLDivElement;
        private textDiv: HTMLDivElement; // = document.getElementById("textDiv");
        private outputTime: number;

        constructor(params: { outputDiv: HTMLDivElement, textDiv: HTMLDivElement, outputTime?: number }) {
            this.outputDiv = params.outputDiv as IOutputDiv;
            this.outputDiv.addEventListener("transitionend", () => { this.transitionEnd(this); });
            this.outputDiv.style.display = "none";
            this.textDiv = params.textDiv;
            this.outputTime = params.outputTime || 2000;
        }

        output(text: string) {
            this.textDiv.innerHTML += `${text} <br/>` ;
            this.textDiv.scrollTop = this.textDiv.scrollHeight - this.textDiv.clientHeight;

            if (!this.outputDiv.showingDiv) {
                this.outputDiv.style.display = "inline-block";
                this.outputDiv.classList.add("output-div-show");
                
                //if (!this.outputDiv.showingDiv && this.outputDiv.showingDiv !== 0) 
                //    this.outputDiv.classList.remove("output-div-hide");
                this.outputDiv.showingDiv = performance.now() + this.outputTime;
                this.resetFunction(this);
            }
            else {
                this.outputDiv.showingDiv = performance.now() + this.outputTime;
            }
        }
        private resetFunction(self?) {
            if (!self)
                self = this;
            if (self.outputDiv.showingDiv < performance.now()) {
                self.outputDiv.classList.remove("output-div-show");
                self.outputDiv.showingDiv = 0;
            }
            else {
                let newTime = self.outputDiv.showingDiv - performance.now();
                setTimeout(() => { self.resetFunction(self); }, (newTime > 0 ? newTime : 0) + 5);
            }
        }
        private transitionEnd(self) {
            if (self.outputDiv.showingDiv > 0)
                return;
            self.outputDiv.showingDiv = undefined;
            self.outputDiv.style.display = "none";
        }

    }
    interface ICanvasStack {
    }
    class CanvasStack {
        elevationOffset: number;
        canvas: HTMLCanvasElement;
        context?: CanvasRenderingContext2D;
        drawOffset?: MobaIO_Base.ICoord;

        source?: HTMLCanvasElement;
        sourceContext?: CanvasRenderingContext2D;
        fadeTo?: HTMLCanvasElement;
        fadeToContext?: CanvasRenderingContext2D;
        fadeToOpacity?: number;
        lastOpacity?: number;

        transfer?: HTMLCanvasElement;
        transferContext?: CanvasRenderingContext2D;

        static ResetStackFade(stack: CanvasStack, toColor?) {
            if (!stack.fadeTo) {
                stack.fadeTo = document.createElement('canvas');
                stack.fadeTo.width = stack.source.width;
                stack.fadeTo.height = stack.source.height;
                stack.fadeToContext = stack.fadeTo.getContext("2d");
                stack.fadeToOpacity = 1;
                
                stack.transfer = document.createElement('canvas');
                stack.transfer.width = stack.source.width;
                stack.transfer.height = stack.source.height;
                stack.transferContext = stack.transfer.getContext("2d");

                stack.context = stack.canvas.getContext('2d');
            }

            stack.fadeToContext.save();
            stack.fadeToContext.globalCompositeOperation = 'source-over';
            stack.fadeToContext.globalAlpha = 1;
            stack.fadeToContext.drawImage(stack.source, 0, 0);
            stack.fadeToContext.globalCompositeOperation = 'source-atop';
            stack.fadeToContext.fillStyle = toColor || '#000000';
            stack.fadeToContext.fillRect(0, 0, stack.source.width, stack.source.height);
            stack.fadeToContext.restore();
            stack.transferContext.save();
            stack.transferContext.globalAlpha = 1;
            stack.transferContext.clearRect(0, 0, stack.source.width, stack.source.height);
            stack.transferContext.restore();
            stack.context.save();
            stack.context.globalCompositeOperation = 'source-over';
            stack.context.drawImage(stack.source, 0, 0);
            stack.context.restore();
        }
        static ApplyLighting(applyToStack: CanvasStack, lightingCanvas?: HTMLCanvasElement, lightingOffset?, lightingScale = 1) {
            if (lightingCanvas) {
                applyToStack.transferContext.save();
                applyToStack.transferContext.globalCompositeOperation = 'lighten'; 
                applyToStack.transferContext.scale(lightingScale, lightingScale);
                applyToStack.transferContext.drawImage(lightingCanvas, lightingOffset.x , lightingOffset.y);
                applyToStack.transferContext.restore();
                return;
            }
            applyToStack.fadeToContext.save();
            applyToStack.fadeToContext.globalCompositeOperation = 'destination-out'; 
            applyToStack.fadeToContext.globalAlpha = 1;
            applyToStack.fadeToContext.drawImage(applyToStack.transfer, 0, 0);
            applyToStack.fadeToContext.restore();
            applyToStack.context.save();
            applyToStack.fadeToContext.globalCompositeOperation = 'source-over'; 
            applyToStack.context.globalAlpha = applyToStack.fadeToOpacity;
            applyToStack.context.drawImage(applyToStack.fadeTo, 0, 0);
            applyToStack.context.restore();
        }
    }
    interface IDrawFrame {
        canvasStack: CanvasStack[];
    }
    class DrawFrame {
        fadeable?: boolean;
        surface?: CanvasStack;
        _canvasStack: CanvasStack[] = [];
        canvasCounter: number = 0;
        canvasStack: () => CanvasStack[];

        constructor(param?: IDrawFrame) {
            let i = 0;
            let stack: CanvasStack;
            let self = this;
            this.canvasStack = () => {
                return this._canvasStack;
            };

            // this.canvasStack = () => {
            //     for (i = 0; i < self._canvasStack.length; i++) {
            //         stack = self._canvasStack[i];
            //         if (stack.fadeToOpacity != stack.lastOpacity) {

            //             CanvasStack.ResetStackFade(stack);

            //             stack.context.globalAlpha = 1;
            //             stack.context.drawImage(stack.source, 0, 0);
            //             stack.lastOpacity = stack.fadeToOpacity;
            //             if (stack.fadeToOpacity && stack.fadeTo) {
            //                 stack.context.globalAlpha = stack.fadeToOpacity;
            //                 stack.context.drawImage(stack.fadeTo, 0, 0);
            //             }
            //         }
            //     }
            //     return self._canvasStack;
            // };           
            if (param) {
                param.canvasStack.forEach((eachCanvasStack) => {
                    this._canvasStack.push(eachCanvasStack);
                });
            }
            else {
                this._canvasStack = [ { elevationOffset: 0, source: document.createElement('canvas'), canvas: document.createElement('canvas') } ];
                this._canvasStack[0].canvas.height = this._canvasStack[0].canvas.width = 96;
            }
            this.getContexts();
        }

        getContexts () { // Too much GC?
            let contexts: CanvasRenderingContext2D[] = [];
            this._canvasStack.forEach((eachCanvasStack) => {
                eachCanvasStack.sourceContext = eachCanvasStack.source.getContext('2d');
                contexts.push(eachCanvasStack.context = eachCanvasStack.canvas.getContext('2d'));
            });
            return contexts;
        }
        setDrawSize (newSize: MobaIO_Base.ICoord, stackNumber = 1): CanvasRenderingContext2D {
            this.resetStack(stackNumber, newSize);
            this.getContexts();
            return (stackNumber === 1 ? this._canvasStack[0].sourceContext : this._canvasStack.map((eachStack) => { return eachStack.sourceContext; })) as any;
        }

        makeText (text: string, style?: string | CanvasGradient | CanvasPattern, size?: MobaIO_Base.ICoord) {
            this.setDrawSize(size || { x: 150, y: 50 });
            let ctx = this._canvasStack[0].context;
            ctx.textAlign = "center"
            ctx.strokeStyle = "#909090";
            ctx.lineWidth = 1.5;
            ctx.strokeText(text || "", 75, 25);
            ctx.fillStyle = style || "#000000";
            ctx.lineWidth = 0;
            ctx.fillText(text || "", 75, 25);
            
            return this;
        }
        makeCircle (style?: string | CanvasGradient | CanvasPattern, size?: number, lineWidth?: number, fill?: boolean ) {
            if (!size) 
                size = 16;
            if (!lineWidth)
                lineWidth = 3;
            if (!style)
                style = "#909090";
            this.setDrawSize({x: size, y: size });
            let ctx = this._canvasStack[0].context;
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.strokeStyle = style;
            ctx.lineWidth = lineWidth;
            ctx.arc(size / 2, size / 2, size / 2 - lineWidth / 2, 0, 2*Math.PI);
            ctx.stroke();
            if (fill) {
                ctx.fillStyle = style;
                ctx.arc(size / 2, size / 2, size / 2 - lineWidth / 2, 0, 2*Math.PI);
                ctx.fill();
            }
            return this;
        }
        makeLightSource (forLightSource: MobaIO_Base.LightSource) {
            this.setDrawSize({ x: forLightSource.scaleSizeD, y: forLightSource.scaleSizeD });
            let ctx = this._canvasStack[0].context;
            let alpha = 0;
            ctx.globalCompositeOperation = 'source-over';
            alpha = (1 / ((forLightSource.scaleEdgeR) - forLightSource.scaleCenterR)) * (forLightSource.illumination / 100);
            ctx.globalAlpha = alpha >= 0 ? alpha <= 100 ? alpha : 100 : 0;
            for (let r = forLightSource.scaleEdgeR; r > forLightSource.scaleCenterR; r--) {
                ctx.beginPath();
                ctx.fillStyle = '#fff';
                ctx.arc(forLightSource.scaleSizeR, forLightSource.scaleSizeR, r, 0, 2*Math.PI);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.arc(forLightSource.scaleSizeR, forLightSource.scaleSizeR, forLightSource.scaleEdgeR, 0, 2*Math.PI);
            ctx.fill();
            return this;
        }
        updateLightSource (forLightSource: MobaIO_Base.LightSource) {

        }
        makeGuage (size?: MobaIO_Base.ICoord, style?: string | CanvasGradient | CanvasPattern ): CanvasRenderingContext2D {
            this.resetStack(2, size, 10000);
            let ctx = this._canvasStack[0].context;

            ctx.beginPath();
            ctx.fillStyle = style || "#909090";
            ctx.fillRect(0,0,size.x, size.y);
            ctx.stroke();
            
            ctx = this._canvasStack[1].context;
            ctx.beginPath();
            ctx.fillStyle = "#009000";
            ctx.fillRect(0,0,size.x, size.y);
            ctx.stroke();
            return this._canvasStack[1].context;
        }
        resetStack (canvasNumber?: number, size?: MobaIO_Base.ICoord, elevationOffset?: number) {
            if (!canvasNumber || canvasNumber < 1)
                canvasNumber = 1;
            if (!size)
                size = { x: 72, y: 72 };
            this._canvasStack = [];
            let stack: CanvasStack;
            for (this.canvasCounter = 0; this.canvasCounter < canvasNumber; this.canvasCounter++) {
                stack = { 
                    fadeToOpacity: 0,
                    elevationOffset: this.canvasCounter + (elevationOffset || 0),
                    source: document.createElement('canvas'),
                    canvas: document.createElement('canvas')
                };
                stack.canvas.width = size.x;
                stack.canvas.height = size.y;
                stack.context = stack.canvas.getContext("2d");
                stack.source.width = size.x;
                stack.source.height = size.y;
                stack.sourceContext = stack.source.getContext("2d");
                this._canvasStack.push(stack);
            }
        }

        setFadeables(toOpacity?: number, toColor?: string, illuminatorsIdKeys?, illuminators?) {
            this.fadeable = true;
            let stack: CanvasStack;
            for (let canvasCounter = 0; canvasCounter < this._canvasStack.length; canvasCounter++) {
                stack = this._canvasStack[canvasCounter];
                stack.fadeToOpacity = toOpacity || stack.fadeToOpacity;
            }
            return;
        }
    }
    interface IAnimation {
        frameStack?: DrawFrame[];
        totalFrames?: number;
        distanceMod?: number;
    }
    class Animation {
        frameStack: DrawFrame[] = [];
        frameTo: number[] = [];
        currentFrame: number = 0;
        totalFrames: number;
        animationFrames?: number;
        currentStack: number = 0;
        distanceMod: number;
        constructor (param?: IAnimation) {
            if (!param) {
                this.frameStack = [ new DrawFrame().makeCircle("#a0a0a0"), new DrawFrame().makeCircle("#000000") ];
                this.totalFrames = 2;
                this.distanceMod = 1;
                return
            }
            this.frameStack = param.frameStack;
            this.totalFrames = param.totalFrames || this.frameStack.length;
            if (this.totalFrames == 4) {
                this.animationFrames = 4;
            }
            else {
                this.animationFrames = this.totalFrames - 1;
            }
            this.distanceMod = param.distanceMod || 1;

        }

        gameFrame () {
            this.currentFrame = (this.currentFrame + 1) % this.animationFrames;
            this.setStack();
        }
        setFrame (toFrameNumber: number) {
            this.currentFrame = toFrameNumber;
            this.setStack();
        }
        setStack () {
            // Use logic to determine which drawable!

            // For now, just split each frame
            this.currentStack = Math.floor(this.currentFrame / 1);
        }
        incrementDistance (distance: number) {

        }
        canvasStack(): CanvasStack[] { 
            return this.frameStack[this.currentStack].canvasStack();
        }
        setFadeables(toOpacity?: number, toColor?: string, illuminatorsIdKeys?, illuminators?) {
            // For each frame, set its fadeables!
            for (let i = 0; i < this.totalFrames; i++) {
                this.frameStack[i].setFadeables(toOpacity, toColor, illuminatorsIdKeys, illuminators);
            }
        }
    }
    interface IDirectionalAnimation {
        animations?: Animation[];
        animated?: MobaIO_Base.Movable;
        totalFrames?: number;
        distanceMod?: number;
        directions?: number;
    }
    class DirectionalAnimation {
        animations: Animation[] = [];
        currentAnimation: number = 0;
        animated?: MobaIO_Base.Movable;
        currentFrame?: number;
        totalFrames?: number;
        animationFrames?: number;
        directions: number;
        distanceMod?: number;
        distanceFrame?: number;
        constructor (param?: IDirectionalAnimation) {
            this.currentFrame = 0;
            this.distanceFrame = 0;
            this.directions = (param ? param.directions || 8 : 8);
            if (!param || !param.animations) {
                this.animations = param ? param.animations || [] : [];

                for (let i=0; i < this.directions; i++)
                    this.animations[i] = new Animation();
                
                this.animationFrames = (this.totalFrames = this.animations[0].totalFrames) - 1;
                this.distanceMod = this.animations[0].distanceMod;
                return;
            }
            this.animations = param.animations;

            if (param.animated) {
                this.animated = param.animated;
                this.animated.trackMe({ 
                    callbackFn: (tracker, tracked) => {
                        // Feed the animation!
                    }
                });
            }
            this.totalFrames = param.totalFrames || 1;
            if (param.totalFrames == 4) {
                this.animationFrames = 4;
            }
            else {
                this.animationFrames = this.totalFrames - 1;
            }
            this.distanceMod = param.distanceMod || 1;
        }

        gameFrame () {
            this.currentFrame = (this.currentFrame + 1) % this.animationFrames;
            this.animations[this.currentAnimation].setFrame(this.currentFrame);
        }
        incrementDistance (distance: number) {
            this.currentFrame = Math.floor(
                this.distanceFrame = ((this.distanceFrame + (distance / this.distanceMod) ) % (this.animationFrames)));
            
            this.animations[this.currentAnimation].setFrame(this.currentFrame);
            //console.log(`Current Frame: ${this.currentFrame}, Distance: ${this.distanceFrame}`);
        }
        idle() {
            this.animations[this.currentAnimation].setFrame(this.totalFrames - 1);
        }
        canvasStack(): CanvasStack[] {
            return this.animations[this.currentAnimation].canvasStack();
        }
        setFadeables(toOpacity?: number, toColor?: string, illuminatorsIdKeys?, illuminators?) {
            // For each direction, set its fadeables!
            for (let i = 0; i < this.directions; i++) {
                this.animations[i].setFadeables(toOpacity, toColor, illuminatorsIdKeys, illuminators);
            }
        }
    }
    interface ICharacterAnimation {
        walkAnimation?: DirectionalAnimation;
        linkTo?: MobaIO_Base.Unit;

    }
    class CharacterAnimation {
        actionAnimations: DirectionalAnimation[] = [];
        currentAction: number = 0;

        constructor (param?: ICharacterAnimation) {
            if (!param) {
                this.actionAnimations[0] = new DirectionalAnimation();
                return;
            }

            this.actionAnimations[0] = param.walkAnimation || new DirectionalAnimation();
        }

        linkUnit (unit: MobaIO_Base.Unit) {
            let self = this;
            if (unit.trackMe) {
                let walkAnimation = self.actionAnimations[0];
                let directionAngle = 360 / walkAnimation.directions;
                let offsetAngle = 360 + (directionAngle / 2);
                unit.trackMe({
                    callbackFn: (tracker, tracked, distance) => {

                        walkAnimation.currentAnimation = Math.floor(((unit.facing.angle + offsetAngle) % 360) / directionAngle);
                        //walkAnimation.gameFrame();
                        walkAnimation.incrementDistance(distance / unit.scale);
                    },
                    stopFn: (tracker, tracked) => {
                        //walkAnimation.currentFrame = walkAnimation.distanceFrame = walkAnimation.totalFrames - 1;
                        walkAnimation.idle();
                    },
                    trackTolerance: walkAnimation.distanceMod * unit.scale
                });
            }
        }

        canvasStack(): CanvasStack[] {
            return this.actionAnimations[this.currentAction].canvasStack();
        }
        setFadeables(toOpacity?: number, toColor?: string, illuminatorsIdKeys?, illuminators?) {
            // For each directional animation, set its fadeables!
            for (let i = 0; i < this.actionAnimations.length; i++) {
                this.actionAnimations[i].setFadeables(toOpacity, toColor, illuminatorsIdKeys, illuminators);
            }
        }
    }
    interface IDrawable {
        drawFrame?: DrawFrame;
        animation?: Animation;
        character?: CharacterAnimation;
        drawable?: Drawable;
        fadable?: boolean;
    }
    class Drawable {
        illuminatorsIdKeys: string[];
        illuminators: any;
        character?: CharacterAnimation;
        animation?: Animation;
        drawFrame?: DrawFrame;
        imageSet?: { [ setIndex : number ]: Drawable };
        canvasStack: () => CanvasStack[] = (() => {
            return this.drawFrame.canvasStack();
        });

        constructor(param?: IDrawable) {
            if (!param) {
                this.drawFrame = new DrawFrame();
                return;
            }
            if (param.drawFrame) {
                this.drawFrame = param.drawFrame;
                return;
            }
            
            if (param.animation) {
                this.animation = param.animation;
                this.canvasStack = (() => {
                    return this.animation.canvasStack();
                });
                return;
            }
            if (param.character) {
                this.character = param.character;
                this.canvasStack = (() => {
                    return this.character.canvasStack();
                });
                return;
            }

        }
        
        makeCharacterSheet(param: { fileName: string, size: number, frames: number, directions: number, distanceMod: number, callbackFn?: () => any }) {
            if (!this.drawFrame || !param.fileName)
                return;
            
            this.drawFrame = undefined;
            let aliasCharacter = this.character = new CharacterAnimation();
            aliasCharacter.actionAnimations[0] = new DirectionalAnimation({ directions: param.directions });
            let loadImg = new Image();
            loadImg.onload = () => {
                console.log("Loaded a character sheet bmp!");
                var aliasAction = aliasCharacter.actionAnimations[0];
                aliasAction.totalFrames = param.frames;
                aliasAction.distanceMod = param.distanceMod;
                aliasAction.directions = param.directions;  
                aliasAction.animations = aliasAction.animations.map((eachAnimation, whichAnimation) => {
                    return new Animation({
                        frameStack: (() => {
                            let stack: DrawFrame[] = [];
                            let size = param.size;
                            for (let eachFrameIndex = 0; eachFrameIndex < param.frames; eachFrameIndex++) { //17 includes idle frame
                                let drawFrame = new DrawFrame();
                                drawFrame.setDrawSize({ x: size, y: size });
                                drawFrame._canvasStack[0].sourceContext.drawImage(loadImg,
                                    eachFrameIndex * size, // X from spriteSheet
                                    whichAnimation * size, // Y from spriteSheet
                                    size,size,
                                    0,0,
                                    size,size);

                                //drawFrame.makeText(`${eachFrameIndex}`);
                                stack.push(drawFrame);
                            }
                            return stack;
                        })(),
                        totalFrames: param.frames,
                        distanceMod: param.distanceMod
                    });
                });
                if (param.callbackFn)
                    param.callbackFn();
            };
            loadImg.src = param.fileName;

            this.canvasStack = () => {
                return this.character.canvasStack();
            };
                       
            return this;
        }
        makeImage(param: { fileName: string, callbackFn?: () => any }) {
            if (!this.drawFrame || !param.fileName)
                return;
            
            let loadImg = new Image();
            loadImg.onload = () => {
                let aliasContext = this.setDrawSize({ x: loadImg.width, y: loadImg.height });
                aliasContext.drawImage(loadImg, 0, 0);
                if (param.callbackFn)
                    param.callbackFn();
            }
            loadImg.src = param.fileName;

            return this;
        }
        makeImageStack(param: { fileNames: string[], elevationOffsets?: number[], callbackFn?: () => any }) {
            if (!this.drawFrame || !param.fileNames || !param.fileNames.length)
                return;
            
            let callbacksLeft = param.fileNames.length;
            let localCallback = () => {
                callbacksLeft--;
                if (callbacksLeft <= 0) {
                    param.callbackFn();
                }
            }

            let aliasContexts: CanvasRenderingContext2D[];

            for (let eachFilenameIndex = 0; eachFilenameIndex < param.fileNames.length; eachFilenameIndex++) {
                let loadImg = new Image();
                loadImg.onload = () => {
                    if (!aliasContexts) {
                        this.setDrawSize({ x: loadImg.width, y: loadImg.height }, param.fileNames.length);
                        aliasContexts = this.drawFrame._canvasStack.map((eachStack) => { return eachStack.context; });
                    }
                    let aliasContext = aliasContexts[eachFilenameIndex];
                    aliasContext.drawImage(loadImg, 0, 0);
                    localCallback();
                }
                loadImg.src = param.fileNames[eachFilenameIndex];
            }

            return this;
        }
        makeImageSet(param: { fileName: string, setFileName: string, callbackFn?: () => any }) {
            if (!this.drawFrame || !param.fileName || !param.setFileName)
                return;
            this.drawFrame = undefined;
            
            let loadImg = new Image();
            loadImg.onload = async () => {
                let req = new XMLHttpRequest();
                req.open('GET', param.setFileName);
                req.onreadystatechange = async () => {
                    if (req.readyState == 4) {
                        req.onreadystatechange = null;
                        if (req.status == 200) {
                            
                            this.parseImageSet(loadImg, JSON.parse(req.response).clips);

                            if (param.callbackFn)
                                param.callbackFn();
                        }
                    }
                };
                req.send();
            };
            loadImg.src = param.fileName;

            this.canvasStack = (() => {
                let returnStack = Object.keys(this.imageSet).map((eachSetIndex) => {
                    return this.imageSet[eachSetIndex].canvasStack();
                }).reduce((stackArray, eachStackArray) => {
                    stackArray = stackArray.concat(eachStackArray);
                    return stackArray;
                }, []);
                return returnStack;
            });
            
            return this;
        }
        parseImageSet(sourceImage: HTMLImageElement, setData: { drawablesSet: string, left: number, top: number, width: number, height: number }[]) {
            this.imageSet = {};
            for (let eachData of setData) {
                this.imageSet[eachData.drawablesSet] = new Drawable();
                let imageSetContext: CanvasRenderingContext2D = this.imageSet[eachData.drawablesSet].setDrawSize({ x: eachData.width, y: eachData.height });
                imageSetContext.drawImage(sourceImage, eachData.left, eachData.top, eachData.width, eachData.height, 0, 0, eachData.width, eachData.height);
            }
        }
        makeText (param: { text: string, style?: string | CanvasGradient | CanvasPattern, size?: MobaIO_Base.ICoord }) {
            if (!this.drawFrame)
                return;
            this.drawFrame.makeText(param.text, param.style, param.size);

            return this;
        }
        makeCircle (param: { style?: string | CanvasGradient | CanvasPattern, size?: number, lineWidth?: number, blur?: number, fill?: boolean } ) {
            if (!this.drawFrame)
                return;

            this.drawFrame.makeCircle(param.style, param.size, param.lineWidth, param.fill);

            return this;
        }
        makeLightSource (forLightSource: MobaIO_Base.LightSource) {
            if (!this.drawFrame)
                return;

            this.drawFrame.makeLightSource(forLightSource);        
        }
        makeGuage (param: { size: MobaIO_Base.ICoord, backgroundStyle?: string | CanvasGradient | CanvasPattern }): CanvasRenderingContext2D {
            if (!this.drawFrame)
                return;
            return this.drawFrame.makeGuage(param.size, param.backgroundStyle);
        }
        setFadeables(toOpacity?: number, toColor?: string) {
            if (this.drawFrame) {
                this.drawFrame.setFadeables(toOpacity, toColor);
            }
            if (this.character) {
                this.character.setFadeables(toOpacity, toColor);
            }
        }
        setDrawSize (newSize: MobaIO_Base.ICoord, stackNumber?: number) {
            if (!this.drawFrame) 
                return;
            
            return this.drawFrame.setDrawSize(newSize, stackNumber);

        }
        static makeNewDrawFrame (drawable: Drawable): Drawable {
            if (!drawable.drawFrame) {
                return drawable;
            }
            return new Drawable({
                drawFrame: new DrawFrame({
                    canvasStack: drawable.drawFrame._canvasStack.map((eachStack) => {
                        return {
                            drawOffset: eachStack.drawOffset,
                            elevationOffset: eachStack.elevationOffset,
                            source: eachStack.source,
                            canvas: (() => { 
                                let canvas = document.createElement('canvas');
                                canvas.height = eachStack.source.height;
                                canvas.width = eachStack.source.width;
                                return canvas;
                            })()
                        } as CanvasStack;
                    })
                })
            });
        }
        static makeNewCharacterAnimation (drawable: Drawable): Drawable {
            if (!drawable.character) {
                return drawable;
            }

            let newDrawable = new Drawable({
                character: new CharacterAnimation({
                    walkAnimation: new DirectionalAnimation({
                        animations: drawable.character.actionAnimations[0].animations.map((eachAnimation) => {
                            return new Animation({
                                frameStack: (() => {
                                    return eachAnimation.frameStack.map((eachDrawFrame) => {
                                        let newDrawFrame = new DrawFrame({
                                            canvasStack: (() => {
                                                return eachDrawFrame._canvasStack.map((eachStack) => {
                                                    let mappedStack = {
                                                        drawOffset: eachStack.drawOffset,
                                                        elevationOffset: eachStack.elevationOffset,
                                                        source: eachStack.source,
                                                        canvas: (() => { 
                                                            let canvas = document.createElement('canvas');
                                                            canvas.height = eachStack.source.height;
                                                            canvas.width = eachStack.source.width;
                                                            return canvas;
                                                        })()
                                                    } as CanvasStack;
                                                    CanvasStack.ResetStackFade(mappedStack);
                                                    return mappedStack;
                                                });
                                            })()
                                        });
                                        return newDrawFrame;
                                    });
                                    
                                })(),
                                totalFrames: eachAnimation.totalFrames,
                                    distanceMod: eachAnimation.distanceMod,
                                })
                        }),
                        directions: drawable.character.actionAnimations[0].directions,
                        totalFrames: drawable.character.actionAnimations[0].totalFrames,
                        distanceMod: drawable.character.actionAnimations[0].distanceMod
                    })
                })
            });

            return newDrawable;
        }

    }
    interface IDrawnMapFeature extends MobaIO_Base.IMapFeature {
        drawables?: Drawable;
        color?: string;
        opacity?: number;
        zOrder?: number;
    }
    class DrawnMapFeature extends MobaIO_Base.VisibleMapFeature {
        currentVital?: MobaIO_Base.Vitals;
        drawables: Drawable;
        guages?: Guage[];
        opacity: number = 1;
        color?: string;
        zOrder: number = 0;
        reIlluminated?: boolean;
        static theColors = [
            "#000000",
            "#ff0000",
            "#00ff00",
            "#0000ff",
            "#ff00ff",
            "#00ffff",
            "#ffff00",
            "#888888"
        ];
        constructor(params: IDrawnMapFeature) {
            super(params);
            this.drawables = params.drawables;
            this.color = params.color;
            this.opacity = params.opacity || 1;
            this.zOrder = params.zOrder;
        }
        static makeDrawn<T>(feature: T & MobaIO_Base.VisibleMapFeature, drawables?: Drawable): T & DrawnMapFeature {
            let drawnFeature: DrawnMapFeature & T & MobaIO_Base.VisibleMapFeature = feature as any;
            if (drawnFeature.drawables) 
                return;

            drawnFeature.opacity = 1;
            drawnFeature.drawables = drawables || new Drawable();

            if ((drawnFeature as any).luminance >= 0) {
                drawnFeature.drawables.setFadeables(0, '#000000');
                drawnFeature.adjustLuminance = (asyncDrawnFeature: DrawnMapFeature & T & MobaIO_Base.VisibleMapFeature) => {
                    MobaIO_Base.VisibleMapFeature.prototype.adjustLuminance(asyncDrawnFeature);
                    asyncDrawnFeature.drawables.setFadeables(1 - (asyncDrawnFeature.bathedLuminance / 100));
                };
                drawnFeature.adjustLuminance(drawnFeature);
            }

            if (drawnFeature.drawables.character) {
                drawnFeature.drawables.character.linkUnit(drawnFeature as any);
            }

            if ((drawnFeature as any).illumination >= 0) {
                // Special case here, need to draw an alpha channel mask for floor surface
                // (<MobaIO_Base.LightSource>(drawnFeature as any)).setIlluminator = (physicalObject: MobaIO_Base.PhysicalObject, adjustedLuminance: number, illuminator: MobaIO_Base.LightSource) => {
                //     if (physicalObject.illuminators[illuminator.trackingId] == undefined) {
                //         physicalObject.illuminatorsIdKeys.push(`${illuminator.trackingId}`);
                //         physicalObject.illuminators[illuminator.trackingId] = {
                //             illumination: adjustedLuminance,
                //             casting: physicalObject.scaleSizeD > illuminator.scaleSizeD,
                //             inFront: physicalObject.mapPos.y < illuminator.mapPos.y,
                //             lastMapPos: { x: illuminator.mapPos.x, y: illuminator.mapPos.y },
                //             changed: true
                //         }
                //     } else {
                //         physicalObject.illuminators[illuminator.trackingId].illumination= adjustedLuminance;
                //         physicalObject.illuminators[illuminator.trackingId].casting = physicalObject.scaleSizeD > illuminator.scaleSizeD;
                //         if (illuminator.mapPos.distanceTo(physicalObject.illuminators[illuminator.trackingId].lastMapPos) > 1) {
                //             physicalObject.illuminators[illuminator.trackingId].inFront = physicalObject.mapPos.y < illuminator.mapPos.y;
        
                //             physicalObject.illuminators[illuminator.trackingId].lastMapPos.x = illuminator.mapPos.x;
                //             physicalObject.illuminators[illuminator.trackingId].lastMapPos.y = illuminator.mapPos.y;
                //             physicalObject.illuminators[illuminator.trackingId].changed = true;
                //         }
                //     }
                // };
                drawnFeature.drawables = new Drawable();
                drawnFeature.drawables.makeLightSource(drawnFeature as any);
            }
            if ((drawnFeature as any).lightSource) {
                DrawnMapFeature.makeDrawn((drawnFeature as any).lightSource);
            }
            // if (drawnFeature.currentVital) {
            //     // Create Hp/Mp guages
            //     drawnFeature.guages = [
            //         new Guage({ 
            //             //attachTo: drawnFeature as any,
            //             mapPos: new mobaIO_base.Coord(drawnFeature.mapPos),
            //             size: { x: 100, y: 10 },
                        
            //         })
            //     ];
            //     drawnFeature.guages[0].attach(drawnFeature as any, { x: 0 , y: 0 });
            //     drawnFeature.guages[0].attachOffset = { x: 0, y: - 100 };
            // }

            drawnFeature.zOrder = 0;
            return drawnFeature;
        }
        adjustOpacity (opacityAmount: number) {
                
            let opacity = this.opacity += opacityAmount;
            if (opacity < .01)
                opacity = .01;
            if (opacity > 1)
                opacity = 1;
            return opacity;
            
        }
    }
    interface IParticle extends MobaIO_Base.IMovable, IDrawnMapFeature {
        active: boolean;
        momentum?: MobaIO_Base.Momentum;
        expires?: number;
        scaleSpeed?: number;
        rotationSpeed?: number;
        style?: string;
        text?: string;
        opacity?: number;
        opacitySpeed?: number;
        useElevation?: boolean;
        elevationSpeed?: number;
        attachTo?: MobaIO_Base.Movable;
        attachOffset?: MobaIO_Base.ICoord;
    }
    class Particle extends MobaIO_Base.Movable implements MobaIO_Base.MapFeature {
        drawables: Drawable;
        expires: number;
        tempStyle: string;
        rotateSpeed: number;
        scaleSpeed: number;
        opacity: number;
        opacitySpeed: number;
        elevationSpeed: number;
        zOrder: number;
        useElevation: boolean;
        attached: boolean;
        attachedTo?: MobaIO_Base.MapFeature;
        attachOffset?: MobaIO_Base.ICoord;
        adjustOpacity = DrawnMapFeature.prototype.adjustOpacity;
        constructor (params: IParticle) {
            super(params);
            this.mapPos = new MobaIO_Base.Coord(params.mapPos);
            this.momentum = params.momentum || new MobaIO_Base.Momentum({ angle: Math.random() * 360, velocity: Math.random() * 5 + 1 });
            this.expires = params.expires || 60;
            this.scale = params.scale || 1;
            this.scaleSpeed = params.scaleSpeed || 0;
            this.rotation = params.rotation || 0;
            this.rotateSpeed = params.rotationSpeed || 0;
            this.opacity = params.opacity || 1;
            this.opacitySpeed = params.opacitySpeed || 0;
            this.zOrder = 0;
            this.useElevation = params.useElevation;
            this.elevationSpeed = params.elevationSpeed || 0;
            
            this.attached = false;
            if (params.attachTo)
                this.attachTo(params.attachTo as MobaIO_Base.Movable);

            // set this particles drawables!
            if (!params.drawables) {
                // draw a circle for the drawable!
                this.drawables = new Drawable();

                this.drawables.makeCircle({ style: params.style });

                //this.drawables.floorContext.beginPath();
                //this.drawables.floorContext.strokeStyle = params.style || "#909090";
                //this.drawables.floorContext.lineWidth = 1;
                //this.drawables.floorContext.arc(10, 10,4,0,2*Math.PI);;
                //this.drawables.floorContext.stroke();

            }
            else {
                this.drawables = params.drawables;
            }
        }

        gameFrame (): boolean {
            this.expires--;

            this.adjustRotate(this.rotateSpeed);
            this.adjustScale(this.scaleSpeed);
            let opacity = this.adjustOpacity(this.opacitySpeed);
            //this.adjustElevation(this.elevationSpeed);
            
            if (!this.useElevation)
                this.elevation += Math.floor((1 - opacity) * 10);
            else 
                this.adjustElevation(this.elevationSpeed);
            
            if (!this.attached)
                this.mapPos.translate(this.momentum.delta);
            
            if (this.expires < 1) {
                // expire this particle!
                return false;
            }
            return true;
        }
        attachTo (target: MobaIO_Base.Movable, offset?: MobaIO_Base.ICoord) {
            let self: Particle = this;
            
            self.attachedTo = target;
            self.attachOffset = { x: offset.x || 0, y: offset.y || 0 };

            target.trackMe({
                callbackFn: (tracker: MobaIO_Base.Movable, tracked: MobaIO_Base.Movable) => {
                    tracker.mapPos.x = tracked.mapPos.x + self.attachOffset.x;
                    tracker.mapPos.y = tracked.mapPos.y + self.attachOffset.y;
                },
                stopFn: null,
                tracker: self as any,
                trackTolerance: 1
            });
        }
    }
    interface IEmitter extends MobaIO_Base.IMovable {
    }
    class Emitter extends MobaIO_Base.Movable {
        particles: Particle[];
        constructor(params: IEmitter) {
            super(params);
        }
    }
    class Guage extends Particle {
        guageContext: CanvasRenderingContext2D;

        constructor (params: IParticle) {
            super(params);
            
            if (!params.drawables) {
                // draw !
                this.drawables = new Drawable();
                this.guageContext = this.drawables.makeGuage({ size: this.size, backgroundStyle: '#000000' });
            }
            else {
                this.drawables = params.drawables;
            }
            
            if (params.attachTo)
                this.attachTo(this.attachedTo = params.attachTo as any, { x: 0, y: 0 });
        }

        gameFrame (): boolean {
            if (this.attachedTo && (this.attachedTo as MobaIO_Base.Unit).currentVital.current['HP'] < 0) {
                // Turn this guage into a particle and fade it out!
                this.gameFrame = Particle.prototype.gameFrame;
                this.expires = 120;
                this.opacitySpeed = -1/120;
                this.momentum = new MobaIO_Base.Momentum();
            }
            else {

                //this.adjustGuage((this.attachedTo as mobaIO_base.Unit).currentVital.hp / (this.attachedTo as mobaIO_base.Unit).currentVital.maxHp );
            }
            
            return true;
        }
        
        adjustGuage (atPercent: number, toPercent?: number) {
            this.guageContext.clearRect(this.size.x * (atPercent ), 0, this.size.x, this.size.y);
            this.guageContext.fillRect(0, 0, this.size.x * (atPercent ), this.size.y);
        }
    }
    interface IWorldClient extends MobaIO_Base.IWorld {
        useCamera?: Camera;
        drawables: Drawable;
        useGame: ClientMobaIO_Game; 
    }
    export class World extends MobaIO_Base.World {
        _addAmbient;
        _addFeature;
        _addUnit;
        _addNewFeature;
        _addNewMinion;
        _addNewHero;
        drawables: Drawable;
        featureFactory: IDrawableFeatureFactory;
        highlighter: { [index: string]: Drawable } = { 
            "white": new Drawable().makeCircle({ style: "#ffffff", size: 100, lineWidth: 1 }),
            "red": new Drawable().makeCircle({ style: "#ff0000", size: 100, lineWidth: 1 }),
            "green": new Drawable().makeCircle({ style: "#00ff00", size: 100, lineWidth: 1 }),
            "blue": new Drawable().makeCircle({ style: "#0000ff", size: 100, lineWidth: 1 }),
            "black": new Drawable().makeCircle({ style: "#000000", size: 100, lineWidth: 1 }),
            "yellow": new Drawable().makeCircle({ style: "#ffff00", size: 100, lineWidth: 1 })
        };
        public game?: ClientMobaIO_Game;
        public particles: Particle[] = [];

        constructor(params: IWorldClient) {
            super(params as MobaIO_Base.IWorld);
            this._addAmbient = MobaIO_Base.World.prototype.addAmbient;
            this._addFeature = MobaIO_Base.World.prototype.addFeature;
            this._addUnit = MobaIO_Base.World.prototype.addUnit;
            this._addNewFeature = MobaIO_Base.World.prototype.addNewFeature;

            this.game = params.useGame;

            // Set up this worlds lighting
            this.drawables = params.drawables || new Drawable();
            CanvasStack.ResetStackFade(this.drawables.canvasStack()[0]);
            this.drawables.setFadeables(0, '#000000');

            let worldCanvasStack = this.drawables.canvasStack()[0];
            worldCanvasStack.context.fillStyle = '#000';
            worldCanvasStack.context.fillRect(0, 0, worldCanvasStack.canvas.width, worldCanvasStack.canvas.height);
            this.setLuminance = (toLuminance: number) => {
                this.luminance = toLuminance;
                this.drawables.setFadeables(1 - (toLuminance / 100));
            }

            if (params.useCamera) {
                params.useCamera.currentWorld = this;
            }
        }

        doParticles() {
            let particleIndex;
            let particleLength = this.particles.length;
            let particle: Particle;
            for (particleIndex = 0; particleIndex < particleLength; particleIndex++) {
                particle = this.particles[particleIndex];
                if (particle.active && !particle.gameFrame()) {
                    particle.active = false;
                    MobaIO_Base.Trackable.unRegister(particle, this);
                }
            }
        }
        gameFrame (self?) {
            if (!self)
                self = this;
            
            MobaIO_Base.World.prototype.gameFrame(self);

            let activityLength = self.activities.length;
            let eachData;
            for (let activityIndex = 0; activityIndex < activityLength; activityIndex++) {
                eachData = self.activities[activityIndex];
                if (!eachData.active) {
                    break;
                }
                eachData.active = false;
                self.addParticle({
                    mapPos: new MobaIO_Base.Coord(eachData.unit.mapPos).translate({ x: 0, y: 0}), 
                    expires: 120, 
                    style: "#ff0000", 
                    momentum: new MobaIO_Base.Momentum({ angle: 270, velocity: .3 }), 
                    text: eachData.text,
                    scale: .75,
                    opacity: 3,
                    opacitySpeed: -1/40,
                    elevation: 5000,
                    active: true
                } as IParticle);
            }
        }
        addParticle(param: IParticle & Particle): Particle {
            let pushParticle = param.gameFrame ? param as Particle: new Particle(param);
            if (param.text) {
                pushParticle.drawables.makeText({ text: param.text });
            }
            return this.pushParticle(pushParticle);
        }
        pushParticle(particle: Particle) {
            let particleIndex;
            let particleLength = this.particles.length;
            particle.active = true;
            for (particleIndex = 0; particleIndex < particleLength; particleIndex++) {
                if (!this.particles[particleIndex] || !this.particles[particleIndex].active) {
                    return this.particles[particleIndex] = particle;
                }
            }
            this.particles.push(particle);          
        }
        addAmbient(ambient: MobaIO_Base.Ambient, attachTo?: MobaIO_Base.Movable): MobaIO_Base.Ambient {
            this._addAmbient(ambient, attachTo);
            return ambient;
        }
        addFeature<T>(feature: T & DrawnMapFeature) {
            this._addFeature(feature);
            return feature;
        }
        addUnit<T>(unit: T & MobaIO_Base.Unit & DrawnMapFeature) {
            this._addUnit(unit);
            return unit;
        }
        addNewFeature<T>(featureParam: T & IDrawnMapFeature, constructorModule = MobaIO_Base): T & DrawnMapFeature {
            // Consider adding functionality to this array!
            let newFeature: T & DrawnMapFeature = new constructorModule[featureParam.constructorKey || "MapFeature"](featureParam);
            if (!featureParam.drawables && featureParam.drawablesName) {
                featureParam.drawables = this.game.findDrawable(featureParam.drawablesName);
                if (featureParam.drawablesSet) {
                    featureParam.drawables = featureParam.drawables.imageSet[featureParam.drawablesSet];
                }
            }
            newFeature = DrawnMapFeature.makeDrawn(newFeature as any, featureParam.drawables);
            this.addFeature(newFeature);
            return newFeature;
        }
        addNewUnit<T>(unitParam: T & MobaIO_Base.Unit & IDrawnMapFeature, constructorModule = MobaIO_Base): T & MobaIO_Base.Unit & DrawnMapFeature {
            // Consider adding functionality to this array!
            let newUnit: T & MobaIO_Base.Unit & DrawnMapFeature = new constructorModule[unitParam.constructorKey || "Unit"](unitParam);
            if (!unitParam.drawables && unitParam.drawablesName) {
                unitParam.drawables = this.game.findDrawable(unitParam.drawablesName, true);
            }
            newUnit = DrawnMapFeature.makeDrawn(newUnit, unitParam.drawables);
            newUnit.drawables.setFadeables(1 - (newUnit.bathedLuminance / 100));

            newUnit = this.addUnit(newUnit);

            let newUnitGuage = new Guage({
                mapPos: new MobaIO_Base.Coord().newTranslatedCoord({ x: newUnit.mapPos.x, y: newUnit.mapPos.y - newUnit.scaleSize.y * .9 }),
                size: { x: newUnit.size.x, y: (newUnit.size.y * .025) < 1 ? 1 : (newUnit.size.y * .025) },
                scale: newUnit.scale,
                active: true
            });
            newUnitGuage.attachTo(newUnit, { x: 0, y: -newUnit.scaleSize.y * .9 });

            newUnit.currentVital.notifiers.push((currentVital: MobaIO_Base.Vitals) => {
                newUnitGuage.adjustGuage(currentVital.current['HP'] / currentVital.max['HP'] );            
            });

            this.addParticle(newUnitGuage as any);
            return newUnit;
        }
    }
    export interface IDrawableFeatureFactory extends MobaIO_Base.FeatureFactory {
        stampFeature: (featureName: string, extraParams?: any, returnFeature?: DrawnMapFeature) => DrawnMapFeature;
    }
    export class DrawableFeatureFactory extends MobaIO_Base.FeatureFactory {
        //stampFeature(mapFeatureName: string, extraParams?: {}, returnFeature?: mobaIO_base.MapFeature): DrawnMapFeature;

        static makeDrawable(featureFactory: MobaIO_Base.FeatureFactory, game: ClientMobaIO_Game): DrawableFeatureFactory {

            Object.keys(featureFactory.featureStamps).forEach((eachFeatureName) => {
                let featureParam = (featureFactory.featureStamps[eachFeatureName].featureParam as any);
                let drawableName = featureParam.drawablesName;
                let drawables = (featureFactory.featureStamps[eachFeatureName].featureParam as any).drawables = game.findDrawable(drawableName, true);
                if (featureParam.drawablesSet) {
                    (featureFactory.featureStamps[eachFeatureName].featureParam as any).drawables = drawables.imageSet[featureParam.drawablesSet];
                }
                //featureFactory.featureStamps[eachFeatureName].featureConstructor = DrawnMapFeature as any;
            });
            let stamper = featureFactory.stampFeature;
            let drawnMapFeature: DrawnMapFeature;
            featureFactory.stampFeature = (featureName: string, extraParams?: any, returnFeature?: DrawnMapFeature): DrawnMapFeature => {
                return DrawnMapFeature.makeDrawn(
                    stamper(featureName, extraParams, returnFeature, featureFactory) as any,
                    Drawable.makeNewDrawFrame((featureFactory.getParam(featureName) as any).drawables)
                );
            };
            return featureFactory as IDrawableFeatureFactory;
        }

    }

    export class MainMenu extends BaseMenu {

    }
    export interface ClientSocketInterface {
        emit<T>(messageName: string, data: T): void;
        on<T>(messageName: string | 'connect' | 'disconnect', callbackFn: (data: T) => void);
        close(): void;
        open(): void;
    }
    export class Player extends MobaIO_Base.Player {
        userName?: string;
        userColor?: any;
        theSocket?: ClientSocketInterface;
        keyMap?: KeyMap;
        mouse?: Mouse;
        camera?: Camera;
        currentWorld: World;
        constructor (param: MobaIO_Base.IPlayer & { screenSize: MobaIO_Base.ICoord }) {
            super(param);
            this.camera = new Camera({ screenSize: param.screenSize });
        }
        updatePlayer(playerInfo: { userID: number, playerName: string, worldName: string, trackingId: number, gameWorldDataPath: string }, game: ClientMobaIO_Game) {
            this.userID = playerInfo.userID;
            this.trackingId = playerInfo.trackingId;
            this.currentWorld = game.worlds.filter((eachWorld) => { return eachWorld.name === playerInfo.worldName; })[0];
            this.camera.currentWorld = this.currentWorld;
            this.theSocket = game.clientSocket;
            game.setPlayer(this.heroReference);
        }

        activate(self = this) {
            // Join the socket to the server
            self.theSocket.on('d', (data: MobaIO_Base.ControlData[]) => {
                self.processServerPackage(data);
            });

            let clickFrequency = 6;
            let clickCooldown = 0;
            let gotoData = {
                message: self.currentWorld.controls.move.message,
                sourceTrackingId: self.trackingId,
                targetPos: { x: 0, y: 0}
            };
            //let clickPoint: MobaIO_Base.ICoord;
            let mouseFn = (clickPoint: MobaIO_Base.ICoord) => {
                if (clickCooldown <= self.currentWorld.gameFrames && clickPoint) {
                    clickCooldown = self.currentWorld.gameFrames + clickFrequency;

                    // Send goto command to the server!
                    //gotoData.message = 'm';
                    gotoData.sourceTrackingId = self.heroReference.trackingId;
                    gotoData.targetPos.x = clickPoint.x;
                    gotoData.targetPos.y = clickPoint.y;
                    self.theSocket.emit<MobaIO_Base.ControlData[]>('d', [
                        gotoData
                    ]);
                    //self.currentWorld.controls.move.controlFn(gotoData);
                }
            };
            let getClicked = <T>(features: T[], clickPoint: MobaIO_Base.ICoord): T => {
                return null;
            };
            self.mouse.onClick(() => { 
                let camera = self.camera;
                let cp = camera.getMouseCoord(self.mouse.point);
                if (self.mouse.bMap[1]) {
                    let clicked = getClicked<MobaIO_Base.MapFeature>(camera.currentWorld.features, cp);
                    if (clicked) {
                        return;
                    }
                    clicked = getClicked<MobaIO_Base.Unit>(camera.currentWorld.units, cp);
                    if (clicked) {
                        return;
                    }
                }
                
                // self.camera.currentWorld.addParticle({ 
                //     mapPos: new MobaIO_Base.Coord(cp), 
                //     expires: 120, 
                //     style: "#00ff00", 
                //     scale: .75,
                //     opacity: 1,
                //     opacitySpeed: -.01,
                //     momentum: new MobaIO_Base.Momentum({ angle: 0, velocity: 0 }),
                //     drawables: self.findDrawable("hover circle"),
                //     elevation: 50000,
                //     useElevation: true,
                //     active: true
                // } as any);
                mouseFn(cp);
            });
            self.mouse.onDrag(() => {
                let cp = self.camera.getMouseCoord(self.mouse.point);
                mouseFn(cp);
            });

            self.keyMap.onKey(ClientMobaIO_Game.theKeys.ability1, () => {
            });
            
            self.keyMap.onKey(ClientMobaIO_Game.theKeys.slot1, () => {
            });

            self.keyMap.onKey(ClientMobaIO_Game.theKeys.moveUp, () => {
                mouseFn({ x: self.heroReference.mapPos.x, y: self.heroReference.mapPos.y - (self.heroReference.scaleSizeD * 2) });
            });

            self.keyMap.onKey(ClientMobaIO_Game.theKeys.moveDown, () => {
                mouseFn({ x: self.heroReference.mapPos.x, y: self.heroReference.mapPos.y + (self.heroReference.scaleSizeD * 2) });
            });

            self.keyMap.onKey(ClientMobaIO_Game.theKeys.moveLeft, () => {
                mouseFn({ x: self.heroReference.mapPos.x - (self.heroReference.scaleSizeD * 2), y: self.heroReference.mapPos.y });
            });

            self.keyMap.onKey(ClientMobaIO_Game.theKeys.moveRight, () => {
                mouseFn({ x: self.heroReference.mapPos.x + (self.heroReference.scaleSizeD * 2), y: self.heroReference.mapPos.y });
            });
            
            self.keyMap.onKey(ClientMobaIO_Game.theKeys.interact, () => {

            });
            
            // Zoomer
            self.mouse.onWheel(() => {
                let camera = self.camera;
                let scale = camera.scaleTo;
                let zoom = (scale + (self.mouse.wheelVec / 1000) * scale);
                if (zoom < .1)
                    zoom = .1;
                if (zoom > 5)
                    zoom = 5;
                
                camera.scaleTo = zoom;
                
                camera.scaleChange = camera.scaleTo - camera.scale;
            });
            
        }
        processServerPackage(serverData: MobaIO_Base.ControlData[]) {
            for (let eachData of serverData) {
                //console.log(`Message: ${eachData.message}, sId: ${eachData.sourceTrackingId}, sPos:(${eachData.sourcePos.x},${eachData.sourcePos.y}), tId: ${eachData.targetTrackingId}, tPos:(${eachData.targetPos.x},${eachData.targetPos.y})`);
                this.currentWorld.controls.messages[eachData.message].controlFn(eachData, this.currentWorld);
            }
        }
    
        deactivate() {

        }
    }
    interface CanvasToDraw {
        zOrder?: number;
        useViewPort?: boolean;
        drawOffset?: MobaIO_Base.ICoord;
        canvas: HTMLCanvasElement;
        active?: boolean;
        scale?: number;
        rotation?: number;
        size?: MobaIO_Base.ICoord;
        color?: string | CanvasGradient;
        opacity?: number;
        ySort?: number;
        destinationOut?: boolean;
    }
    interface CanvasBucket {
        zOrder: number;
        canvases: CanvasToDraw[];
        canvasCounter: number;
    }
    export interface IClientMobaIO_Game extends MobaIO_Base.IMobaIO_Game {
        socket: ClientSocketInterface,
        theCanvas: HTMLCanvasElement,
        keyMapElement: HTMLElement,
        outputDiv: HTMLDivElement,
        characterInterface: {
            containerMenuDiv: HTMLDivElement,
            vitalsDiv: HTMLDivElement,
            craftingDiv: HTMLDivElement,
            inventoryDiv: HTMLDivElement,
            skillsDiv: HTMLDivElement,
            socialDiv: HTMLDivElement
        },
        textDiv: HTMLDivElement,
        chatInput: HTMLInputElement,
        characterMenuDiv: HTMLDivElement,
        mainMenuDiv: HTMLDivElement
    }
    export class ClientMobaIO_Game extends MobaIO_Base.MobaIO_Game {

        // Overrides
        public worlds: MobaIO_Client.World[];
        public featureFactory: MobaIO_Client.DrawableFeatureFactory;

        // New members
        graphicsJSON: any;
        private devMode: boolean = false;
        public graphics: { id?: number, name?: string, drawables: Drawable }[] = [];
        public canvasDims = { x: 854, y: 480 };
        public ioCanvas: HTMLCanvasElement;
        public ioCanvasRatio: number;
        public ioContext: CanvasRenderingContext2D;
        
        private outputElement?: OutputDiv;
        private characterMenu?: CharacterMenu;
        
        public scale: number = 1;
        public animating: boolean = false;
        public mouse: Mouse;
        public keyMap: KeyMap;
        public cameras: Camera[] = [];
        public player: Player;
        public clientSocket: ClientSocketInterface;
        private paused: boolean = false;
        
        private shouldNotRender: boolean;
        private lastIndex: number = 0;
        private lastFPSUpdate: number = 0;
        private fpsUpdatedCount: number = 0;
        private fpsCounter: number = 0;
        private drawnFpsCounter: number = 0;
        private rendering: boolean = false;
        //private canvasBuckets: CanvasBucket[] = [] as any;
        private canvasBuckets: { [index: string]: CanvasBucket } = {};
        private ambientByTrackingId: { [ trackingId: number ]: { feature: DrawnMapFeature, canvas: HTMLCanvasElement } } = {};
        private drawnCanvases: CanvasToDraw[] = [];
        private drawnCanvasesSorted: number[] = [];
        private canvasCounter: number = 0;
        private index: number = 0;
        private canvasIndex: number = 0;
        private canvasLength: number = 0;
        private tFeature: DrawnMapFeature = { mapPos: new MobaIO_Base.Coord(), scaleSize: {} } as any;
        private drawOffset: MobaIO_Base.ICoord = new MobaIO_Base.Coord();
        private drawCoord: MobaIO_Base.Coord = new MobaIO_Base.Coord();
        private h: number = 0;
        private w: number = 0;
        private opacity: number = 0;
        private rotation: number = 0;
        //private eachDrawn: CanvasToDraw = this.eachDrawn;
        private gridX: number = 0;
        private gridY: number = 0;
        private gx: number = 0;
        private gy: number = 0;
        runOnce: boolean;
    
        static selector: number = 0; // testing var
        
        static _renderFrame: (self: MobaIO_Base.MobaIO_Game) => void = MobaIO_Base.MobaIO_Game.prototype.renderFrame;
        static _gameFrame: (self: MobaIO_Base.MobaIO_Game, frameFn: () => any) => boolean = MobaIO_Base.MobaIO_Game.prototype.gameFrame;
        static theKeys: KeySet = {
            moveLeft: 37,
            moveRight: 39,
            moveDown: 40,
            moveUp: 38,
            rotateLeft: 188,
            rotateRight: 190,
            move: 191,
            interact: 32,
            f1: 112,
            f4: 115,
            ability1: 81, // q: 0,
            ability2: 87, // w: 0,
            ability3: 69, // e: 0,
            heroic: 82, // r: 0,
            trait: 68, // d: 0,
            item: 70,  // f: 0,
            slot1: 49, // one: 0,
            slot2: 50, // two: 0,
            slot3: 51, // three: 0
            slot4: 52, 
            slot5: 53, 
            slot6: 54, 
            slot7: 55, 
            slot8: 56, 
            slot9: 57,
            slot0: 58  
        };

        constructor(paramObject: IClientMobaIO_Game) {
            super(paramObject);

            this.timerFn = () => {
                return performance.now();
            }

            if (paramObject.characterInterface) {
                this.characterMenu = new CharacterMenu(paramObject.characterInterface);
            }
            this.graphicsJSON = paramObject.gameData.graphics;

            this.ioCanvas = paramObject.theCanvas;

            this.ioCanvasRatio = 
            (this.ioCanvas.width = this.canvasDims.x) /
            (this.ioCanvas.height = this.canvasDims.y);
            //  (this.ioCanvas.width = 320) /
            //  (this.ioCanvas.height = 240);


            if (paramObject.outputDiv && paramObject.textDiv) {
                this.outputElement = new OutputDiv({ outputDiv: paramObject.outputDiv, textDiv: paramObject.textDiv });
            }

            this.ioContext = this.ioCanvas.getContext('2d');
            this.keyMap = new KeyMap(paramObject.keyMapElement);
            this.mouse = new Mouse(this.ioCanvas);

            this.clientSocket = paramObject.socket;

            this.player = new Player({ screenSize: { x: this.ioCanvas.width, y: this.ioCanvas.height } });
        }

        getDrawable(id: number): Drawable {
            return this.graphics[id].drawables;
        }

        findDrawable(name: string, makeNew?: boolean): Drawable {
            let graphics = this.graphics;
            for (let i = 0; i < graphics.length; i++) {
                if ((graphics[i].name || "").indexOf(name) > -1) {
                    // return graphics[i].drawables;
                    if (!makeNew)
                        return graphics[i].drawables;
                        
                    return Drawable.makeNewCharacterAnimation(graphics[i].drawables);
                }
            }
        }

        isDrawable(name: string): boolean {
            let graphics = this.graphics;
            for (let i = 0; i < graphics.length; i++) {
                if ((graphics[i].name || "").indexOf(name) > -1) {
                    return true;
                }
            }
            return false;
        }

        async loadGraphics(graphicsJSON: { name: string, drawablesData: { drawablesCommand: string, params: any, resolver: boolean }}[]) {
            let self = this;

            return new Promise(function (resolve, reject) { 
                let graphicsCounter = 1;
                let resolver = () => {
                    graphicsCounter --;
                    if (graphicsCounter < 1) 
                        resolve();
                };
                if (!self.graphics) {
                    self.graphics = [];
                }
                self.graphics = self.graphics.concat(((graphicsToLoad) => {
                    return graphicsToLoad.filter((eachGraphic) => { return !self.isDrawable(eachGraphic.name) }).map((eachGraphic) => { 
                        return {
                            name: eachGraphic.name,
                            drawables: ((): Drawable => { 
                                if (eachGraphic.drawablesData.resolver) {
                                    graphicsCounter++;
                                    eachGraphic.drawablesData.params.callbackFn = () => { resolver(); };
                                }

                                let newDrawable = new Drawable();
                                newDrawable[eachGraphic.drawablesData.drawablesCommand](eachGraphic.drawablesData.params);
                                return newDrawable;
                            })()
                        }
                    })
                    .map((eachGraphics: { id?: number, name?: string, drawables: Drawable }, index: number) => {
                        return { id: index, drawables: eachGraphics.drawables, name: eachGraphics.name || "" };
                    });
                })(graphicsJSON));

                resolver();
            });

            //return loadingPromise;
        }

        createWorlds () {
            this.worlds = Object.keys(this.worldParam).map((eachWorldName) => {
                let eachWorldJson = this.worldParam[eachWorldName];

                let newWorld = new World({
                    featureFactory: this.featureFactory,
                    drawables: this.findDrawable(eachWorldJson.drawables),
                    useGame: this
                });
                let worldSetDrawable: Drawable,
                    lastDrawablesName: string;
                
                for (let eachIFeature of (<any>eachWorldJson.uniqueFeatures) as DrawnMapFeature[]) {
                    if (eachIFeature.drawablesSet) {
                        if (eachIFeature.drawablesName !== lastDrawablesName) {
                            lastDrawablesName = eachIFeature.drawablesName;
                            worldSetDrawable = this.findDrawable(lastDrawablesName);
                        }
                        eachIFeature.drawables = worldSetDrawable.imageSet[eachIFeature.drawablesSet];
                        eachIFeature.luminance = 1;
                        eachIFeature.constructorKey = "VisibleMapFeature";
                    }
                    else {
                        eachIFeature.drawables = this.findDrawable(eachIFeature.drawablesName, true);
                    }
                }
                for (let eachIUnit of (<any>eachWorldJson.units) as DrawnMapFeature[]) {
                    eachIUnit.drawables = this.findDrawable(eachIUnit.drawablesName, true);
                }

                newWorld.create(eachWorldJson);

                //newWorld.sun.setIlluminator = 

                return newWorld;
            });
        }

        private eachWorld: World;
        private eachFeature: DrawnMapFeature & any;
        returnFeature<T>(trackingId: number): T & DrawnMapFeature {
            for (this.eachWorld of this.worlds) {
                // Search units
                for (this.eachFeature of this.eachWorld.units) {
                    if (this.eachFeature.trackingId === trackingId) {
                        this.eachFeature.currentWorld = this.eachWorld;
                        return this.eachFeature;
                    }
                }
            }

        }

        setPlayer(thisUnit = this.player.heroReference, self = this) {
            if (!thisUnit)
                return;
            self.player.theSocket = self.clientSocket;
            self.player.heroReference = thisUnit as any;
            self.player.currentWorld = self.player.heroReference.currentWorld as any;
            
            self.player.camera.currentWorld = self.player.currentWorld;
            self.player.camera.track(self.player.heroReference);
            self.cameras.push(self.player.camera);

            self.player.keyMap = self.keyMap;
            self.player.mouse = self.mouse;

            self.player.heroReference.ai.active = false;
            self.player.heroReference.ai.endCommands();
            self.characterMenu.setPlayer(self.characterMenu, self.player.heroReference);

            self.player.activate();

            self.keyMap.onKey(ClientMobaIO_Game.theKeys['f4'], () => {
                self.devMode = self.devMode ? false : true;
            });

            // Escape key
            self.keyMap.onKey(27, () => {
                // Escape!

                // Show the menu!
                // if (!self.characterMenu.menuShowing)
                //     self.characterMenu.showMenu(self.characterMenu);
                // else
                //     self.characterMenu.hideMenu(self.characterMenu);

                // Toggle the pauser

                // self.paused = self.paused ? false : true;
                // console.log(this);
                // debugger;
                // if (!self.paused) {
                //     self.gameTimer = performance.now();
                // }
            });
        }

        async start(thenFn?: (self: ClientMobaIO_Game) => any) {

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
        async join (data: { playerName: string, userID: number, worldName: string, trackingId: number, gameWorldDataPath: string }, self = this) {
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
            self.setPlayer(self.returnFeature<MobaIO_Base.Hero>(data.trackingId));
            self.start();

            self.clientSocket.on('status', (serverStatus: MobaIO_Base.MobaIO_GameStatus) => {
                let oldFrames = self.gameFrames;
                self.gameFrames = serverStatus.gameFrames;
                let playerWorld = self.player.currentWorld;
                playerWorld.sun = playerWorld.sun.applyStatus(serverStatus.worldStatus.sunStatus, playerWorld.sun);
                playerWorld.setLuminance(playerWorld.sun.illumination);
                playerWorld.gameFrames = self.gameFrames + 1;
                playerWorld.dayTimeFn(playerWorld, playerWorld.sun);

                let sun = playerWorld.sun;
                console.log(`World luminance: ${playerWorld.luminance}, gameFrames: ${playerWorld.gameFrames}(${oldFrames})`);
                console.log(`Sun illumination: ${sun.illumination}, frameCounter: ${sun.frameCounter}, dayTimeAdjust: ${sun.dayTimeAdjust}`);
            });

            self.clientSocket.emit('started', {});
        }

        run() {
            // to run this game, we need to load!
            //this.loadGraphics();
        }

        addDrawnFeature() {
        }

        renderFrame(self: ClientMobaIO_Game) {
            if (!self)
                self = this;
            let camera = self.cameras[0];
            ClientMobaIO_Game._renderFrame(self); // give a chance for common graphics code to render
            //self.cameras.forEach((eachCamera) => {
                self.renderCamera(camera, self.devMode);
            //});
            //self.cameras.forEach((eachCamera) => {
                this.ioContext.drawImage(camera.viewCanvas, 0, 0);
            //})
            self.rendering = false;
        }
        renderCamera(camera: Camera, devMode?: boolean) {
            let currentWorld = camera.currentWorld;
            if (!currentWorld) {
                return;
            }
            let stackSortSize = currentWorld.size.y;
            // actually render graphics to the canvas!
            let drawnCanvases = this.drawnCanvases;
            let drawnCanvasesSorted: number[] = this.drawnCanvasesSorted;
            let canvasCounter = this.canvasCounter = 0;

            let viewCanvasHeight = camera.viewCanvas.height;
            let viewCanvasWidth = camera.viewCanvas.width;
            let viewContext = camera.viewContext;
            //viewContext.font = "8pt Arial";
            
            let viewPort = camera.viewPort;
            let viewPortWidth = viewPort.width();
            let viewPortHeight = viewPort.height();
            let viewPort_p1X = viewPort.p1.x;
            let viewPort_p1Y = viewPort.p1.y;
            
            let index = this.index = 0;
            let canvasIndex = this.canvasIndex = 0;
            let eachFeature: DrawnMapFeature;
            let zOrder: number;
            let canvasStacks: CanvasStack[];
            let eachCanvasStack: CanvasStack;
            let eachIlluminatorId;
            let length: number;
            let canvasStacksLength = this.canvasLength = 0;
            let drawOffset = this.drawOffset;
            let tFeature = this.tFeature; //: DrawnMapFeature = { mapPos: {}, scaleSize: {} } as any;
            let cameraScale = camera.scale;
            let featureElevation: number;
            let illuminator: MobaIO_Base.IlluminatorReference;
            let lightingOffset = { x: 0, y: 0 };

            let worldCanvasStack = currentWorld.drawables.canvasStack();
            let surfaceCanvasStack = worldCanvasStack[0];
            let worldFaded = currentWorld.drawables.drawFrame.fadeable;
            // PREPARE WORLD SURFACE
            //surfaceCanvasStack.transferContext.fillStyle = "#fff";
            surfaceCanvasStack.transferContext.globalCompositeOperation = 'source-over';
            // surfaceCanvasStack.transferContext.drawImage(surfaceCanvasStack.fadeTo, viewPort_p1X, viewPort_p1Y, viewPortWidth, viewPortHeight, viewPort_p1X, viewPort_p1Y, viewPortWidth, viewPortHeight);
            surfaceCanvasStack.transferContext.clearRect(viewPort_p1X, viewPort_p1Y, viewPortWidth, viewPortHeight);
            surfaceCanvasStack.context.globalCompositeOperation = 'source-over';
            surfaceCanvasStack.context.drawImage(surfaceCanvasStack.fadeTo, viewPort_p1X, viewPort_p1Y, viewPortWidth, viewPortHeight, viewPort_p1X, viewPort_p1Y, viewPortWidth, viewPortHeight);
            
            // AMBIENTS to world surface
            length = currentWorld.ambients.length;
            for (index = 0; index < length; index ++) {
                eachFeature = (currentWorld.ambients[index] as any) as DrawnMapFeature;
                if (!eachFeature || !eachFeature.active) {
                    continue;
                }
                if ((eachFeature as MobaIO_Base.Trackable).trackingId && devMode) {
                    if (!drawnCanvases[canvasCounter]) {
                        drawnCanvases[canvasCounter] = { active: false } as any;
                    }
                    drawnCanvases[canvasCounter].zOrder = eachFeature.mapPos.y;
                    drawnCanvases[canvasCounter].drawOffset = camera.getDrawOffset(eachFeature.mapPos.getTranslatation({ x: 0, y: 0 }));
                    if ((eachFeature as any).ambientAttack) {
                        drawnCanvases[canvasCounter].canvas = currentWorld.highlighter["red"].canvasStack()[0].canvas;
                    }
                    if ((eachFeature as any).illumination >= 0) {
                        drawnCanvases[canvasCounter].canvas = currentWorld.highlighter["white"].canvasStack()[0].canvas;
                    }
                    drawnCanvases[canvasCounter].scale = (eachFeature.scaleSizeD / 100) * cameraScale;
                    drawnCanvases[canvasCounter].rotation = eachFeature.rotation;
                    drawnCanvases[canvasCounter].size = eachFeature.size;
                    drawnCanvases[canvasCounter].color = eachFeature.tempStyle;
                    drawnCanvases[canvasCounter].opacity = eachFeature.opacity;
                    drawnCanvases[canvasCounter].active = true;
                    drawnCanvases[canvasCounter].useViewPort = false;
                    drawnCanvasesSorted[canvasCounter] = canvasCounter;
                    canvasCounter++;
                }

                if (!eachFeature.drawables) {
                    continue;
                }

                tFeature.mapPos.x = eachFeature.mapPos.x;
                tFeature.mapPos.y = eachFeature.mapPos.y;
                tFeature.scaleSize.x = eachFeature.scaleSizeD;
                tFeature.scaleSize.y = eachFeature.scaleSizeD;

                if (!this.ambientByTrackingId[eachFeature.trackingId]) {
                    this.ambientByTrackingId[eachFeature.trackingId] = {
                        feature: eachFeature,
                        canvas: eachFeature.drawables.canvasStack()[0].canvas
                    };
                }
                else {
                    //this.ambientByTrackingId[eachFeature.trackingId].actualCanvas = eachFeature.drawables.canvasStack()[0].canvas;
                }
                if (!camera.viewable(tFeature)) {
                    continue;
                }
                surfaceCanvasStack.transferContext.save();
                surfaceCanvasStack.transferContext.globalAlpha = 1;
                surfaceCanvasStack.transferContext.globalCompositeOperation = "lighten";
                surfaceCanvasStack.transferContext.drawImage(
                    this.ambientByTrackingId[eachFeature.trackingId].canvas,
                    eachFeature.mapPos.x - eachFeature.scaleSizeR,
                    eachFeature.mapPos.y - eachFeature.scaleSizeR
                );
                surfaceCanvasStack.transferContext.restore();
                // surfaceCanvasStack.fadeToContext.save();
                // surfaceCanvasStack.fadeToContext.globalCompositeOperation = 'destination-out';
                // surfaceCanvasStack.fadeToContext.drawImage(
                //     this.ambientByTrackingId[eachFeature.trackingId].canvas,
                //     eachFeature.mapPos.x - eachFeature.scaleSizeR,
                //     eachFeature.mapPos.y - eachFeature.scaleSizeR
                // );
                // surfaceCanvasStack.transferContext.globalAlpha = 1;
                // surfaceCanvasStack.transferContext.globalCompositeOperation = 'source-over';
                // surfaceCanvasStack.transferContext.drawImage(
                //     this.ambientByTrackingId[eachFeature.trackingId].actualCanvas,
                //     eachFeature.mapPos.x - eachFeature.scaleSizeR,
                //     eachFeature.mapPos.y - eachFeature.scaleSizeR
                // );
                // surfaceCanvasStack.context.globalAlpha = .25;
                // surfaceCanvasStack.context.globalCompositeOperation = "screen";
                // surfaceCanvasStack.context.drawImage(
                //     eachFeature.drawables.canvasStack()[0].canvas,
                //     eachFeature.mapPos.x - eachFeature.scaleSizeR,
                //     eachFeature.mapPos.y - eachFeature.scaleSizeR
                // );

            }
            // WORLD SURFACE
            length = worldCanvasStack.length;
            for (index = 0; index < length; index++) {
                eachCanvasStack = worldCanvasStack[index];
                zOrder = eachCanvasStack.elevationOffset;
                if (!worldFaded) {
                    // drawnCanvases[canvasCounter] = {
                    //     zOrder: zOrder * stackSortSize,
                    //     canvas: eachCanvasStack.canvas,
                    //     active: true
                    // };
                    if (!drawnCanvases[canvasCounter])
                        drawnCanvases[canvasCounter] = {} as any;

                    drawnCanvases[canvasCounter].zOrder = zOrder * stackSortSize;
                    drawnCanvases[canvasCounter].canvas = eachCanvasStack.canvas;
                    drawnCanvases[canvasCounter].useViewPort = true;
                    drawnCanvases[canvasCounter].active = true;
                    drawnCanvasesSorted[canvasCounter] = canvasCounter;
                    canvasCounter++;
                    continue;
                }
                if (!drawnCanvases[canvasCounter])
                    drawnCanvases[canvasCounter] = {} as any;

                drawnCanvases[canvasCounter].zOrder = zOrder * stackSortSize;
                drawnCanvases[canvasCounter].canvas = eachCanvasStack.source;
                drawnCanvases[canvasCounter].opacity = 1;
                drawnCanvases[canvasCounter].useViewPort = true;
                drawnCanvases[canvasCounter].active = true;
                drawnCanvasesSorted[canvasCounter] = canvasCounter;
                canvasCounter++;
                
                if (!drawnCanvases[canvasCounter])
                    drawnCanvases[canvasCounter] = {} as any;

                // Flatten transfer context to fadeTo
                eachCanvasStack.context.save();
                eachCanvasStack.context.globalCompositeOperation = 'destination-out';
                eachCanvasStack.context.globalAlpha = 1;
                eachCanvasStack.context.drawImage(eachCanvasStack.transfer, viewPort_p1X, viewPort_p1Y, viewPortWidth, viewPortHeight, viewPort_p1X, viewPort_p1Y, viewPortWidth, viewPortHeight);
                eachCanvasStack.context.restore();

                drawnCanvases[canvasCounter].zOrder = zOrder * stackSortSize + 1;
                drawnCanvases[canvasCounter].canvas = eachCanvasStack.canvas;
                drawnCanvases[canvasCounter].useViewPort = true;
                drawnCanvases[canvasCounter].active = true;
                drawnCanvases[canvasCounter].opacity = eachCanvasStack.fadeToOpacity;
                drawnCanvases[canvasCounter].destinationOut = true;
                drawnCanvasesSorted[canvasCounter] = canvasCounter;
                canvasCounter++;
            }
            // FEATURES
            length = currentWorld.features.length;
            for (index = 0; index < length; index ++) {
                eachFeature = currentWorld.features[index] as DrawnMapFeature;
                if (!eachFeature || !eachFeature.active || !eachFeature.drawables)
                    continue;

                tFeature.mapPos.x = eachFeature.mapPos.x;
                tFeature.mapPos.y = eachFeature.mapPos.y;
                if (eachFeature.scaleSize) {
                    tFeature.scaleSize.x = eachFeature.scaleSize.x;
                    tFeature.scaleSize.y = eachFeature.scaleSize.y;
                    tFeature.scaleSizeD = eachFeature.scaleSizeD;
                    tFeature.mapPos.translate({ x: 0, y: -(eachFeature.scaleSize.y /2 ) });
                }
                if (!camera.viewable(tFeature)) {
                    continue;
                }
                drawOffset = camera.getDrawOffset(tFeature.mapPos);
                
                featureElevation = eachFeature.elevation;
                canvasStacks = eachFeature.drawables.canvasStack();
                canvasStacksLength = canvasStacks.length;
                let eachCanvasStackReset: boolean;
                for (canvasIndex = 0; canvasIndex < canvasStacksLength; canvasIndex++) {
                    eachCanvasStack = canvasStacks[canvasIndex];
                    zOrder = Math.floor(eachCanvasStack.elevationOffset + featureElevation);
                    
                    if (eachFeature.reIlluminate) {
                        CanvasStack.ResetStackFade(eachCanvasStack);
                        for (let eachIlluminatorId of ((<any>eachFeature) as MobaIO_Base.VisibleMapFeature).illuminatorsIdKeys) {
                            illuminator = ((<any>eachFeature) as MobaIO_Base.VisibleMapFeature).illuminators[eachIlluminatorId];
                            if (illuminator.casting && illuminator.inFront) {
                                let ambient = this.ambientByTrackingId[eachIlluminatorId].feature as DrawnMapFeature;
                                if (Math.floor(ambient.elevation) === zOrder) {
                                    lightingOffset.x = ambient.mapPos.x - (ambient.scaleSizeR) - eachFeature.mapPos.x + (eachFeature.scaleSize.x / 2) ;
                                    lightingOffset.y = ambient.mapPos.y - eachFeature.mapPos.y + (eachFeature.scaleSize.y / 2) ;
                                    CanvasStack.ApplyLighting(eachCanvasStack, this.ambientByTrackingId[eachIlluminatorId].canvas, lightingOffset);
                                }
                            }
                        }
                        CanvasStack.ApplyLighting(eachCanvasStack);
                        eachFeature.reIlluminate = false;
                        eachFeature.reIlluminated = true;
                    }

                    if (!drawnCanvases[canvasCounter]) {
                        drawnCanvases[canvasCounter] = { active: false } as any;
                    }

                    drawnCanvases[canvasCounter].zOrder = (zOrder * stackSortSize) + eachFeature.mapPos.y,
                    drawnCanvases[canvasCounter].useViewPort = false;
                    drawnCanvases[canvasCounter].drawOffset = drawOffset,
                    drawnCanvases[canvasCounter].canvas = eachCanvasStack.canvas,
                    drawnCanvases[canvasCounter].scale = (eachFeature.scale || 1) * cameraScale,
                    drawnCanvases[canvasCounter].rotation = eachFeature.rotation,
                    drawnCanvases[canvasCounter].size = eachFeature.size,
                    drawnCanvases[canvasCounter].color = eachFeature.tempStyle,
                    drawnCanvases[canvasCounter].opacity = eachFeature.opacity,
                    drawnCanvases[canvasCounter].active = true
                    drawnCanvasesSorted[canvasCounter] = canvasCounter;
                    canvasCounter++;
                };
                if ((eachFeature as MobaIO_Base.Trackable).trackingId && devMode) {
                    if (!drawnCanvases[canvasCounter]) {
                        drawnCanvases[canvasCounter] = { active: false } as any;
                    }
                    drawnCanvases[canvasCounter].zOrder = eachFeature.mapPos.y;
                    drawnCanvases[canvasCounter].drawOffset = camera.getDrawOffset(eachFeature.mapPos.getTranslatation({ x: 0, y: 0 })),
                    drawnCanvases[canvasCounter].canvas = currentWorld.highlighter["black"].canvasStack()[0].canvas,
                    drawnCanvases[canvasCounter].scale = (eachFeature.scaleSizeD / 100) * cameraScale,
                    drawnCanvases[canvasCounter].rotation = eachFeature.rotation,
                    drawnCanvases[canvasCounter].size = eachFeature.size,
                    drawnCanvases[canvasCounter].color = eachFeature.tempStyle,
                    drawnCanvases[canvasCounter].opacity = eachFeature.opacity,
                    drawnCanvases[canvasCounter].active = true
                    drawnCanvases[canvasCounter].useViewPort = false;
                    drawnCanvasesSorted[canvasCounter] = canvasCounter;
                    canvasCounter++;
                }
            }
            // UNITS
            length = currentWorld.units.length;
            for (index = 0; index < length; index ++) {
                eachFeature = (currentWorld.units[index] as any) as DrawnMapFeature;
                if (!eachFeature || !eachFeature.active)
                    continue;

                tFeature.mapPos.x = eachFeature.mapPos.x;
                tFeature.mapPos.y = eachFeature.mapPos.y;
                tFeature.scaleSize.x = eachFeature.scaleSize.x;
                tFeature.scaleSize.y = eachFeature.scaleSize.y;
                tFeature.mapPos.translate({ x: 0, y: -(eachFeature.scaleSize.y /2 ) });
                if (!camera.viewable(tFeature)) {
                    continue;
                }
                drawOffset = camera.getDrawOffset(tFeature.mapPos);

                featureElevation = eachFeature.elevation;
                canvasStacks = eachFeature.drawables.canvasStack();
                canvasStacksLength = canvasStacks.length;
                for (canvasIndex = 0; canvasIndex < canvasStacksLength; canvasIndex++) {
                    eachCanvasStack = canvasStacks[canvasIndex];
                    zOrder = Math.floor(eachCanvasStack.elevationOffset + featureElevation);
                    
                    if (eachFeature.reIlluminate || eachCanvasStack.lastOpacity != eachCanvasStack.fadeToOpacity) {
                        CanvasStack.ResetStackFade(eachCanvasStack);
                        for (let eachIlluminatorId of ((<any>eachFeature) as MobaIO_Base.VisibleMapFeature).illuminatorsIdKeys) {
                            illuminator = ((<any>eachFeature) as MobaIO_Base.VisibleMapFeature).illuminators[eachIlluminatorId];
                            if (illuminator.casting && illuminator.inFront) {
                                let ambient = this.ambientByTrackingId[eachIlluminatorId].feature as DrawnMapFeature;
                                if (Math.floor(ambient.elevation) === zOrder) {
                                    lightingOffset.x = ambient.mapPos.x - (ambient.scaleSizeR) - eachFeature.mapPos.x + (eachFeature.scaleSize.x / 2) ;
                                    lightingOffset.y = ambient.mapPos.y - eachFeature.mapPos.y + (eachFeature.scaleSize.y / 2) ;
                                    CanvasStack.ApplyLighting(eachCanvasStack, this.ambientByTrackingId[eachIlluminatorId].canvas, lightingOffset);
                                }
                            }
                        }
                        CanvasStack.ApplyLighting(eachCanvasStack);
                        eachFeature.reIlluminated = true;
                        eachCanvasStack.lastOpacity = eachCanvasStack.fadeToOpacity;
                    }
                    
                    if (!drawnCanvases[canvasCounter]) {
                        drawnCanvases[canvasCounter] = { active: false } as any;
                    }

                    drawnCanvases[canvasCounter].zOrder = (zOrder * stackSortSize) + eachFeature.mapPos.y,
                    drawnCanvases[canvasCounter].useViewPort = false;
                    drawnCanvases[canvasCounter].drawOffset = drawOffset,
                    drawnCanvases[canvasCounter].canvas = eachCanvasStack.canvas,
                    drawnCanvases[canvasCounter].scale = eachFeature.scale * cameraScale,
                    drawnCanvases[canvasCounter].rotation = eachFeature.rotation,
                    drawnCanvases[canvasCounter].size = eachFeature.size,
                    drawnCanvases[canvasCounter].color = eachFeature.tempStyle,
                    drawnCanvases[canvasCounter].opacity = eachFeature.opacity,
                    drawnCanvases[canvasCounter].active = true
                    drawnCanvasesSorted[canvasCounter] = canvasCounter;
                    canvasCounter++;
                };
                eachFeature.reIlluminate = false;
                if ((eachFeature as MobaIO_Base.Trackable).trackingId && devMode) {
                    if (!drawnCanvases[canvasCounter]) {
                        drawnCanvases[canvasCounter] = { active: false } as any;
                    }
                    drawnCanvases[canvasCounter].zOrder = eachFeature.mapPos.y;
                    drawnCanvases[canvasCounter].drawOffset = camera.getDrawOffset(eachFeature.mapPos.getTranslatation({ x: 0, y: 0 })),
                    drawnCanvases[canvasCounter].canvas = currentWorld.highlighter["blue"].canvasStack()[0].canvas,
                    drawnCanvases[canvasCounter].scale = (eachFeature.scaleSizeD / 100) * cameraScale,
                    drawnCanvases[canvasCounter].rotation = eachFeature.rotation,
                    drawnCanvases[canvasCounter].size = eachFeature.size,
                    drawnCanvases[canvasCounter].color = eachFeature.tempStyle,
                    drawnCanvases[canvasCounter].opacity = eachFeature.opacity,
                    drawnCanvases[canvasCounter].active = true
                    drawnCanvases[canvasCounter].useViewPort = false;
                    drawnCanvasesSorted[canvasCounter] = canvasCounter;
                    canvasCounter++;
                }
            }
            // PARTICLES
            length = currentWorld.particles.length;
            for (index = 0; index < length; index ++) {
                eachFeature = (<any>currentWorld.particles[index]) as DrawnMapFeature;
                if (!eachFeature || !eachFeature.active)
                    continue;

                tFeature.mapPos.x = eachFeature.mapPos.x;
                tFeature.mapPos.y = eachFeature.mapPos.y;
                tFeature.scaleSize.x = eachFeature.scaleSize.x;
                tFeature.scaleSize.y = eachFeature.scaleSize.y;
                tFeature.mapPos.translate({ x: 0, y: -(eachFeature.scaleSize.y /2 ) });
                if (!camera.viewable(tFeature)) {
                    continue;
                }
                drawOffset = camera.getDrawOffset(tFeature.mapPos);
                
                featureElevation = eachFeature.elevation;
                canvasStacks = eachFeature.drawables.canvasStack();
                canvasStacksLength = canvasStacks.length;
                for (canvasIndex = 0; canvasIndex < canvasStacksLength; canvasIndex++) {
                    eachCanvasStack = canvasStacks[canvasIndex];
                    zOrder = Math.floor(eachCanvasStack.elevationOffset + featureElevation);
                    
                    if (!drawnCanvases[canvasCounter]) {
                        drawnCanvases[canvasCounter] = { active: false } as any;
                    }

                    drawnCanvases[canvasCounter].zOrder = (zOrder * stackSortSize) + eachFeature.mapPos.y,
                    drawnCanvases[canvasCounter].useViewPort = false;
                    drawnCanvases[canvasCounter].drawOffset = drawOffset,
                    drawnCanvases[canvasCounter].canvas = eachCanvasStack.canvas,
                    drawnCanvases[canvasCounter].scale = eachFeature.scale * cameraScale,
                    drawnCanvases[canvasCounter].rotation = eachFeature.rotation,
                    drawnCanvases[canvasCounter].size = eachFeature.size,
                    drawnCanvases[canvasCounter].color = eachFeature.tempStyle,
                    drawnCanvases[canvasCounter].opacity = eachFeature.opacity,
                    drawnCanvases[canvasCounter].active = true
                    drawnCanvasesSorted[canvasCounter] = canvasCounter;
                    canvasCounter++;
                };
            }
            let drawnCanvasCounter = -1;
            
            let drawnCanvas1, drawnCanvas2;
            drawnCanvasesSorted.sort((drawnCanvas1Index, drawnCanvas2Index) => {
                drawnCanvas1 = drawnCanvases[drawnCanvas1Index];
                drawnCanvas2 = drawnCanvases[drawnCanvas2Index];
                return (!drawnCanvas1.active || !drawnCanvas1.canvas) ? 1 : drawnCanvas1.zOrder - drawnCanvas2.zOrder;
            })
            
            let drawCoord = this.drawCoord;
            let h: number = this.h;
            let w: number = this.w;
            let opacity: number = this.opacity;
            let rotation: number = this.rotation;
            let eachDrawn: CanvasToDraw;// = this.eachDrawn;
            let drawnCanvas: HTMLCanvasElement;
            let gridX: number = this.gridX;
            let gridY: number = this.gridY;
            let gx: number = this.gx;
            let gy: number = this.gy;
            //drawnCanvases.forEach((eachDrawn, index) => 
            length = drawnCanvases.length
            for (index = 0; index < length; index++) {
                eachDrawn = drawnCanvases[drawnCanvasesSorted[index]];
                
                if (!eachDrawn.active) 
                    continue;

                eachDrawn.active = false;

                drawnCanvas = eachDrawn.canvas;

                viewContext.save();
                viewContext.globalCompositeOperation = "source-over";
                if (eachDrawn.useViewPort) {
                    let feature: MobaIO_Base.WorldGridFeature;
                    // map canvas
                    if (eachDrawn.opacity) {
                        viewContext.globalAlpha = eachDrawn.opacity || 1;
                        viewContext.drawImage(drawnCanvas, viewPort_p1X, viewPort_p1Y, viewPortWidth, viewPortHeight, 0, 0, viewCanvasWidth, viewCanvasHeight);
                    }
                    viewContext.restore();
                    continue;

                }

                h = drawnCanvas.height / 2;
                w = drawnCanvas.width / 2;

                drawCoord.x = eachDrawn.drawOffset.x - w;
                drawCoord.y = eachDrawn.drawOffset.y - h;
                
                opacity = eachDrawn.opacity || 1;
                rotation = eachDrawn.rotation || 0;
                cameraScale = (eachDrawn.scale || 1);
                cameraScale = cameraScale < 0 ? 0 : cameraScale;
                //viewContext.globalAlpha = eachFeature.opacity || 1;
                viewContext.globalAlpha = opacity < 0 ? 0 : (opacity > 1 ? 1 : opacity);

                viewContext.translate(drawCoord.x + w, drawCoord.y + h);
                if (cameraScale != 1) {
                    viewContext.scale(cameraScale, cameraScale);
                }
                if (rotation != 0) {
                    viewContext.rotate(rotation * MobaIO_Base.Momentum.mathPIover180);
                }
                viewContext.translate(-w, -h);
                viewContext.drawImage(drawnCanvas, 0, 0); //, w * eachFeature.scale, h * eachFeature.scale);
                
                viewContext.restore();
                
            }
            if (devMode) {
                // Temp draw the grid
                viewContext.beginPath();
                viewContext.globalAlpha = 1;
                viewContext.lineWidth = 1;
                viewContext.strokeStyle = "#ffffff";
                for (gridX = currentWorld.gridSize.x - (viewPort_p1X % currentWorld.gridSize.x); gridX < viewPortWidth; gridX += currentWorld.gridSize.x) {
                    viewContext.moveTo(gridX * camera.scale, 0);
                    viewContext.lineTo(gridX * camera.scale, viewCanvasHeight);
                }
                for (gridY = currentWorld.gridSize.y - (viewPort_p1Y % currentWorld.gridSize.y); gridY < viewPortHeight; gridY += currentWorld.gridSize.y) {
                    viewContext.moveTo(0,               gridY * camera.scale);
                    viewContext.lineTo(viewCanvasWidth, gridY * camera.scale);
                }
                viewContext.stroke();
                let feature: DrawnMapFeature;
                for (gridX = currentWorld.gridSize.x - (viewPort_p1X % currentWorld.gridSize.x); gridX < viewPortWidth; gridX += currentWorld.gridSize.x) {
                    for (gridY = currentWorld.gridSize.y - (viewPort_p1Y % currentWorld.gridSize.y); gridY < viewPortHeight; gridY += currentWorld.gridSize.y) {
                        gx = Math.floor((gridX + viewPort_p1X + 2) / currentWorld.gridSize.x);
                        gy = Math.floor((gridY + viewPort_p1Y + 2) / currentWorld.gridSize.y);
                        
                        if (gx * currentWorld.gridSize.x < currentWorld.size.x && gy * currentWorld.gridSize.y < currentWorld.size.y && gx >= 0 && gy >= 0) {
                            let grid = currentWorld.grid[gx][gy];
                            if (grid.touched) {
                                viewContext.fillStyle = grid.touched;
                                grid.touched = '';
                                viewContext.fillRect(gridX * camera.scale, gridY * camera.scale, currentWorld.gridSize.x * camera.scale, currentWorld.gridSize.y * camera.scale);
                            }
                            let features = grid.features;
                            let gridIds = Object.keys(features);
                            let gridText = '';
                            if (gridIds.length > 0) {
                                let gridLength = 0;
                                for (let gridI = 0; gridI < gridIds.length; gridI++) {
                                    feature = features[gridIds[gridI]].feature;
                                    if (features[gridIds[gridI]].occupied) {
                                        viewContext.fillStyle = '#ffffff';
                                        viewContext.save();
                                        viewContext.scale(camera.scale * .3, camera.scale * .3);
                                        // gridText = `${feature.aafeatureName} ${feature.luminance ? `L:${Math.floor(feature.luminance)} / ${Math.floor(feature.bathedLuminance)};${feature.reIlluminated ? 'Illuminating' : ''}` : '' }`;
                                        gridText = `${feature.aafeatureName} ${feature.scaleSizeR}`;
                                        viewContext.fillText(gridText, gridX / .3, gridY / .3 + ((gridI + 1) * 8));
                                        viewContext.restore();
                                        feature.reIlluminated = false;
                                    }
                                }
                                
                            }
                        }
                    }
                }
            }
            if (drawnCanvasCounter + 1 > this.lastIndex) {
                console.log(this.lastIndex = drawnCanvasCounter + 1);
            }
        }

        gameFrame(self: ClientMobaIO_Game): boolean {
            if (self.paused)
                return;

            if ( !ClientMobaIO_Game._gameFrame(self, () => { 
            
                //let thisCamera = self.cameras[0];

                // perform any additional tasks not shared between server/client game code 

                // update camera position and movement
                self.cameras[0].gameFrame();
                
                // process particles
                self.cameras[0].currentWorld.doParticles();

                // update visual fog-of-war map

                if (!self.lastFPSUpdate)
                    self.lastFPSUpdate = self.timerAlias; 

                self.fpsCounter++
                if (self.lastFPSUpdate + 5000 < self.timerAlias) {
                    self.fpsCounter=0;
                    self.drawnFpsCounter=0;
                    self.lastFPSUpdate = self.timerAlias;
                }

            }) ) {
                if (!self.rendering) {
                    self.rendering = true;
                    window.requestAnimationFrame(self.renderFrameCallback(self)); 
                    
                }
                else {
                    console.log("Double rendering!");
                }
            }
            return self.shouldNotRender;
        }
        renderFrameCallback (self: ClientMobaIO_Game): (num: number) => any {
            return (num: number) => {
                self.renderFrame(self); 
                self.drawnFpsCounter++
                self.rendering = false;
            }
        }
    }
}
function entry() {
	
    document.oncontextmenu = function(e){ return false; }; //disable right-clicking context menus on this document

    let theCanvas = document.getElementById("outputCanvas") as (HTMLCanvasElement & { scaleToFit: number });
    theCanvas.height = theCanvas.clientHeight;
    theCanvas.width = theCanvas.clientWidth;
    let ioCanvasRatio = theCanvas.width / theCanvas.height;
    let debounce: number;
    let resizer = () => {
        debounce = performance.now();
        setTimeout(() => {
            if (performance.now() - debounce > 450) {
                if (window.innerWidth > window.innerHeight) {
                    theCanvas.style.height = `${window.innerHeight}px`;
                    theCanvas.style.width = `${Math.floor(window.innerHeight * ioCanvasRatio)}px`;
                    let centerValue = Math.floor((window.innerWidth - (window.innerHeight * ioCanvasRatio)) / 2);
                    theCanvas.style.left = `${centerValue}px`;
                }
                else {
                    theCanvas.style.width = `${window.innerWidth}px`;
                    theCanvas.style.height = `${Math.floor(window.innerWidth * (1 / ioCanvasRatio)) }px`;
                    theCanvas.style.left = `0px`;
                };

                if (game && game.mouse) {
                    game.mouse.updateRect(game.mouse.mouseElement.getBoundingClientRect());
                }
            }
        }, 500);
    };
    window.addEventListener('resize', resizer);
    resizer();

    var mainMenuDiv = document.getElementById('mainMenuDiv') as HTMLDivElement;

    var game: MobaIO_Client.ClientMobaIO_Game;
    
    let loginProvider = new LoginProvider(
        document.getElementById('loginModalDiv') as HTMLDivElement,
        document.getElementById('usernameInput') as HTMLInputElement,
        document.getElementById('passwordInput') as HTMLInputElement,
        document.getElementById('loginButton') as HTMLButtonElement,
        io({ autoConnect: false }) as any
    );
    let mainMenu = new MobaIO_Client.MainMenu({ containerMenuDiv: mainMenuDiv });
    let sourceDocument = document;
    loginProvider.onConnected(() => {
        if (mainMenu) {
            mainMenu.showMenu(mainMenu);
        }
    });
    loginProvider.onLogin(async (user, gameInfo: MobaIO_Base.MobaIO_GameData) => {
        if (mainMenu) {
            mainMenu.hideMenu(mainMenu);
        }

        game = new MobaIO_Client.ClientMobaIO_Game({ 
            socket: loginProvider.loginSocket as any,
            theCanvas: theCanvas,
            keyMapElement: sourceDocument as any,
            outputDiv: document.getElementById('outputDiv') as HTMLDivElement,
            characterInterface: {
                containerMenuDiv: document.getElementById('characterMenuDiv') as HTMLDivElement,
                vitalsDiv: document.getElementById('vitalsDiv') as HTMLDivElement,
                craftingDiv: document.getElementById('craftingDiv') as HTMLDivElement,
                inventoryDiv: document.getElementById('inventoryDiv') as HTMLDivElement,
                skillsDiv: document.getElementById('skillsDiv') as HTMLDivElement,
                socialDiv: document.getElementById('socialDiv') as HTMLDivElement
            },
            textDiv: document.getElementById('textDiv') as HTMLDivElement,
            chatInput: document.getElementById('chatInput') as HTMLInputElement,
            characterMenuDiv: document.getElementById('characterMenuDiv') as HTMLDivElement,
            mainMenuDiv: mainMenuDiv,
            gameData: gameInfo
        });
        MobaIO_Base.Trackable.trackingSerialNumber = 10000;
        await game.loadGraphics(game.graphicsJSON);
        // Upgrade the feature factory to drawables!
        game.featureFactory = MobaIO_Client.DrawableFeatureFactory.makeDrawable(game.featureFactory, game);

        loginProvider.loginSocket.on('joined', (joinData) => {
            game.join(joinData, game);
        });

        loginProvider.loginSocket.emit('ready', {});
    });
};
