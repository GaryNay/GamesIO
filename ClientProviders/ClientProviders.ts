import { TopDownEngine } from "../TopDownEngine/Engine.js";

export module ClientProviders {
    export interface IOutputDiv extends HTMLDivElement {
        showingDiv: number;
    }
    export class InputOutputDiv {
        isFocused = false;
        inputCallback: (input: string) => any;
        triggerElement: HTMLElement | HTMLDocument;

        constructor(
            private outputDiv: IOutputDiv,
            private textDiv: HTMLDivElement,
            private inputDiv: HTMLInputElement,
            private outputTime: number = 2000
        ) {
            this.outputDiv.addEventListener("transitionend", () => { this.transitionEnd(); });
            this.outputDiv.addEventListener("mousemove", () => {
                // this.isFocused = true;
                this.resetTimer();
            });
            this.outputDiv.addEventListener("mousedown", () => {
                this.isFocused = true;
                this.resetTimer();
            });
            this.outputDiv.addEventListener("mouseleave", () => {
                this.isFocused = false;
            });
            this.inputDiv.addEventListener("search", () => {
                this.input(this.inputDiv.value);
                this.inputDiv.value = '';

                this.isFocused = false;
                this.resetTimer();
                console.log(`IODiv: Searched`);
            });
            this.inputDiv.addEventListener("keydown", () => {
                this.isFocused = true;
                this.resetTimer();
            });
            this.inputDiv.addEventListener("blur", () => {
                this.isFocused = false;
            });

            this.outputDiv.style.display = "none";
        }

        onInput(triggerElement: HTMLElement | HTMLDocument, inputCallback: (input: string) => any) {
            this.triggerElement = triggerElement;
            this.triggerElement.addEventListener('keyup', (e: { code: string } & Event) => {
                // Check if enter is pressed, refresh ioDiv when that happens
                if (e.code === 'Enter') {
                    if (!(this.outputDiv.showingDiv >= 0)) {
                        this.resetTimer();
                        this.inputDiv.focus();
                        this.isFocused = true;
                        console.log(`IODiv: Showing from enter press`);
                    }
                    else {
                    }
                }
            });
            this.inputCallback = inputCallback;
        }
        output(text: string) {
            this.textDiv.innerHTML += `${text} <br/>` ;

            this.resetTimer();

            this.textDiv.scrollTop = this.textDiv.scrollHeight - this.textDiv.clientHeight;
        }
        clearOutput() {
            this.textDiv.innerHTML = '';
        }
        input(text: string) {
            this.inputCallback && this.inputCallback(text);
        }
        resetTimer() {
            if (!this.outputDiv.showingDiv) {
                this.show();
            }
            else {
                this.outputDiv.showingDiv = performance.now() + this.outputTime;
            }
        }
        private resetFunction() {
            if (this.isFocused) {
                this.outputDiv.showingDiv = performance.now() + this.outputTime;
            }

            if (this.outputDiv.showingDiv > performance.now()) {
                let newTime = this.outputDiv.showingDiv - performance.now();
                setTimeout(() => { this.resetFunction(); }, (newTime > 0 ? newTime : 0));
                return;
            }
            this.hide();
        }
        private transitionEnd() {
            if (this.outputDiv.showingDiv > 0)
                return;
            this.outputDiv.showingDiv = NaN;
            this.outputDiv.style.display = "none";
        }

        show() {
            this.outputDiv.style.display = "inline-block";
            this.outputDiv.classList.add("output-div-show");
                
            this.outputDiv.showingDiv = performance.now() + this.outputTime;
            this.resetFunction();
        }
        hide() {
            this.outputDiv.classList.remove("output-div-show");
            this.outputDiv.showingDiv = 0;
        }

    }

    export interface ClientSocketInterface {
        emit<T>(messageName: string, data: T): void;
        on<T>(messageName: string | 'connect' | 'disconnect', callbackFn: (data: T) => void): void;
        close(): void;
        open(): void;
    }

    export class Mouse {
        elementRect?: ClientRect;

        point = new TopDownEngine.Coord();
        dragStart = new TopDownEngine.Coord();
        dragBounds: TopDownEngine.Rect = new TopDownEngine.Rect();
        scaleX: number = 1;
        scaleY: number = 1;
        down: number = 0;
        dragging: boolean = false;
        clicked: boolean = false;
        wheel: number = 0;
        wheelVec: number = 0;

        onClick?: (point: TopDownEngine.Coord) => void;
        onDrag?: (dragBounds: TopDownEngine.Rect) => void;
        onMove?: (point: TopDownEngine.Coord, dragStart?: TopDownEngine.Coord) => void;
        onWheel?: (wheel: number, wheelDelta: number) => void;

        constructor(public mouseElement: HTMLCanvasElement) {
            mouseElement.addEventListener('mousemove', (e) => { this.mouseListener("move", e); }, false);
            mouseElement.addEventListener('mousedown', (e) => { this.mouseListener("down", e); }, false);
            mouseElement.addEventListener('mouseup', (e) => { this.mouseListener("up", e); }, false);
            mouseElement.addEventListener('mouseout', (e) => { this.mouseListener("out", e); }, false);
            mouseElement.addEventListener('wheel', (e) => { this.mouseListener("wheel", e); }, false);
        }

        mouseListener(doing: string, theEvent: MouseEvent | WheelEvent) {
            switch (doing) {
                case 'move':
                    if (this.down && !this.dragging) {
                        this.dragStart.x = this.point.x;
                        this.dragStart.y = this.point.y;
                        this.dragging = true;
                    }

                    this.point.x = (theEvent.clientX - this.mouseElement.offsetLeft) * this.scaleX; //.left;
                    this.point.y = (theEvent.clientY - this.mouseElement.offsetTop) * this.scaleY; //.top;

                    this.onMove && this.onMove(this.point, this.down ? this.dragStart : undefined);
                    break;
                case 'down':
                    // consider to simulate a keyboard button based on mouse position
                    this.down = 1;
                    this.dragging = false;
                    break;
                case 'up':

                    if (!this.dragging) {
                        this.onClick && this.onClick(this.point);
                    }
                    else {
                        this.dragBounds.setCoords(this.dragStart.x, this.dragStart.y, this.point.x, this.point.y);
                        this.dragBounds.fix();
                        this.onDrag && this.onDrag(this.dragBounds);
                    }
                    this.down = 0;
                    this.dragging = false;
                    this.clicked = false;

                    break;
                case 'wheel':
                    //theMouse.wx += theEvent.deltaX;
                    this.wheel += (<WheelEvent>theEvent).deltaY;

                    this.wheelVec = (<WheelEvent>theEvent).deltaY;
                    //theMouse.wz += theEvent.deltaZ;
                    this.onWheel && this.onWheel(this.wheel, this.wheelVec);
                    break;
                case 'out': break;
                default:
                    break;
            }
        }
        updateRect(newRect: ClientRect) {
            this.elementRect = newRect;
            this.scaleY = this.mouseElement.height / this.elementRect.height;
            this.scaleX = this.mouseElement.width / this.elementRect.width;
        }
    }
    export interface IKeys {
        [ keyCode: number]: number
    };
    export class KeyMap {
        constructor(private keys: IKeys = {}) {
            document.addEventListener('keyup', (e) => { this.keyListener("up", e, this.keys); }, false);
            document.addEventListener('keydown', (e) => { this.keyListener("down", e, this.keys); }, false);
        }
        keyListener (doing, theEvent: { keyCode: number }, thisKeys: IKeys = this.keys) {
            switch (doing) {
                case 'down':
                    thisKeys[theEvent.keyCode] = 1;
                    //document.getElementById('infoBox').innerHTML = key;
                    break;
                case 'up':
                    thisKeys[theEvent.keyCode] = undefined;
                    break;
            }

            return;
        }
    }

    export class FeatureClickerClient extends Mouse {
        tree: TopDownEngine.QueryTree = new TopDownEngine.QueryTree();
        objectArray: TopDownEngine.BasicFeature[] = [];
        constructor(private ourCanvas: HTMLCanvasElement) {
            super(ourCanvas);

            this.onDrag = (qBounds: TopDownEngine.Rect) => {
                setTimeout(() => {

                    console.log(`Querying (${qBounds.p1.x}, ${qBounds.p1.y})-(${qBounds.p2.x}, ${qBounds.p2.y})!`);
                    let results = this.tree.query(qBounds.p1.x, qBounds.p1.y, qBounds.p2.x, qBounds.p2.y);

                    if (results.resultNumber) {
                        console.log(`Showing ${results.resultNumber} features from query!`);
                        console.log(results);

                        this.tree.renderVisually(this.ourCanvas);

                        let ctx = this.ourCanvas.getContext('2d');
                        if (!ctx) {
                            return;
                        }
                        for (let eachIndex = 0; eachIndex < results.resultNumber; eachIndex++) {
                            let ftr = this.objectArray[results.results[eachIndex]];
                            ctx.beginPath();
                            ctx.lineWidth = 1;
                            ctx.globalAlpha = 1;
                            ctx.strokeStyle = 'green';
                            ctx.rect(ftr.pos.x - ftr.size.x / 2,
                                ftr.pos.y - ftr.size.y / 2,
                                ftr.size.x,
                                ftr.size.y);

                            ctx.stroke();
                        }
                    }
                    else {
                        console.log('No results!');
                    }
                });

            };
        }
    }

    export class FeatureClickerLocal extends Mouse {

        constructor(private ourCanvas: HTMLCanvasElement, private objectArray: TopDownEngine.BasicFeature[], private tree: TopDownEngine.QueryTree) {
            super(ourCanvas);

            this.onClick = (point: TopDownEngine.Coord) => {
                let feature = new TopDownEngine.BasicFeature(this.point.x, this.point.y, 5 + Math.random() * 20, 5 + Math.random() * 5);

                this.objectArray.push(feature);
                feature.index = this.objectArray.length - 1;
                this.tree.insert(feature);
                this.tree.renderVisually(this.ourCanvas);
            };

            this.onDrag = (qBounds: TopDownEngine.Rect) => {
                setTimeout(() => {

                    console.log(`Querying (${qBounds.p1.x}, ${qBounds.p1.y})-(${qBounds.p2.x}, ${qBounds.p2.y})!`);
                    let results = this.tree.query(qBounds.p1.x, qBounds.p1.y, qBounds.p2.x, qBounds.p2.y);

                    if (results.resultNumber) {
                        console.log(`Showing ${results.resultNumber} features from query!`);
                        console.log(results);

                        this.tree.renderVisually(this.ourCanvas);

                        let ctx = this.ourCanvas.getContext('2d');
                        if (!ctx) {
                            return;
                        }
                        for (let eachIndex = 0; eachIndex < results.resultNumber; eachIndex++) {
                            let ftr = this.objectArray[results.results[eachIndex]];
                            ctx.beginPath();
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = 'green';
                            ctx.rect(ftr.pos.x - ftr.size.x / 2,
                                ftr.pos.y - ftr.size.y / 2,
                                ftr.size.x,
                                ftr.size.y);

                            ctx.stroke();
                        }
                    }
                    else {
                        console.log('No results!');
                    }
                });

            };
        }
    }

    export class WindowHandler {
        debounce = 0;
        ioCanvasRatio: number = 1;
        resizer() {
            let debounce = this.debounce = performance.now();
            setTimeout(() => {
                if (performance.now() - debounce > 450) {
                    if (this.sourceWindow.innerWidth > this.sourceWindow.innerHeight) {
                        this.targetCanvas.style.height = `${this.sourceWindow.innerHeight}px`;
                        this.targetCanvas.style.width = `${Math.floor(this.sourceWindow.innerHeight * this.ioCanvasRatio)}px`;
                        let centerValue = Math.floor((this.sourceWindow.innerWidth - (this.sourceWindow.innerHeight * this.ioCanvasRatio)) / 2);
                        this.targetCanvas.style.left = `${centerValue}px`;
                    }
                    else {
                        this.targetCanvas.style.width = `${this.sourceWindow.innerWidth}px`;
                        this.targetCanvas.style.height = `${Math.floor(this.sourceWindow.innerWidth * (1 / this.ioCanvasRatio))}px`;
                        this.targetCanvas.style.left = `0px`;
                    };

                    if (this.mouse) {
                        this.mouse.updateRect(this.mouse.mouseElement.getBoundingClientRect());
                    }
                }
            }, 500);
        };
        constructor(
            public targetCanvas: HTMLCanvasElement & { scaleToFit: number, tdSetHeight: number, tdSetWidth: number },
            public mouse: Mouse,
            private sourceWindow = window,
            private sourceDocument = sourceWindow.document) {
        }

        initialize() {
            this.sourceDocument.oncontextmenu = () => { return false; }; //disable right-clicking context menus on this document

            (<any>this.targetCanvas).tdSetHeight = this.targetCanvas.height = this.targetCanvas.clientHeight;
            (<any>this.targetCanvas).tdSetWidth = this.targetCanvas.width = this.targetCanvas.clientWidth;
            this.ioCanvasRatio = this.targetCanvas.width / this.targetCanvas.height;
            this.sourceWindow.addEventListener('resize', () => { return this.resizer(); });
            this.resizer();
        }
    }
    export class XhrProvider {
        public url?: string;
        constructor(public baseUrl: string = location.origin, public returnResponseOnReject: boolean = false, public urlDecorator = '', setCustomHeaders?: (req: XMLHttpRequest) => void) {
    
            this.url = `${baseUrl}${urlDecorator}`;
            this.setHeaders = typeof setCustomHeaders === 'function' ? setCustomHeaders : ((req: XMLHttpRequest) => {
                req.setRequestHeader('Accept', 'application/json');
                req.setRequestHeader('Content-Type', 'application/json');
                req.setRequestHeader('OData-MaxVersion', '4.0');
                req.setRequestHeader('OData-Version', '4.0');
    
            });
        }
    
        private reject(requestObject: XMLHttpRequest, rejector: (rejectText: string) => void): void {
            if (this.returnResponseOnReject) {
                return rejector(requestObject.response);
            }
            return rejector(`Unexpected result (${requestObject.status}): ${requestObject.statusText}`);
        }
    
        async postAsync<T>(requestUrl: string, body: T): Promise<any> {
            return new Promise<string>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.open('POST', encodeURI(requestUrl), true);
                this.setHeaders(req);
    
                req.onreadystatechange = async () => {
                    if (req.readyState === 4) {
                        req.onreadystatechange = null;
                        if (req.status >= 200 && req.status <= 204) {
                            return resolve(req.response ? JSON.parse(req.response) : req);
                        }
                        return this.reject(req, reject);
                    }
    
                };
                req.send(JSON.stringify(body));
            });
        }
        async postForEachAsync<T>(forEachList: T[], requestUrlCallback: (forEachValue: T) => string, forEachCallback?: (eachT: T, guid: string) => any): Promise<any[]> {
            return new Promise<any[]>(async (resolve, reject) => {
                try {
                    let resultList: any[] = [];
                    for (let forEachIndex = 0; forEachIndex < forEachList.length; forEachIndex++) {
                        let eachT = forEachList[forEachIndex];
                        let postedResult = await this.postAsync<T>(requestUrlCallback(eachT), eachT);
                        if (forEachCallback) {
                            await forEachCallback(eachT, postedResult);
                        }
    
                        resultList.push(postedResult);
                    }
                    return resolve(resultList);
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        async patchAsync<T>(requestUrl: string, body: any): Promise<any> {
            return new Promise((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.open('PATCH', encodeURI(requestUrl), true);
                this.setHeaders(req);
    
                req.onreadystatechange = () => {
                    if (req.readyState === 4) {
                        req.onreadystatechange = null;
                        if (req.status >= 200 && req.status <= 204) {
                            return resolve(req.response ? JSON.parse(req.response) : req);
                        }
                        else {
                            return this.reject(req, reject);
                        }
                    }
                };
    
                req.send(JSON.stringify(body));
            });
        }
        async patchForEachAsync<T>(forEachList: T[], requestUrlCallback: (forEachValue: T) => string, forEachCallback?: (eachT: T) => any): Promise<any> {
            return new Promise(async (resolve, reject) => {
                try {
                    for (let forEachIndex = 0; forEachIndex < forEachList.length; forEachIndex++) {
                        let eachT = forEachList[forEachIndex];
                        await this.patchAsync<T>(requestUrlCallback(eachT), eachT);
                        if (forEachCallback)
                            await forEachCallback(eachT);
                    }
                    return resolve(forEachList);
                }
                catch (err) {
                    reject(err);
                }
            });
        }
        async getAsync<T>(requestUrl: string, pageCallback?: () => void): Promise<GetResult<T>> {
            return new Promise<GetResult<T>>((resolve, reject) => {
    
                let req = new XMLHttpRequest();
                req.open('GET', encodeURI(requestUrl), true);
                this.setHeaders(req);
    
                req.onreadystatechange = async () => {
                    if (req.readyState === 4) {
                        req.onreadystatechange = null;
                        if (req.status === 200) {
                            let parsed: { value: T[] } & any = {};
                            let stringValue: string = '';
                            try {
                                parsed = JSON.parse(req.response);
                            }
                            catch (e) {
                                stringValue = req.response.toString();
                            }
                            if (!stringValue) {
                                // Check for @odata.nextlink to aquire all pages of data
                                if (parsed['@odata.nextLink']) {
                                    try {
                                        if (pageCallback && typeof pageCallback === 'function') pageCallback();
                                        let paged = (await this.getAsync<T>(decodeURI(parsed['@odata.nextLink']), pageCallback)).toList();
                                        parsed.value = parsed.value.concat(paged);
                                    }
                                    catch (err) {
                                        reject(err);
                                    }
                                }
                                return resolve(new GetResult<T>(parsed));
                            }
                            else {
                                return resolve(new GetResult<T>(stringValue));
                            }
    
                        }
                        return this.reject(req, reject);
                    }
                };
    
                req.send();
            });
        }
        async getForEachAsync<T1, T2>(forEachList: T2[], requestUrlCallback: (forEachValue: T2) => string, forEachCallback?: (eachT2: T2, T1Result: T1[]) => any): Promise<GetResult<T1>> {
            return new Promise<GetResult<T1>>(async (resolve, reject) => {
                try {
                    let resultList: T1[] = [];
                    for (let index = 0; index < forEachList.length; index++) {
                        let nextList = (await this.getAsync<T1>(
                            await requestUrlCallback(forEachList[index])
                        )).toList();
                        if (forEachCallback) {
                            await forEachCallback(forEachList[index], nextList);
                        }
                        resultList = resultList.concat(nextList);
                    }
                    return resolve(new GetResult<T1>({ value: resultList }));
                }
                catch (error) {
                    reject(error);
                }
            });
        }
        async deleteAsync<T>(requestUrl: string): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                let req = new XMLHttpRequest();
                req.open('DELETE', encodeURI(requestUrl), true);
                this.setHeaders(req);
    
                req.onreadystatechange = () => {
                    if (req.readyState === 4) {
                        req.onreadystatechange = null;
                        if (req.status >= 200 && req.status <= 204) {
                            return resolve();
                        }
                        else {
                            return this.reject(req, reject);
                        }
                    }
                };
    
                req.send();
            });
        }
        setHeaders: (req: XMLHttpRequest) => void;
    }
    export class GetResult<T> {
        private data: T[];
    
        constructor(json: any) {
            if (Array.isArray(json.value)) {
                this.data = json.value;
            }
            else {
                this.data = [];
                this.data.push(json.value ? json.value : json);
            }
        }
    
        count(): number {
            return this.data.length;
        }
    
        firstOrDefault(): T | null {
            if (this.count() > 0) {
                return this.data[0];
            }
            return null;
        }
    
        toList(): T[] {
            return this.data;
        }
    }
}

// var document;
// if (document) {
//     var require: any;
//     if (!require) {
//         var requires: any = { };
//         (<any>window).require = (filePath: string) => {
//             return requires[filePath] || {};
//         };
//         (<any>window).setRequire = (filePath: string, requiredObject: {}) => {
//             requires[filePath] = requiredObject || {};
//         };
//     }
//     if ((<any>window).setRequire) {
//         (<any>window).setRequire('./ClientProviders', { ClientProviders: ClientProviders });
//         (<any>window).setRequire('./ClientProviders.js', { ClientProviders: ClientProviders });
//         (<any>window).setRequire('../ClientProviders/ClientProviders', { ClientProviders: ClientProviders });
//         (<any>window).setRequire('../ClientProviders/ClientProviders.js', { ClientProviders: ClientProviders });
//     }
// }
