export module MobaIO_Base {
//** Vectors
    export class Nums {
        static sign(num: number): number {
            return num ? num > 0 ? 1 : -1 : 0;
        }
    }
    export interface ICoord {
        x?: number;
        y?: number;
    }
    export class Coord {
        public x: number;
        public y: number;
        static math180overPI = (180.0 / 3.141592);
        constructor(position?: Coord | ICoord) {
            this.x = (position || { x: 0 }).x || 0;
            this.y = (position || { y: 0 }).y || 0;
        }

        distanceTo(targetCoord: ICoord): number {
            return Math.sqrt(Math.pow(Math.abs(targetCoord.x - this.x), 2) + Math.pow(Math.abs(targetCoord.y - this.y), 2));
        }

        angleTo(targetCoord: ICoord): number {
            // return ((Math.atan2((this.x-targetCoord.x),(this.y-targetCoord.y)) * Coord.math180overPI) + 180.0) % 360
            return ((Math.atan2((this.y - targetCoord.y), (this.x - targetCoord.x)) * Coord.math180overPI) + 180.0) % 360
        }

        distance(): number {
            //return Math.sqrt(Math.pow(Math.abs(this.x), 2) + Math.pow(Math.abs(this.y), 2));
            return Math.sqrt(Math.abs(this.x)*Math.abs(this.x) + Math.abs(this.y)*Math.abs(this.y));
        }
        angle(): number {
            return ((Math.atan2((this.y), (this.x)) * Coord.math180overPI) + 180.0) % 360
        }
        translate(trans: ICoord): Coord {
            //return new Coord({ x: this.x + trans.x, y: this.y + trans.y });
            this.x += trans.x;
            this.y += trans.y;
            return this;
        }
        newTranslatedCoord(trans: ICoord): Coord {
            return new Coord({ x: this.x + trans.x, y: this.y + trans.y });
        }
        getTranslatation(trans: ICoord): ICoord {
            return { x: this.x + trans.x, y: this.y + trans.y };
        }
        static getAngle(coord: ICoord): number {
            return ((Math.atan2((coord.y), (coord.x)) * Coord.math180overPI) + 180.0) % 360
        }
        static getDistance(coord: ICoord): number {
            return Math.sqrt(Math.pow(Math.abs(coord.x), 2) + Math.pow(Math.abs(coord.y), 2));
        }
        static randomTranslate(coord: ICoord, radius?: number): Coord {
            return new Coord(coord).translate(new Momentum({ angle: Math.random() * 360, velocity: Math.random() * (radius || 50) }).delta);
        }

    }
    export interface IRect {
        p1?: Coord;
        size?: ICoord;
        p2?: Coord;
    }
    export class Rect {
        p1: Coord;
        p2: Coord;
        size: ICoord = { x: 0, y: 0 };

        angle?: number;

        constructor(params?: IRect) {
            if (params) {
                this.p1 = new Coord(params.p1);
                this.p2 = params.p2 ? new Coord(params.p2) : params.size ? this.p1.newTranslatedCoord(params.size) : new Coord(params.p1);
            }
            else {
                this.p1 = new Coord();
                this.p2 = new Coord();
            }
        }

        containsCoord(coord: ICoord) {
            return (coord.x > this.p1.x)
                && (coord.x < this.p2.x)
                && (coord.y > this.p1.y)
                && (coord.y < this.p2.y);
        }
        containsRect(coord: ICoord, size: ICoord) {
            return (coord.x + size.x / 2 > this.p1.x)
                && (coord.x - size.x / 2 < this.p2.x)
                && (coord.y + size.y / 2 > this.p1.y)
                && (coord.y - size.y / 2 < this.p2.y);
        }
        containsCirc(center: Coord, radius: number, distance?: number, closest?: ICoord) {

            if (!distance) {
                if (!closest) {
                    // Find the closest point to the circle within the rectangle
                    closest = {
                        x: center.x < this.p1.x ? this.p1.x : center.x > this.p2.x ? this.p2.x : center.x,
                        y: center.y < this.p1.y ? this.p1.y : center.y > this.p2.y ? this.p2.y : center.y
                    }
                }
                // Calculate the distance between the circle's center and this closest point
                distance = ((center.x - closest.x)*(center.x - closest.x)) + ((center.y - closest.y) * (center.y - closest.y));
            }

            // If the distance is less than the circle's radius, an intersection occurs
            return distance < (radius * radius);
        }

        height(): number {
            return this.size.y = Math.abs(this.p1.y - this.p2.y);
        }
        width(): number {
            return this.size.x = Math.abs(this.p1.x - this.p2.x);
        }
        hyp(): number {
            return this.p1.distanceTo(this.p2);
        }

    }
    export interface IPoly {

    }
    export class Poly {
        p: Coord[];

        constructor(params: IPoly) {

        }
    }
    export interface IMomentum {
        delta?: ICoord;
        angle?: number;
        velocity?: number
    }
    export class Momentum {
        public angle: number;
        public velocity: number;
        public delta: ICoord;
        public terminalVelocity?: number;
        static mathPIover180: number = Math.PI / 180;
        constructor(param?: IMomentum | Momentum) {
            if (param) {
                if (param.delta) {
                    this.delta = param.delta
                    this.setAngleAndVelocity();
                }
                else {
                    this.adjustAngle(param.angle || 0);
                    this.velocity = param.velocity || 0;
                    this.setDelta();
                }
            }
            else {
                this.setDelta({ angle: this.angle = 0, velocity: this.velocity = 0 });
            }

        }
        static calcDelta(angle: number, velocity: number): ICoord {
            return {
                // x: Math.sin(Momentum.mathPIover180 * angle) * velocity,
                // y: Math.cos(Momentum.mathPIover180 * angle) * velocity
                x: Math.cos(Momentum.mathPIover180 * angle) * velocity,
                y: Math.sin(Momentum.mathPIover180 * angle) * velocity
            };
        }

        setDelta(values?: Momentum | IMomentum) {
            if (values) {
                this.adjustAngle(this.angle = values.angle);
                this.velocity = values.velocity;
            }
            this.delta = Momentum.calcDelta(this.angle, this.velocity);
        }
        setAngleAndVelocity(delta?: ICoord) {
            let velocity: number, angle: number;
            if (delta) {
                velocity = Coord.getDistance(delta);
                if (velocity > (this.terminalVelocity || 10000)) // arbitrary max velocity
                    velocity = this.terminalVelocity || 10000;

                this.delta = Momentum.calcDelta(angle = Coord.getAngle(this.delta), velocity);
            }

            this.angle = angle || Coord.getAngle(this.delta);
            this.velocity = velocity || Coord.getDistance(this.delta);
        }
        applyMomentum(momentum?: Momentum | IMomentum, averageAngle?: boolean, averageDelta?: boolean) {
            // Mix the momentums!
            if (!momentum) {
                return;
            }
            if (averageAngle) {
                let angleDif = this.angleDiff(momentum.angle) / 2;
                let velocity = momentum.velocity;
                momentum = new Momentum({ angle: this.angle + angleDif, velocity: velocity || this.velocity });

            }

            if (averageDelta) {
                this.setAngleAndVelocity({
                    x: (this.delta.x + momentum.delta.x) / 2,
                    y: (this.delta.y + momentum.delta.y) / 2
                });
                return;
            }
            this.setAngleAndVelocity({
                x: this.delta.x + momentum.delta.x,
                y: this.delta.y + momentum.delta.y
            });

        }
        angleDiff(targetAngle: number): number {
            let angle = targetAngle - this.angle;
            return ((angle + 180) - Math.floor((angle + 180) / 360) * 360) - 180;
        }
        adjustAngle(amount: number): number {
            return this.angle = (((this.angle || 0) + amount + 360) % 360);
        }
    }
    export interface IFeaturePosition {
        mapPos?: Coord;
        rotation?: number;
        scale?: number;
    }
    export class FeaturePosition {
        mapPos: Coord;
        elevation?: number;
        rotation?: number;
        scale?: number;
    }
    export class BasicFeature extends FeaturePosition {

    }
    export interface IMapFeature {
        name?: string;
        active?: boolean;
        featureName?: string;
        drawablesName?: string;
        drawablesSet?: string;
        mapPos?: ICoord;
        yOffset?: number;
        rotation?: number;
        scale?: number;
        size?: ICoord;
        sizeD?: number;
        trackingId?: number;
        luminance?: number;
        tempStyle?: string;
        elevation?: number;

        constructorKey?: string;

        attachToId?: number;
        attachTo?: Movable;
    }
    export class MapFeature extends FeaturePosition {
        currentWorld?: World; // World Reference
        // physical data
        mapPos: Coord;
        mapRect?: Rect;
        size?: ICoord;
        sizeD?: number; // diameter used for collision size
        sizeR?: number; // 
        scaleSize?: ICoord;
        scaleSizeD?: number;
        scaleSizeR?: number;

        yOffset?: number;
        trackingId?: number;
        active: boolean;
        factoryName?: string; // Also used to index common data from factory
        aafeatureName?: string;
        drawablesName?: string;
        drawablesSet?: string;
        zOrder?: number;
        luminance?: number;
        rotation?: number = 0;
        scale?: number = 1;
        tempStyle?: string;
        touchThem?: boolean;
        beTouched?: boolean;
        touchReturn?: TouchResponse = {};
        constructorKey?: string;
        protected toCheckKeys?: string[];
        protected distance?: number = 0;
        static totalTouches?: number;
        static touch(toucher: MapFeature, touched: MapFeature, touchResult?: TouchResponse, distance?: number): TouchResponse {
            if (!touchResult || !distance || distance < 0)
                touchResult = toucher.onTouch(touched, distance = distance || toucher.mapPos.distanceTo(touched.mapPos));

            if (touchResult.isLighting) {
                // Adjust fadeTo to match light source
                (touched as LightSource).luminate(toucher as PhysicalObject, distance);
            }
            if (touchResult.isColliding) {
                (toucher as any).colliding = true;
            }
            if (touchResult.isDamaging) {
                console.log("Damage Touch!");
                touchResult.damageAmount = ((touched as any) as DamageBox).applyTo(toucher as any);
            }
            MapFeature.totalTouches++;

            return touchResult;
        }
        static unTouch(toucher: MapFeature, touched: MapFeature, touchResult?: TouchResponse, distance?: number): TouchResponse {
            if (!touchResult || !distance)
                touchResult = toucher.onTouch(touched, distance = distance || toucher.mapPos.distanceTo(touched.mapPos));

            if (touchResult.isLighting) {
                // Adjust fadeTo to match light source
                (touched as any).luminate(toucher, distance = -1, 0);
            }
            if (touchResult.isColliding) {
                (toucher as any).colliding = false;
            }
            if (touchResult.isDamaging) {
                touchResult.damageAmount = 0;
            }
            return touchResult;
        }

        constructor(params: IMapFeature) {
            super();
            this.trackingId = params.trackingId;
            this.mapPos = params.mapPos ? new Coord(params.mapPos) : undefined;
            this.luminance = params.luminance || (this.luminance ? this.luminance : undefined);
            let scale = this.scale = params.scale || (this.scale ? this.scale : 1);
            this.rotation = params.rotation || (this.rotation ? this.rotation : undefined);
            this.size = params.size || (this.size ? this.size : undefined);
            this.sizeD = params.sizeD; // ? params.sizeD : this.size? (this.size.x > this.size.y ? this.size.x : this.size.y) : undefined;
            this.yOffset = params.yOffset || (this.yOffset? this.yOffset : undefined);
            this.attachedToId = params.attachToId;

            if (this.size) {
                this.scaleSize = { x: this.size.x * scale, y: this.size.y * scale };
                this.mapRect = new Rect();
            }
            if (this.sizeD >= 0) {
                this.sizeR = this.sizeD / 2;
                this.scaleSizeD = (this.sizeD) * scale; //(this.sizeR = sizeCoord.distance()) * scale;
                this.scaleSizeR = this.scaleSizeD / 2; //(this.sizeR = sizeCoord.distance()) * scale;
            }
            this.elevation = params.elevation || 0;


            this.aafeatureName = params.featureName || params.name;
            this.constructorKey = params.constructorKey || 'MapFeature';
            this.drawablesName = params.drawablesName;
            if (params.drawablesSet) {
                this.drawablesSet = params.drawablesSet;
            }
            if (!MapFeature.totalTouches)
                MapFeature.totalTouches = 0;
        }
        onTouch(touchedMapFeature?: MapFeature, distance?: number): TouchResponse {
            return this.touchReturn;
        }
        adjustElevation(elevationAmount: number) {
            let elevation = this.elevation + elevationAmount;
            if (elevation < 0)
                elevation = 0;
            return this.elevation = elevation;
        }
        adjustRotate(rotateAmount: number) {
            while (rotateAmount < 0)
                rotateAmount += 360;
            return this.rotation += rotateAmount % 360
        }
        adjustScale(scaleAmount: number) {
            let scale = this.scale + scaleAmount;
            if (scale < 0)
                scale = 0;
            this.scaleSizeR = this.sizeR * scale;
            let size = this.size;
            this.scaleSize.x = size.x * scale;
            this.scaleSize.y = size.y * scale;

            return this.scale = scale;

        }
        castTouches(toCheck: { [index: string]: WorldGridFeature }, toCheckLength: number, toCheckKeys: string[], useMomentum?: boolean): IActivity[] {
            if (!(this as any).trackingId)
                return;
            let self: PhysicalObject = this as any;
            let eachCheck: Movable;
            let touchResult: any;
            let returnActivites: IActivity[] = [];
            for (let toCheckIndex = 0; toCheckIndex < toCheckLength; toCheckIndex++) {
                let toCheckId = toCheckKeys[toCheckIndex];
                if (toCheck[toCheckId].occupied) {
                    eachCheck = toCheck[toCheckId].feature as any;
                    if (eachCheck.active && eachCheck.trackingId !== self.trackingId) {
                        // if (eachCheck.momentum)
                        //     self.distance = eachCheck.mapPos.getTranslatedCoord(eachCheck.momentum.delta).distanceTo(self.mapPos.getTranslatation(self.momentum.delta));
                        // else
                        if (useMomentum) {
                            if (!(<any>self).momentum) {
                                debugger;
                            }
                            self.distance = eachCheck.mapPos.distanceTo(self.mapPos.getTranslatation((self as any).momentum.delta));
                        }
                        else {
                            self.distance = eachCheck.mapPos.distanceTo(self.mapPos);
                        }

                        if (!self.scaleSizeR || !eachCheck.scaleSizeR) {
                            debugger;
                        }

                        if (self.distance < (self.scaleSizeR + eachCheck.scaleSizeR)) {
                            MapFeature.touch(self, eachCheck, self.onTouch(eachCheck as any, self.distance), self.distance);
                            if (self.touchReturn.isDamaging) {
                                returnActivites.push({ unit: self, text: `${self.touchReturn.damageAmount}`, active: true });
                            }
                        }
                    }
                }
            }
            return returnActivites;
        }
        getTouched(toCheck: { [index: string]: WorldGridFeature }, toCheckLength: number, toCheckKeys: string[], useMomentum?: boolean): IActivity[] {
            if (!(this as any).trackingId)
                return;
            let self: PhysicalObject = this as any;
            let eachCheck: Movable;
            let touchResult: any;
            let returnActivites: IActivity[] = [];
            for (let toCheckIndex = 0; toCheckIndex < toCheckLength; toCheckIndex++) {
                let toCheckId = toCheckKeys[toCheckIndex];
                if (toCheck[toCheckId].occupied) {
                    eachCheck = toCheck[toCheckId].feature as any;
                    if (eachCheck.active && eachCheck.trackingId !== self.trackingId) {
                        // if (eachCheck.momentum)
                        //     self.distance = eachCheck.mapPos.getTranslatedCoord(eachCheck.momentum.delta).distanceTo(self.mapPos.getTranslatation(self.momentum.delta));
                        // else
                        if (useMomentum) {
                            if (!(<any>self).momentum) {
                                debugger;
                            }
                            self.distance = eachCheck.mapPos.distanceTo(self.mapPos.getTranslatation((self as any).momentum.delta));
                        }
                        else {
                            self.distance = eachCheck.mapPos.distanceTo(self.mapPos);
                        }

                        if (!self.scaleSizeR || !eachCheck.scaleSizeR) {
                            debugger;
                        }

                        if (self.distance < (self.scaleSizeR + eachCheck.scaleSizeR)) {
                            MapFeature.touch(eachCheck, self, eachCheck.onTouch(self as any, self.distance), self.distance);
                            if (eachCheck.touchReturn.isDamaging) {
                                returnActivites.push({ unit: eachCheck, text: `${eachCheck.touchReturn.damageAmount}`, active: true });
                            }
                        }
                    }
                }
            }
            return returnActivites;
        }
        doTouches(toCheck: { [index: string]: WorldGridFeature }, toCheckLength: number, toCheckKeys: string[], useMomentum?: boolean): IActivity[] {
            if (!(this as any).trackingId)
                return;
            let self: PhysicalObject & Movable = this as any;
            let eachCheck: PhysicalObject & Movable;
            let touchResult: any;
            let returnActivites: IActivity[] = [];
            let closest = { x: 0, y: 0 }, distance = 0;
            for (let toCheckIndex = 0; toCheckIndex < toCheckLength; toCheckIndex++) {
                let toCheckId = toCheckKeys[toCheckIndex];
                if (toCheck[toCheckId].occupied) {
                    eachCheck = toCheck[toCheckId].feature as any;
                    if (eachCheck.active && eachCheck.trackingId !== self.trackingId) {
                        if (self.scaleSizeR && eachCheck.scaleSizeR) {
                            if (self.momentum && eachCheck.momentum) {
                                self.distance = eachCheck.mapPos.newTranslatedCoord(eachCheck.momentum.delta).distanceTo(self.mapPos.getTranslatation((self as any).momentum.delta));
                            }
                            if (self.momentum && !eachCheck.momentum) {
                                self.distance = eachCheck.mapPos.distanceTo(self.mapPos.getTranslatation(self.momentum.delta));
                            }
                            if (!self.momentum && eachCheck.momentum) {
                                self.distance = self.mapPos.distanceTo(eachCheck.mapPos.getTranslatation(eachCheck.momentum.delta));
                            }
                            if (!self.momentum && !eachCheck.momentum) {
                                self.distance = eachCheck.mapPos.distanceTo(self.mapPos);
                            }

                            if (self.distance < (self.scaleSizeR + eachCheck.scaleSizeR)) {
                                MapFeature.touch(eachCheck, self, eachCheck.onTouch(self as any, self.distance), self.distance);
                                if (eachCheck.touchReturn.isDamaging) {
                                    returnActivites.push({ unit: eachCheck, text: `${eachCheck.touchReturn.damageAmount}`, active: true });
                                }
                                MapFeature.touch(self, eachCheck, self.onTouch(eachCheck as any, self.distance), self.distance);
                                if (self.touchReturn.isDamaging) {
                                    returnActivites.push({ unit: self, text: `${self.touchReturn.damageAmount}`, active: true });
                                }
                            }
                        }
                        if (self.scaleSizeR && !eachCheck.scaleSizeR && eachCheck.scaleSize) {
                            eachCheck.mapRect.p1.x = eachCheck.mapPos.x - (eachCheck.scaleSize.x / 2);
                            eachCheck.mapRect.p1.y = eachCheck.mapPos.y - (eachCheck.scaleSize.y / 2);
                            eachCheck.mapRect.p2.x = eachCheck.mapPos.x + (eachCheck.scaleSize.x / 2);
                            eachCheck.mapRect.p2.y = eachCheck.mapPos.y + (eachCheck.scaleSize.y / 2);
                            closest.x = self.mapPos.x < eachCheck.mapRect.p1.x ? eachCheck.mapRect.p1.x : self.mapPos.x > eachCheck.mapRect.p2.x ? eachCheck.mapRect.p2.x : self.mapPos.x;
                            closest.y = self.mapPos.y < eachCheck.mapRect.p1.y ? eachCheck.mapRect.p1.y : self.mapPos.y > eachCheck.mapRect.p2.y ? eachCheck.mapRect.p2.y : self.mapPos.y;
                            self.distance = self.mapPos.distanceTo(closest);
                            
                            //self.distance = (self.mapPos.x - closest.x) + (self.mapPos.y - closest.y);
                            distance = 0;
                            if (eachCheck.mapRect.containsCirc(self.mapPos, self.scaleSizeR, distance, closest)) {
                                MapFeature.touch(eachCheck, self, eachCheck.onTouch(self as any, self.distance), self.distance);
                                // if (eachCheck.touchReturn.isDamaging) {
                                //     returnActivites.push({ unit: eachCheck, text: `${eachCheck.touchReturn.damageAmount}`, active: true });
                                // }
                                MapFeature.touch(self, eachCheck, self.onTouch(eachCheck as any, self.distance), self.distance);
                                // if (self.touchReturn.isDamaging) {
                                //     returnActivites.push({ unit: self, text: `${self.touchReturn.damageAmount}`, active: true });
                                // }
                            }
                        }
                    }
                }
            }
            return returnActivites;
        }

        attached: boolean = false;
        attachedToId?: number;
        attachedTo?: MapFeature;
        attachOffset?: ICoord;
        updateGrid?: (lastMapPos: Coord) => void;
        attachTo(target: Movable, offset?: ICoord, self = this) {
            self.attached = true;
            self.attachedTo = target;
            self.attachOffset = { x: offset && offset.x ? offset.x : 0, y: offset && offset.y ? offset.y : 0 };
            let lastCoord = new Coord();
            self.aafeatureName = `${self.aafeatureName} attached to: ${target.aafeatureName}`;
            target.trackMe({
                callbackFn: (tracker: MapFeature & Movable, tracked: Movable) => {
                    lastCoord.x = tracker.mapPos.x;
                    lastCoord.y = tracker.mapPos.y;
                    tracker.mapPos.x = tracked.mapPos.x + self.attachOffset.x;
                    tracker.mapPos.y = tracked.mapPos.y + self.attachOffset.y;
                    if (tracker.updateGrid) {
                        tracker.updateGrid(lastCoord);
                    }
                    tracker.beTouched = true;
                    tracker.touchThem = true;
                },
                stopFn: null,
                tracker: self as any,
                trackTolerance: 1
            });

        }

        export(self = this, child?: IMapFeature): IMapFeature {
            child = child || {};
            child.trackingId = self.trackingId;
            child.active = self.active ? true : false;
            child.mapPos = self.mapPos ? { x: self.mapPos.x, y: self.mapPos.y } : undefined;
            child.elevation = self.elevation ? self.elevation : undefined;
            child.rotation = self.rotation ? self.rotation : undefined;
            child.scale = self.scale ? self.scale : undefined;
            child.attachToId = self.attachedToId ? self.attachedToId : undefined;
            if (!self.factoryName) {
                child.yOffset = self.yOffset ? self.yOffset : undefined;
                child.size = self.size ? { x: self.size.x, y: self.size.y } : undefined;
                child.sizeD = self.sizeD ? self.sizeD : undefined;
                child.constructorKey = self.constructorKey ? self.constructorKey : 'MapFeature';
                child.drawablesName = self.drawablesName ? self.drawablesName : undefined;
                child.drawablesSet = self.drawablesSet ? self.drawablesSet : undefined;
            }
            return child;
        }

        addSelf(nullPlaceholder, world: World) {
            world.addFeature(this);
        }
    }
//** Physics
    export interface IlluminatorReference {
        illumination?: number;
        inFront?: boolean;
        casting?: boolean;
    }
    export class VisibleMapFeature extends MapFeature implements Trackable {
        trackingId: number;
        illuminators: { [trackingId: string ]: IlluminatorReference } = {};
        luminance: number = 100; // logically/visually percievable
        bathedLuminance: number = 100; // bathed/overall luminance 
        illuminatorsIdKeys: string[] = [];
        reIlluminate?: boolean;
        static CorrectLuminance: (self?: VisibleMapFeature) => void = (self: VisibleMapFeature) => {
            self.luminance = self.luminance < 0 ? 0 : self.luminance > 100 ? 100 : self.luminance;
            self.bathedLuminance = self.bathedLuminance < 0 ? 0 : self.bathedLuminance > 100 ? 100 : self.bathedLuminance;
            self.illuminatorsIdKeys = self.illuminatorsIdKeys.filter((eachId) => {
                return self.illuminators[eachId].illumination > 0;
            });
        };
        static adjustLuminanceAsync (asyncFeature: VisibleMapFeature, asyncWorld: World) {
            asyncFeature.adjustLuminance(asyncFeature);
        }

        constructor(param: IMapFeature) {
            super(param);
        }

        adjustLuminance (asyncFeature = this) {
            let currentLuminance = 0, illuminator;
            let newLuminance = 0;
            let newBathedLuminance = 0;
            for (let i = 0; i < asyncFeature.illuminatorsIdKeys.length; i++) {
                illuminator = asyncFeature.illuminators[asyncFeature.illuminatorsIdKeys[i]]
                // Check to see if illuminator is large enough to affect total luminance
                currentLuminance = illuminator.illumination;
                if (currentLuminance > newLuminance) {
                    newLuminance = currentLuminance; // Logical observed
                }
                if (!illuminator.casting) {
                    if (currentLuminance > newBathedLuminance) {
                        newBathedLuminance = currentLuminance;
                    }
                }
            }
            if (newLuminance != asyncFeature.luminance || newBathedLuminance != asyncFeature.bathedLuminance) {
                asyncFeature.luminance = newLuminance;
                asyncFeature.bathedLuminance = newBathedLuminance;
                asyncFeature.reIlluminate = true;
                VisibleMapFeature.CorrectLuminance(asyncFeature);
            }
        };
        onTouch(mapFeature: any, distance: number): TouchResponse {
            if (mapFeature.illumination >= 0) {
                this.touchReturn.isLighting = true;
            }
            else {
                this.touchReturn.isLighting = false;
            }
            this.touchReturn.isHearing = false;
            this.touchReturn.isDamaging = false;
            this.touchReturn.isColliding = false;
            return this.touchReturn;
        }
    }
    export interface IPhysicalObject extends IMapFeature {
        mass?: number;
        luminance?: number;
        light?: {
            trackingId?: number;
            sizeD: number;
            center: number;
            illumination: number;
        };
    }
    export class PhysicalObject extends VisibleMapFeature {
        mass: number = 1;
        lightSource?: LightSource;

        constructor(param: IPhysicalObject) {
            super(param);
            this.constructorKey = param.constructorKey || 'PhysicalObject';
            this.mass = param.mass || 0;
            this.luminance = param.luminance || 50;
            if (param.light) {
                this.lightSource = new LightSource({
                    trackingId: param.light.trackingId,
                    mapPos: new Coord(param.mapPos).translate({ x: 0, y: 1 }),
                    illumination: param.light.illumination,
                    sizeD: param.light.sizeD,
                    center: param.light.center
                });
            }
        }
        // addIlluminator(trackingId: number, illumination: number) {
        //     if (this.illuminators[trackingId] == undefined) {
        //         this.illuminatorsIdKeys.push(`${trackingId}`);
        //     }
        // }
        onTouch(mapFeature: any, distance: number): TouchResponse {
            if (mapFeature.illumination >= 0) {
                this.touchReturn.isLighting = true;
            }
            else {
                this.touchReturn.isLighting = false;
            }
            if (mapFeature.volume) {
                this.touchReturn.isHearing = true;
            }
            else {
                this.touchReturn.isHearing = false;
            }
            if (mapFeature.ambientAttack) {
                // Touching a damage box!
                if ((this as any).currentVital && (mapFeature as DamageBox).cooldownCounter == 0) {
                    this.touchReturn.isDamaging = true;
                }
                else {
                    this.touchReturn.isDamaging = false;
                }

            }
            else {
                this.touchReturn.isDamaging = false;
            }
            if (mapFeature.mass) {
                this.touchReturn.isColliding = true;
            }
            else {
                this.touchReturn.isColliding = false;
            }
            return this.touchReturn;
        }

        attachTo(target: Movable, offset?: ICoord, self = this) {
            MapFeature.prototype.attachTo(target, offset, self);

            if (self.lightSource) {
                self.lightSource.attachTo(target, offset, self.lightSource);
            }
        }

        export(self?: PhysicalObject, child?: any): IPhysicalObject {
            self = self || this;
            child = MapFeature.prototype.export(self, child || {});
            child.trackingId = self.trackingId;
            child.luminance = self.luminance;
            if (!self.factoryName) {
                child.constructorKey = 'PhysicalObject';
                child.mass = self.mass;
                if (self.lightSource) {
                    child.light = {
                        trackingId: self.lightSource.trackingId,
                        sizeD: self.lightSource.sizeD,
                        center: self.lightSource.centerR * 2,
                        luminance: self.lightSource.illumination
                    }
                }
            }
            else {
                if (self.lightSource) {
                    child.light = {
                        trackingId: self.lightSource.trackingId
                    }
                }
            }
            return child;
        }

    }
    export interface TouchResponse {
        isLighting?: boolean;
        isColliding?: boolean;
        isClipping?: boolean;
        isDamaging?: boolean;
        damageAmount?: number;
        isHearing?: boolean;
    }
    export interface ITrackable {
        trackingId?: number;
    }
    export class Trackable extends MapFeature {
        gridPos?: Coord;
        trackingId?: number;
        registered?: boolean;
        public static trackingSerialNumber;
        static updateGrid = (toUpdate: Trackable, world, corners_t, currentGridPos, eachGrid, eachFeatureGrid, lastMapPos) => {
            // gonna just muscle my way through until I google the better way to do this
            toUpdate.gridPos.x = Math.floor(toUpdate.mapPos.x / world.gridSize.x);
            toUpdate.gridPos.y = Math.floor(toUpdate.mapPos.y / world.gridSize.y);

            corners_t.topLeft.x = Math.floor((toUpdate.mapPos.x - toUpdate.scaleSizeR) / world.gridSize.x);
            corners_t.topLeft.y = Math.floor((toUpdate.mapPos.y - toUpdate.scaleSizeR) / world.gridSize.y);
            corners_t.bottomRight.x = Math.floor((toUpdate.mapPos.x + toUpdate.scaleSizeR) / world.gridSize.x);
            corners_t.bottomRight.y = Math.floor((toUpdate.mapPos.y + toUpdate.scaleSizeR) / world.gridSize.y);

            for (currentGridPos.x = corners_t.topLeft.x; currentGridPos.x <= corners_t.bottomRight.x; currentGridPos.x++) {
                for (currentGridPos.y = corners_t.topLeft.y; currentGridPos.y <= corners_t.bottomRight.y; currentGridPos.y++) {
                    eachGrid = world.grid[currentGridPos.x][currentGridPos.y];
                    if (!(eachFeatureGrid = eachGrid.features[toUpdate.trackingId])) {
                        eachFeatureGrid = eachGrid.features[toUpdate.trackingId] = { feature: toUpdate } as any;
                    }
                    if (!eachFeatureGrid.occupied) {
                        eachGrid.touched = "#00ff00";
                    }
                    eachFeatureGrid.occupied = true;
                    eachFeatureGrid.touched = true;
                }
            }

            corners_t.topLeft.x = Math.floor((lastMapPos.x - toUpdate.scaleSizeR) / world.gridSize.x);
            corners_t.topLeft.y = Math.floor((lastMapPos.y - toUpdate.scaleSizeR) / world.gridSize.y);
            corners_t.bottomRight.x = Math.floor((lastMapPos.x + toUpdate.scaleSizeR) / world.gridSize.x);
            corners_t.bottomRight.y = Math.floor((lastMapPos.y + toUpdate.scaleSizeR) / world.gridSize.y);
            for (currentGridPos.x = corners_t.topLeft.x; currentGridPos.x <= corners_t.bottomRight.x; currentGridPos.x++) {
                for (currentGridPos.y = corners_t.topLeft.y; currentGridPos.y <= corners_t.bottomRight.y; currentGridPos.y++) {
                    eachGrid = world.grid[currentGridPos.x][currentGridPos.y];
                    if (eachFeatureGrid = eachGrid.features[toUpdate.trackingId]) {
                        if (eachFeatureGrid.touched == false && eachFeatureGrid.occupied == true) {
                            eachFeatureGrid.occupied = false;
                            eachGrid.touched = "#ff0000";
                        }
                        eachFeatureGrid.touched = false;
                    }
                }
            }
            lastMapPos.x = toUpdate.mapPos.x;
            lastMapPos.y = toUpdate.mapPos.y;
        };
        static unRegister(mapFeature: Trackable, world: World) {
            // Set up to update grid!
            if (!mapFeature.trackingId) {
                return;
            }

            world.physics[mapFeature.trackingId] = undefined;

            let currentGridPos = new Coord();
            let corners = { topLeft: new Coord(), topRight: new Coord(), bottomLeft: new Coord(), bottomRight: new Coord() };
            let eachGrid: WorldGrid;
            let eachFeatureGrid: WorldGridFeature
            corners.topLeft.x = Math.floor((mapFeature.mapPos.x - mapFeature.scaleSizeR) / world.gridSize.x);
            corners.topLeft.y = Math.floor((mapFeature.mapPos.y - mapFeature.scaleSizeR) / world.gridSize.y);
            corners.bottomRight.x = Math.floor((mapFeature.mapPos.x + mapFeature.scaleSizeR) / world.gridSize.x);
            corners.bottomRight.y = Math.floor((mapFeature.mapPos.y + mapFeature.scaleSizeR) / world.gridSize.y);
            // Untouch features
            world.queryGrid(corners);
            // console.log(world.gridFeaturesCounter);
            // console.log(world.gridFeaturesKeys);
            // console.log(world.gridFeatures);
            //debugger;
            for (world.index = 0; world.index < world.gridFeaturesCounter; world.index++) {
                eachFeatureGrid = world.gridFeatures[world.gridFeaturesKeys[world.index]];
                if (eachFeatureGrid.feature.active && eachFeatureGrid.occupied && eachFeatureGrid.feature.trackingId !== mapFeature.trackingId) {
                    MapFeature.unTouch(eachFeatureGrid.feature, mapFeature, eachFeatureGrid.feature.touchReturn, 0);
                }
            }
            for (currentGridPos.x = corners.topLeft.x; currentGridPos.x <= corners.bottomRight.x; currentGridPos.x++) {
                for (currentGridPos.y = corners.topLeft.y; currentGridPos.y <= corners.bottomRight.y; currentGridPos.y++) {
                    eachGrid = world.grid[currentGridPos.x][currentGridPos.y];

                    if (!(eachFeatureGrid = eachGrid.features[mapFeature.trackingId])) {
                        eachFeatureGrid = eachGrid.features[mapFeature.trackingId] = { feature: mapFeature } as any;
                    }
                    if (!eachFeatureGrid.occupied) {
                        eachGrid.touched = "#ff0000";
                    }
                    eachFeatureGrid.occupied = false;
                    eachFeatureGrid.touched = false;
                }
            }
            mapFeature.registered = false;
        }
        static register(mapFeature: Trackable, world: World) {
            if (!Trackable.trackingSerialNumber)
                Trackable.trackingSerialNumber = 0;
            if (mapFeature.trackingId && mapFeature.registered) {
                return; // already registered
            }

            if (!mapFeature.trackingId) {
                Trackable.trackingSerialNumber++;
                mapFeature.trackingId = Trackable.trackingSerialNumber * 1;
            }
            else {
                // Consider tracking Id conflict resolution here?
                if (world.physics[mapFeature.trackingId]) {
                    debugger;
                };
            }

            mapFeature.currentWorld = world;

            if (!mapFeature.mapPos) {
                return;
            }

            mapFeature.gridPos = new Coord({ x: Math.floor(mapFeature.mapPos.x / world.gridSize.x), y: Math.floor(mapFeature.mapPos.y / world.gridSize.y) });

            world.physics[mapFeature.trackingId] = {};

            // Set up to update grid!
            let currentGridPos = new Coord();
            let corners_t = { topLeft: new Coord(), topRight: new Coord(), bottomLeft: new Coord(), bottomRight: new Coord() };
            let eachGrid: WorldGrid;
            let eachFeatureGrid: WorldGridFeature
            if (mapFeature.scaleSizeR) {
                corners_t.topLeft.x = Math.floor((mapFeature.mapPos.x - mapFeature.scaleSizeR) / world.gridSize.x);
                corners_t.topLeft.y = Math.floor((mapFeature.mapPos.y - mapFeature.scaleSizeR) / world.gridSize.y);
                corners_t.bottomRight.x = Math.floor((mapFeature.mapPos.x + mapFeature.scaleSizeR) / world.gridSize.x);
                corners_t.bottomRight.y = Math.floor((mapFeature.mapPos.y + mapFeature.scaleSizeR) / world.gridSize.y);
            }
            else if (mapFeature.scaleSize) {
                corners_t.topLeft.x = Math.floor((mapFeature.mapPos.x - (mapFeature.scaleSize.x / 2)) / world.gridSize.x);
                corners_t.topLeft.y = Math.floor((mapFeature.mapPos.y - (mapFeature.scaleSize.y / 2)) / world.gridSize.y);
                corners_t.bottomRight.x = Math.floor((mapFeature.mapPos.x + (mapFeature.scaleSize.x / 2)) / world.gridSize.x);
                corners_t.bottomRight.y = Math.floor((mapFeature.mapPos.y + (mapFeature.scaleSize.y / 2)) / world.gridSize.y);
            }

            for (currentGridPos.x = corners_t.topLeft.x; currentGridPos.x <= corners_t.bottomRight.x; currentGridPos.x++) {
                for (currentGridPos.y = corners_t.topLeft.y; currentGridPos.y <= corners_t.bottomRight.y; currentGridPos.y++) {
                    eachGrid = world.grid[currentGridPos.x][currentGridPos.y];
                    if (!(eachFeatureGrid = eachGrid.features[mapFeature.trackingId])) {
                        eachFeatureGrid = eachGrid.features[mapFeature.trackingId] = { feature: mapFeature } as any;
                    }
                    if (!eachFeatureGrid.occupied) {
                        eachGrid.touched = "#00ff00";
                    }
                    eachFeatureGrid.occupied = true;
                    eachFeatureGrid.touched = true;
                }
            }
            if ((mapFeature as Movable).trackMe) {
                //let lastGridPos = new Coord({ x: Math.floor(mapFeature.mapPos.x / world.gridSize.x), y: Math.floor(mapFeature.mapPos.y / world.gridSize.y) });
                let lastMapPos = new Coord({ x: mapFeature.mapPos.x, y: mapFeature.mapPos.y });

                (mapFeature as Movable).trackMe({
                    callbackFn: (tracker, tracked: Trackable, distance) => {
                        Trackable.updateGrid(tracked, world, corners_t, currentGridPos, eachGrid, eachFeatureGrid, lastMapPos);
                    },
                    stopFn: (tracker, tracked) => {
                    },
                    trackTolerance: 1
                });

            }
            if (mapFeature.attachTo) {
                (mapFeature).updateGrid = (lastMapPos: Coord) => {
                    Trackable.updateGrid(mapFeature, world, corners_t, currentGridPos, eachGrid, eachFeatureGrid, lastMapPos);
                }
            }
            //Trackable.updateGrid(mapFeature, world, mapFeature.gridPos);
            //MapFeature.touch(mapFeature, world.sun, mapFeature.touchReturn, mapFeature.distance = -1);
            if ((mapFeature as PhysicalObject).luminance !== undefined) {
                world.sun.luminate(mapFeature as PhysicalObject);
            }

            mapFeature.registered = true;
        }
    }
    export interface IAmbient extends IMapFeature, ITrackable {
        expires?: number;
    }
    export class Ambient extends MapFeature implements Trackable {
        trackingId: number;
        changed?: boolean;
        expires: number;
        constructor(param: IAmbient) {
            super(param);
            this.constructorKey = param.constructorKey || 'Ambient';
            this.expires = param.expires || 0;
        }

        applyTo(target: any) {

        }
        addSelf(nullPlaceholder, world: World) {
            world.addAmbient(this);
        }
    }
    export interface ILightSource extends IAmbient {
        center?: number;
        illumination?: number;
        expires?: number;
    }
    export class LightSource extends Ambient {
        centerR: number;
        edgeR: number;
        scaleCenterR: number;
        scaleEdgeR: number;
        illumination: number;
        distance: number;
        color?: string = "#fff";
        constructor(param: ILightSource) {
            super(param);
            this.constructorKey = param.constructorKey || 'LightSource';
            this.centerR = param.center / 2 || this.sizeD / 2;
            this.scaleCenterR = this.centerR * this.scale;
            this.edgeR = this.sizeR * .9;
            this.scaleEdgeR = this.edgeR * this.scale;
            this.illumination = param.illumination || 85;
            let adjustedLuminance: number;
            let lastDistance: number = -1;
            this.aafeatureName = param.featureName || "Light Source";
        }
        onTouch(feature: PhysicalObject, distance?: number): TouchResponse {
            // when LightSouce touch PhysicalObject
            if (feature.mass) {
                // This is where shadow clipping happens!
                this.touchReturn.isClipping = true;
            }
            else
                this.touchReturn.isClipping = false;

            return this.touchReturn;
        }

        luminate(physicalObject: PhysicalObject, distance?: number, adjustedLuminance?: number) {
            if (!distance && this.mapPos) {
                distance = this.mapPos.distanceTo(physicalObject.mapPos);
            }
            if (!adjustedLuminance && distance > -1) {
                adjustedLuminance = distance > this.scaleEdgeR ? 0 :
                    distance <= this.scaleCenterR ? this.illumination : (1 - ((distance - this.scaleCenterR) / (this.scaleEdgeR - this.scaleCenterR))) * this.illumination;
            }
            adjustedLuminance = adjustedLuminance > 100 ? 100 : adjustedLuminance < 0 ? 0 : adjustedLuminance;
            if (!(adjustedLuminance >= 0)) {
                adjustedLuminance = this.illumination;
            }

            this.setIlluminator(physicalObject, distance === -1 ? -1 : adjustedLuminance, this);
            
            physicalObject.currentWorld.getByTrackingId(physicalObject.trackingId, VisibleMapFeature.adjustLuminanceAsync);
        }

        setIlluminator (physicalObject: PhysicalObject, adjustedLuminance: number, illuminator = this) {
            if (physicalObject.illuminators[illuminator.trackingId] == undefined) {
                physicalObject.illuminatorsIdKeys.push(`${illuminator.trackingId}`);
                physicalObject.illuminators[illuminator.trackingId] = {
                    casting: false,
                    inFront: false,
                    illumination: adjustedLuminance
                }
            }
            // if (this.mapPos) {
            //     let physicalObjectSizeD = physicalObject.scaleSizeD ? physicalObject.scaleSizeD : physicalObject.scaleSize.x;
            //     // Check casting elevation change
            //     if (Math.floor(physicalObject.elevation) === Math.floor(illuminator.elevation) &&
            //         physicalObjectSizeD > illuminator.scaleSizeD / 2) {
            //             physicalObject.illuminators[illuminator.trackingId].casting = true;
            //     }
            //     else {
            //         physicalObject.illuminators[illuminator.trackingId].casting = false;
            //     }
            //     // Check inFront position
            //     physicalObject.illuminators[illuminator.trackingId].inFront = physicalObject.mapPos.y < illuminator.mapPos.y
            //     // Check luminance change
            //     // if (Math.abs(physicalObject.illuminators[illuminator.trackingId].illumination - adjustedLuminance) > 1) {
            //     // }
            // } else
            {
                physicalObject.illuminators[illuminator.trackingId].casting = false;
                physicalObject.illuminators[illuminator.trackingId].inFront = false;
            }
            physicalObject.illuminators[illuminator.trackingId].illumination = adjustedLuminance;
        }

    }
    export interface ISoundSource extends IAmbient {
    }
    export class SoundSource extends Ambient {
    }
    export interface IDamageBox extends IAmbient {
        attacker?: Attacker;
        attack?: Attack;
        expires?: number;
        cooldown?: number;
    }
    export class DamageBox extends Ambient {
        attacker?: Attacker;
        ambientAttack: Attack;
        cooldown: number;
        cooldownCounter: number;

        constructor(params: IDamageBox) {
            super(params);
            this.constructorKey = params.constructorKey || 'DamageBox';
            this.ambientAttack = params.attack || new Attack({});
            this.attacker = params.attacker;
            this.expires = params.expires || (1 * 60 * 60);
            this.cooldownCounter = this.cooldown = params.cooldown || 30;
        }

        onTouch(feature: PhysicalObject, distance?: number): TouchResponse {
            if ((feature as any).currentVital) {
                this.touchReturn.isClipping = true;
            }
            else
                this.touchReturn.isClipping = false;
            return this.touchReturn;
        }

        applyTo(target: Attackable): number {
            return this.ambientAttack.execute(target, this.attacker);
        }
    }
    export interface ICommand {
        commandFn: (self?: Commandable, commanding?: MapFeature) => any;
        endFn?: (self?: Commandable) => any;
        name?: string;
    }
    export class Command {
        active: boolean = false;
        notifiers: (() => any)[];
        currentGameFrame: number;
        constructor(
            public commandFn?: (self?: Commandable, commanding?: MapFeature, command?: Command) => any,
            public endFn?: (self?: Commandable, command?: Command) => (boolean | ((self?: Commandable) => any)),
            public name?: string) {
            if (!this.endFn) {
                this.endFn = (() => { return true; });
            }

            if (!this.name)
                this.name = "";

            this.active = true;
        }
        end(self?: Commandable) {
            return this.endFn(self);
        }
    }
    export interface ICommandable {
    }
    export class Commandable {
        public aiFrameTicks: number; // every n frames allow gameframe()
        protected aiFrameTickCounter: number;
        public commandList: Command[] = [];
        public active: boolean;
        //protected frameFn?: ((any) => any)[];
        constructor(public commanding: MapFeature) {
            this.aiFrameTicks = 1;
            this.aiFrameTickCounter = Math.floor(Math.random() * 60);
            this.active = true;
        }

        endCommands(self?: Commandable): (() => any)[] {
            if (!self)
                self = this;

            let beforeCount = this.commandList.length;
            let notifiers = [];
            let index = 0;
            let commandLength = self.commandList.length;
            let eachCommand: Command;
            for (index = 0; index < commandLength; index++) {
                if (!(eachCommand = self.commandList[index]).active)
                    continue;
                let shouldEnd = eachCommand.endFn(self, eachCommand); // if the command trys to end, but HAS to stay persistant, it will return false here!
                if (typeof (shouldEnd) != "boolean")
                    notifiers[notifiers.length] = shouldEnd;

                eachCommand.active = !shouldEnd;

                //return !shouldEnd;
            }
            // console.log(`${self.commanding.trackingId}) Ended commands. commands: ${self.commandList.length}/${beforeCount}`);
            // console.log(self.commandList.concat(self.newCommands));

            return notifiers;
        }

        notify(notifications?: ((self?: Commandable) => any)[]) {
            let self = this;
            notifications.forEach((eachNotification) => {
                eachNotification(self);
            });
        }

        addCustomCommand(commandFn, endFn?, name?: string) {
            let returnCommand: Command = new Command(commandFn, endFn, name);
            return this.pushCommand(returnCommand);
        }
        addCommand(command: Command, name?: string, notifiers?: any): Command {
            let thisCommand: Command = new Command(command.commandFn, command.endFn, command.name + name);
            thisCommand.notifiers = notifiers;
            return this.pushCommand(thisCommand);

        }

        gameFrame(self?: Commandable, frameFn?: (any?) => any): boolean {
            if (!self)
                self = this;

            self.aiFrameTickCounter--;
            if (self.aiFrameTickCounter > 0)
                return false;

            self.aiFrameTickCounter = self.aiFrameTicks;

            if (frameFn) {
                frameFn();
            }
            let index = 0;
            let eachCommand: Command;
            let commandLength = self.commandList.length;
            let activeCommandsLength = 0;
            for (index = 0; index < commandLength; index++) {
                eachCommand = self.commandList[index];
                if (eachCommand && eachCommand.active) {
                    activeCommandsLength++;
                    eachCommand.active = !eachCommand.commandFn(self, self.commanding, eachCommand);
                }
            }
            //.concat(self.newCommands);
            if (activeCommandsLength > 4) // Currently, 5 concurrent commands are too much
                debugger;

            return true;
        }
        pushCommand(command: Command): Command {
            for (let index = 0; index < this.commandList.length; index++) {
                if (!this.commandList[index] || !this.commandList[index].active) {
                    return this.commandList[index] = command;
                }
            }
            //this.commandList.push(command);
            this.commandList[this.commandList.length] = command;
            return command;
        }
        currentTick(): boolean {
            return this.aiFrameTickCounter - 1 < 1;
        }
    }
    export interface IInteractionAI extends ICommandable {

    }
    export class AIMemory {
        currentDistance?: number;
        frameToObserve?: number;

        lastKnownMapPos?: ICoord;
        lastFrameObserved?: number;
    }
    export interface AIMemoryObject {
        [index: string]: AIMemory;
        [index: number]: AIMemory;
    }
    export class InteractionAI extends Commandable {
        // Unit AI allows for observation of other units
        memoryIndex: string[] = [];
        unitMemory: AIMemoryObject = {};
        observedUnitId: number;
        observedUnit: MapFeature;
        closest: number;
        closestId: number;
        protected world: World;

        static _gameFrame = Commandable.prototype.gameFrame;
        constructor(public commanding: MapFeature) {
            super(commanding);
        }
        gameFrame(self?: InteractionAI, frameFn?: (any?) => any): boolean {
            if (!self)
                self = this;

            return InteractionAI._gameFrame(self, () => {
                { // determine observed unit
                    // let observedUnitId: number, leastObserved: number, totalScoped = 0, closest = 0, currentDistance = 0, closestId: number;
                    // let observedUnit: MapFeature;
                    // self.unitScope.forEach((active, trackingId) => {
                    //     if (!active || !trackingId || trackingId == (self.commanding as any).trackingId)
                    //         return false;

                    //     let memory = self.unitMemory[trackingId];
                    //     if (!memory) {
                    //         memory = self.unitMemory[trackingId] = { lastObserved: self.world.gameFrames };
                    //     }
                    //     let lastObserved = memory.lastObserved;
                    //     if (!leastObserved || lastObserved < leastObserved) {
                    //         leastObserved = lastObserved;
                    //         observedUnitId = trackingId;
                    //         observedUnit = active;
                    //     }
                    //     currentDistance = memory.currentDistance || 0;
                    //     if (!closest || currentDistance < closest) {
                    //         closest = currentDistance;
                    //         closestId = trackingId;
                    //     }
                    //     totalScoped++;
                    //     return true;
                    // });
                    // this.observedUnitId = observedUnitId;
                    // this.closestId = closestId;
                    // this.closest = closest;
                    // this.observedUnit = observedUnit;
                    // self.totalScoped = totalScoped;
                }

                if (frameFn)
                    frameFn();

                return true;
            });
        }
        attach(world: World) {
            this.world = world;
        }
        remove() {
            this.world = null;
        }
    }
    export interface IMoveAI extends IInteractionAI {
    }
    export class MoveAI extends InteractionAI {
        tracking?: Movable;
        targetPos?: Coord;  // This is where I WANT to stand,
        gotoCommand?: Command;
        closestUnitDistance?: number;
        closestUnitTrackingId?: number;
        closestUnit?: Trackable;

        static _gameFrame = InteractionAI.prototype.gameFrame;
        static GotoCommand = new Command((self: MoveAI, commanding: Movable) => {
            self.setFacing(self.targetPos);
            if (commanding.mapPos.distanceTo(self.targetPos) < (8)) {
                commanding.facing.setDelta({ angle: commanding.facing.angle, velocity: 0 });
                return true;
            }
            return false;
        },
            (self: MoveAI) => {
                return true;
            },
            `Goto`);
        constructor(public commanding: Movable) {
            super(commanding);
            this.targetPos = new Coord(commanding.mapPos);
        }

        goTo(targetCoord: ICoord, precision?: number): Command {
            // command to set unit to go to this position!
            if (this.commanding.mapPos.distanceTo(targetCoord) >= (precision || 8)) {
                this.targetPos.x = targetCoord.x;
                this.targetPos.y = targetCoord.y;
                if (!this.gotoCommand || !this.gotoCommand.active) {
                    this.gotoCommand = this.addCommand(MoveAI.GotoCommand);
                }
            }
            return this.gotoCommand;
            // if we are line-of-sight just issue a command
        }

        track(target: Movable, range?: number) {
            //let self = this;
            if (this.tracking) {
                this.tracking = undefined;
                console.log("Already tracking...");
                this.endCommands();
            }
            this.tracking = target;
            range = range || 2;
            let trackCommand;
            trackCommand = this.addCustomCommand((self: MoveAI, commanding: Movable) => {
                if (!self.tracking)
                    return true;

                if (self.tracking.mapPos.distanceTo(self.targetPos) > range) {
                    self.goTo(self.tracking.mapPos, range);
                }

                return false;
            },
                (self: MoveAI) => {
                    return (self: MoveAI) => {
                        trackCommand = self.addCustomCommand(trackCommand.commandFn, trackCommand.endFn, trackCommand.name);
                    };
                },
                `Track ${target.trackingId}/${this.commanding.trackingId}`);

        }

        // setFacing(targetPos?: Coord) {
        //     this.reaim(targetPos);
        // }
        setFacing(targetPos?: ICoord) {

            if (!targetPos)
                targetPos = this.targetPos;
            else {
                this.targetPos.x = targetPos.x;
                this.targetPos.y = targetPos.y;
            }

            // Adjust facing momentum to approach the target!
            let unit = this.commanding;
            let moveSpeed = unit.moveSpeeds.velocity;
            let angleSpeed = unit.moveSpeeds.angle;

            // Adjust angle!
            let targetAngle = unit.mapPos.angleTo(targetPos);
            let angleAdjust = unit.facing.angleDiff(targetAngle);
            if (Math.abs(angleAdjust) > angleSpeed) {
                angleAdjust = angleSpeed * Nums.sign(angleAdjust);
            }
            unit.facing.angle = (unit.facing.angle + angleAdjust + 360) % 360;
            let moveDist = unit.mapPos.distanceTo(targetPos);
            if (moveDist < moveSpeed) {
                moveSpeed = moveDist;
            }
            unit.facing.velocity = moveSpeed;
            unit.facing.setDelta();

        }

        gameFrame(self?: MoveAI, frameFn?: (any?) => any): boolean {
            if (!self)
                self = this;

            return MoveAI._gameFrame(self, () => {
                if (frameFn)
                    frameFn();

                if (self.commandList.length < 1) {
                    let unit = self.commanding;

                    self.commandList[0] = new Command(() => {
                        unit.facing.setDelta({ angle: unit.facing.angle, velocity: 0 });
                        //self.targetPos = undefined;
                        return false;
                    }, null, "Idle");
                }
                return true;
            });

        }
    }
    export interface IMovable extends IMapFeature, ITrackable {
        moveSpeed?: number;
        turnSpeed?: number;
        facingAngle?: number;
        moveFn?: () => any;
    }

    export class Movable extends MapFeature implements Trackable {
        public mapPos: Coord;
        public moveSpeeds: IMomentum;
        public facing: Momentum;
        public momentum: Momentum;
        public ai: MoveAI;
        colliding: boolean = false;
        distance: number

        // This function should incorporate momemtum with its check
        private moveFn: (toCheck: { [index: string]: WorldGridFeature }, toCheckLength: number, toCheckKeys: string[], useMomentum: boolean) => IActivity[];
        private trackerCounter = 0;
        private trackers: { tracker: Movable, trackFn: (tracker?: Movable, tracked?: MapFeature, distance?: number) => any, stopFn?: (tracker?: Movable, tracked?: MapFeature) => any }[] = [];
        private trackTolerance?: number;
        trackingId?: number;
        private lastTracked?: Coord;
        private stopped: boolean = false;
        constructor(paramObject: IMovable) {
            super(paramObject);
            this.mapPos = paramObject.mapPos ? new Coord(paramObject.mapPos) : (this.mapPos ? this.mapPos : new Coord({ x: 20, y: 20 }));
            this.moveFn = paramObject.moveFn || this.doTouches;
            this.momentum = new Momentum();
            this.facing = new Momentum({ velocity: 0, angle: paramObject.facingAngle || 0 });
            this.moveSpeeds = { velocity: paramObject.moveSpeed, angle: paramObject.turnSpeed };
        }

        doMove(toCheck: { [index: string]: WorldGridFeature }, toCheckLength: number, toCheckKeys: string[]) {
            if (!this.mapPos || !this.active)
                return;
            this.ai.closestUnitTrackingId = 0;
            this.colliding = false;

            if (this.momentum.velocity > 0 && toCheckLength > 0) {
                this.moveFn(toCheck, toCheckLength, toCheckKeys, true);
            }

            if (this.momentum.velocity < .01 || this.colliding) {
                if (!this.stopped) {
                    this.stopped = true;
                    let self = this;
                    this.trackers.forEach((eachTracker) => {
                        if (eachTracker.stopFn)
                            eachTracker.stopFn(eachTracker.tracker, self);
                    });
                }
            }
            else {
                this.stopped = false;
                this.colliding = false;
            }
            if (!this.colliding && !this.stopped) {
                this.moveTo({ x: this.mapPos.x + this.momentum.delta.x, y: this.mapPos.y + this.momentum.delta.y });
                return;
            }
        }

        moveTo(targetCoord: ICoord) {
            let eachTracker;
            // immediately set map position to targetCoord
            //this.mapPos = targetCoord;
            this.mapPos.x = targetCoord.x;
            this.mapPos.y = targetCoord.y;

            // this.touchThem = true;
            // this.beTouched = true;

            if (this.lastTracked) {
                // let distance: number;
                if ((this.distance = this.mapPos.distanceTo(this.lastTracked)) > this.trackTolerance && !this.stopped) {
                    this.lastTracked.x = this.mapPos.x;
                    this.lastTracked.y = this.mapPos.y;
                    // call our trackers!!
                    for (let trackerCounter = this.trackerCounter = 0; trackerCounter < this.trackers.length; trackerCounter++) {
                        eachTracker = this.trackers[trackerCounter];
                        eachTracker.trackFn(eachTracker.tracker, this, this.distance);
                    }
                }
            }
        }
        trackMe(param: { callbackFn: (tracker?: Movable, tracked?: MapFeature, distance?: number) => any, stopFn?: (tracker?: Movable, tracked?: MapFeature) => any, tracker?: Movable, trackTolerance?: number }) {
            this.trackTolerance = param.trackTolerance || this.trackTolerance || 5;
            this.trackers.push({ tracker: param.tracker, trackFn: param.callbackFn, stopFn: param.stopFn });
            if (!this.lastTracked) {
                this.lastTracked = new Coord(this.mapPos);
            }
        }
        stopTrackingMe(tracker: Movable) {
            this.trackers = this.trackers.filter((eachTracker) => {
                return eachTracker.tracker.trackingId !== tracker.trackingId;
            });
        }

        cross(target: Coord) {
            let targetDistance = target.distance();
            let facingAngleRadians = Momentum.mathPIover180 * this.facing.angle;
            return (Math.cos(facingAngleRadians) * targetDistance) * target.y - (Math.sin(facingAngleRadians) * targetDistance) * target.x;
        }
        export(self?: Movable, child?: IMovable): IMovable {
            self = self || this;
            child = MapFeature.prototype.export(self, child || {});
            child.trackingId = self.trackingId;
            child.facingAngle = self.facing.angle;
            child.moveSpeed = self.moveSpeeds.velocity;
            child.turnSpeed = self.moveSpeeds.angle;
            child.constructorKey = 'Movable';
            return child;
        }

    }

//** Vitals/Combat
    export interface IRule {
        apply?: Function;
        expire?: number;
    }
    export class Rule {
        apply: Function;
        expire: number;
        constructor(ruleParam: IRule) {
            this.apply = ruleParam.apply || (() => { return; });
            this.expire = ruleParam.expire || 1;
        }
    }
    export interface IDamageRuleApply {
        baseAttack: Attack;
        attacker: Attacker;
        defender: Attackable
    }
    export interface IDamageRule extends IRule {
        rawDamages?: Damages;
        percentDamages?: Damages;
        bonusHpPercentDamages?: Damages;
    }
    export class DamageRule extends Rule {
        private rawDamages: Damages;
        private percentDamages: Damages;
        private bonusHpPercentDamages: Damages;
        apply: (applyParam: IDamageRuleApply) => Attack;
        constructor(ruleParam: IDamageRule) {
            super(ruleParam);

            this.rawDamages = ruleParam.rawDamages || { melee: 0, ability: 0 };
            this.percentDamages = ruleParam.percentDamages || { melee: 0, ability: 0 }
            this.bonusHpPercentDamages = ruleParam.bonusHpPercentDamages || { melee: 0, ability: 0 };

            if (!ruleParam.apply) {
                this.apply = ((param: IDamageRuleApply) => {
                    let cumulativeAttack = param.baseAttack;
                    let targetMaxHp = param.defender.currentVital.max['HP'];
                    cumulativeAttack.damages.ability += this.rawDamages.ability;
                    cumulativeAttack.damages.melee += this.rawDamages.melee;
                    cumulativeAttack.damages.melee += targetMaxHp * (this.bonusHpPercentDamages.melee / 100);
                    cumulativeAttack.damages.ability += targetMaxHp * (this.bonusHpPercentDamages.ability / 100);
                    cumulativeAttack.damages.ability += cumulativeAttack.damages.ability * ((this.percentDamages.ability) / 100);
                    cumulativeAttack.damages.melee += cumulativeAttack.damages.melee * ((this.percentDamages.melee) / 100);
                    if (cumulativeAttack.damages.melee < 0)
                        cumulativeAttack.damages.melee = 0;
                    if (cumulativeAttack.damages.ability < 0)
                        cumulativeAttack.damages.ability = 0;
                    return cumulativeAttack;
                });
            }
        }
    }
    export class Rules {

        rules?: Rule[];

        constructor() {

        }

        addRule(ruleParams: IRule | any) {
            this.rules.push(new Rule(ruleParams));
        }

        applyRules(applyParam: { applyTo: any } | any): any {
            if (this.rules)
                this.rules.forEach((eachRule) => {
                    eachRule.apply({ applyTo: applyParam.applyTo });
                });
            return applyParam.applyTo;
        }

    }
    export class DamageRules extends Rules {
        rules?: DamageRule[];
        constructor() {
            super();
        }
        addRule(ruleParams: IDamageRule) {
            this.rules.push(new DamageRule(ruleParams));
        }
        applyRules(applyParam: IDamageRuleApply): Attack {
            let damages = new Damages(applyParam.baseAttack.damages);
            //let rules = applyParam.baseAttack.rules;
            let rules = this.rules;
            let attack = {
                damages: { melee: damages.melee, ability: damages.ability }
            } as Attack;
            if (rules) {
                rules.forEach((eachRule) => {
                    attack = eachRule.apply({ baseAttack: attack, attacker: applyParam.attacker, defender: applyParam.defender });
                });
            }
            return new Attack(attack);
        }

        export () {
            return {};
        }
    }
    export interface IVitals {
        hp?: number;
        mp?: number;
        hpString?: string;
        maxHp?: number;
        mpString?: string;
        maxMp?: number;
        current?: { [vitalKey: string]: number };
        max?: { [vitalKey: string]: number };
        vitalKeys?: string[];
    }
    export class Vitals {
        public current: { [vitalKey: string]: number } = {};
        public max: { [vitalKey: string]: number } = {};
        public vitalKeys: string[] = [];

        // public hp: number;
        // public mp: number;
        // public hpString: string;
        // public maxHp: number;
        // public mpString: string;
        // public maxMp: number;
        notifiers: ((currentVital: Vitals) => any)[] = [];

        constructor(params: IVitals) {
            // this.hp = this.maxHp = params.maxHp || 1;
            // this.mp = this.maxMp = params.maxMp || 1;
            // this.hpString = params.hpString || "HP";
            // this.mpString = params.mpString || "MP";
            if (params.max) {
                this.vitalKeys = Object.keys(params.max);
                this.vitalKeys.forEach((eachKey) => {
                    this.current[eachKey] = this.max[eachKey] = params.max[eachKey];
                })
                return;
            }
            this.current['HP'] = (this.max['HP'] = params.maxHp || 1) * 1;
            this.current['MP'] = (this.max['MP'] = params.maxMp || 1) * 1;
            this.vitalKeys = ['HP', 'MP'];
        }
        spend(key: string, amount: number, overSpend?: boolean): boolean {
            var spendTo: number = this.current[key] - amount;
            if (spendTo < 0 && !overSpend) {
                return false; // not enough
            }
            this.current[key] = spendTo;
            this.notify(this);
            return true;  // success
        }
        restore(key: string, amount: number): number {
            var restoreTo: number = this.current[key] + amount,
                diff: number = restoreTo - this.max[key];
            if (diff < 0) {
                this.current[key] = restoreTo;
                return 0;
            }
            this.current[key] = this.max[key];
            this.notify(this);
            return diff;
        }

        restoreHP(amount: number) {
            return this.restore('HP', amount);
        }
        restoreMP(amount: number) {
            return this.restore('MP', amount);
        }
        spendHP(amount: number) {
            return this.spend('HP', amount, true);
        }
        spendMP(amount: number) {
            return this.spend('MP', amount);
        }
        notify(self: Vitals) {
            if (self.notifiers.length)
                for (let i = 0; i < self.notifiers.length; i++) {
                    self.notifiers[i](self);
                }
        }

        export(): IVitals {
            return {
                hp: this.current['HP'],
                mp: this.current['MP'],
                maxHp: this.max['HP'],
                maxMp: this.max['MP']
            }
        }
    }
    export interface IDamages {
        melee?: number;
        ability?: number;
    }
    export class Damages {
        melee: number = 0;
        ability: number = 0;
        constructor(param?: IDamages) {
            if (param) {
                this.melee = param.melee || 0;
                this.ability = param.ability || 0;
            }
        }
    }
    export interface IDefenseRule extends IDamageRule {
    }
    export class DefenseRule extends DamageRule {
        constructor(ruleParams: IDefenseRule) {
            super(ruleParams);
        }
    }
    export interface IDefense {
        rules?: DefenseRule[];
    }
    export class Defense extends DamageRules {
        public rules: DefenseRule[];
        constructor(defenseParams?: IDefense) {
            super();
            if (!defenseParams)
                return;
            this.rules = defenseParams.rules || [];
        }
        addRule(ruleParams: IDefenseRule) {
            this.rules.push(new DefenseRule(ruleParams));
        }

    }
    export interface IAttackRule extends IDamageRule {
    }
    export class AttackRule extends DamageRule {
        constructor(ruleParam: IAttackRule) {
            super(ruleParam);
        }
    }
    export interface IAttack {
        rules?: AttackRule[];
        damages?: Damages;
    }
    export class Attack extends DamageRules {
        public rules: AttackRule[];
        public damages: Damages;

        constructor(attackParams: IAttack) {
            super();
            this.rules = attackParams.rules || [];
            this.damages = attackParams.damages || { melee: 10, ability: 0 };
        }
        addRule(ruleParams: IAttackRule) {
            this.rules.push(new AttackRule(ruleParams));
        }
        getDamage() {
            // Remember to run the rules!
            return this.damages.melee + this.damages.ability;
        }
        getAppliedDamage(target: Attackable, executor: Attacker): number {
            //let attack = new Attack(executor ? executor.currentAttack.attack : this);
            let attack = new Attack(this.damages ? this : executor.currentAttack.attack);
            return Math.floor(target.currentDefense.applyRules({ baseAttack: attack.applyRules({ baseAttack: attack, attacker: executor, defender: target }), attacker: executor, defender: target }).getDamage());
        }

        execute(target: Attackable, executor?: Attacker): number {
            // performs the attack on the target
            var totalHp = this.getAppliedDamage(target, executor);
            if (totalHp) {
                var alive = target.currentVital.spendHP(totalHp);
            }
            return totalHp || 0;

        }
    }
    export interface IAttackable extends IPhysicalObject {
        defense?: IDefense;
        vitals?: IVitals;
    }
    export class Attackable extends PhysicalObject {
        // vitals
        public currentVital: Vitals;
        public currentDefense: Defense;
        public mapPos: Coord;
        public baseVital: Vitals;
        public baseDefense: Defense;
        constructor(paramObject: IAttackable) {
            super(paramObject);
            this.currentVital = new Vitals(this.baseVital = new Vitals(paramObject.vitals));
            this.currentDefense = new Defense(this.baseDefense = new Defense(paramObject.defense));
        }

    }
    export interface IAttacker extends IAttackable {
        attack?: Skill;
    }
    export class Attacker extends Attackable {

        public currentAttack: Skill;
        public baseAttack: Skill;
        public attackTarget: Attackable;
        constructor(paramObject: IAttacker) {
            super(paramObject);
            this.baseAttack = new Skill(this.currentAttack = (paramObject.attack || new Skill({
                attack: new Attack({
                    rules: [],
                    damages: { melee: 1, ability: 0 }
                }),
                cooldown: 15,
                range: 25
            })));
        }

        attack(target: Attackable, attacker?: Attacker): number {
            // performs an attack on the target
            attacker = (attacker || this);
            return attacker.currentAttack.attack.execute(target, attacker);
        }
    }
    export class StatusCommand {
        active: boolean = false;
        notifiers: (() => any)[];
        constructor(
            public commandFn?: (affected?: PhysicalObject & Unit, source?: PhysicalObject & Unit, command?: StatusCommand) => any,
            public endFn?: (affected?: PhysicalObject & Unit, command?: StatusCommand) => (boolean | ((self: StatusCommand) => any)),
            public name?: string
        ) {
        }
    }
    export interface IProjectile extends IMovable {
    }
    export class Projectile extends Movable {
        damageBox?: DamageBox;
        attack?: Attack;
        attacker?: Attacker;
        expires: number;

        constructor(param: IProjectile) {
            super(param);

        }

        gameFrame() {

        }
    }
//** Resources/Items
    export interface IItemStamp {
        name: string,
        size: number,
        weight: number,
        durability: number,
        isMaterial: boolean,
        equipsOn: string,
        craftable: { 
            ingredients: { types: string[], quantity: number},
            maintenance: { types: string[], quantity: number},
            skillsLevels: { [ skillReqired: string ]: number},
            nearby:  { [ nearbyRequired: string ]: number},
            time: number,
            yeilds: number
        },
        destructable: { types: string[], properTypes: string[], drops: number, chance: number }[],
        types: string[],
        properTypes: string[]
    }
    export class BaseItem {
        baseName: string;
        size?: ICoord;
        mass?: number;

        vitals?: Vitals;
        statusCommands?: StatusCommand[];

        constructor() {

        }

        stamp(): Item {
            return new Item();
        }
    }
    export class Item extends BaseItem {
        properName?: string;
        constructor() {
            super();
        }
    }
    export class Inventory {

    }
    export interface IDestructable {
        destructable?: DropType[];
    }
    export class Destructable extends PhysicalObject {
        mass: number = 1;
        luminance: number = 1;

        static DefaultDrop: (eachDrop: DropType, world: World, mapPos: ICoord, chanceMod?: number) => number = (eachDrop, world, dropPos, chanceMod) => {
            let dropped = 0;
            for (let dropsLeft = eachDrop.drops; dropsLeft > 0; dropsLeft--) {
                if (Math.random() <= eachDrop.chance * (chanceMod || 1)) {
                    // get the matching drop item!
                    let droppedItem = {} as any; //world.itemFactory.stampItem(eachDrop.types.concat(eachDrop.properTypes));
                    let itemFeature = world.featureFactory.stampFeature("item", { mapPos: Coord.randomTranslate(dropPos, 30).translate({ x: 0, y: 25 }), scale: .5 }) as DroppedItem;
                    itemFeature.item = droppedItem;
                    world.addFeature(itemFeature);
                    dropped++;
                }
            }
            return dropped;
        };
        destroy(destroyer: MapFeature, world: World): boolean {
            let param = world.featureFactory.getParam(this.factoryName);
            let dropped = 0;
            if (param.destructable) {
                param.destructable.forEach((eachDropType) => {
                    if (Destructable.DefaultDrop(eachDropType, world, this.mapPos)) {
                        //dropped++;
                        world.pushActivity({
                            text: `${dropped}`,
                            unit: destroyer,
                            active: true
                        });
                    }
                });
                // world.pushActivity({
                //     text: `${dropped}`,
                //     unit: destroyer,
                //     active: true
                // });
                this.active = false;
                Trackable.unRegister(this, world);
                return true;
            }
            return false; // Didn't destory!
        }
    }
    export interface IHarvestable {
        harvestable?: DropType[];
    }
    export class Harvestable extends Destructable {
        static DefaultHarvest: () => boolean;

        harvest(harvester: Skilled, world: World): boolean {
            //this.adjustLuminance(Math.random());

            let param = world.featureFactory.getParam(this.factoryName);
            let dropped = 0;
            if (param.harvestable) {
                param.harvestable.forEach((eachDropType) => {
                    if (dropped = Destructable.DefaultDrop(eachDropType, world, this.mapPos)) {
                        //dropped++;
                        world.pushActivity({
                            text: `${dropped}`,
                            unit: harvester,
                            active: true
                        });
                    }
                });
                // world.pushActivity({
                //     text: `${dropped}`,
                //     unit: destroyer,
                //     active: true
                // });
                return true;
            }
            return false; // Didn't destory!
        }
    }
    export class DroppedItem extends PhysicalObject {
        item: Item;

        constructor(param: IMapFeature) {
            super(param);
        }
    }
    export class DropType {
        types: string[];
        properTypes: string[];
        drops: number;
        chance: number;
    }
//** Units
    export class UnitAIMemory {
    }
    export class UnitAI extends MoveAI {
        public attackTarget?: Attackable;
        static _gameFrame = MoveAI.prototype.gameFrame;
        static totalUnitMemories: number = 0;
        constructor(public commanding: Unit) {
            super(commanding);
        }

        gameFrame(self?: UnitAI, frameFn?: () => any): boolean {
            let thisFrame = 0;
            if (!self)
                self = this;
            return UnitAI._gameFrame(self, () => {
                if (frameFn)
                    frameFn();

                // determine which scoped unit to observe
                let observedUnitId: number = self.observedUnitId;
                if (observedUnitId) {

                    // self.unitMemory[observedUnitId].lastObserved = self.world.gameFrames;
                    // let observedUnitMapPos = self.observedUnit.mapPos;
                    // let unit = self.commanding;
                    // let unitMapPos = unit.mapPos;
                    // let calcDelta = SkilledAI._calcDelta;
                    // let faceAngle = unit.facing.angle;
                    // let angleAdjust = 0;

                    // if (unitMapPos.distanceTo(observedUnitMapPos) < unit.sizeR && unit.trackingId != observedUnitId) {
                    //         // self.goTo( unitMapPos
                    //         //     .translate( calcDelta(((unitMapPos.angleTo(observedUnitMapPos) + 180) % 360), 20 ) ));
                    // }

                    // // if (angleAdjust != 0)
                    // //     self.setFacing(unitMapPos.translate(calcDelta(faceAngle + angleAdjust, 75)));

                }
                return true;
            });

        }
        checkScope(target: MapFeature, physics: PhysicsDescription) {
            let trackingId: number = (target as any).trackingId;
            let distance = physics.distance;
            // if (trackingId) {
            //     if (distance < 500) {
            //         if (!this.unitMemory[trackingId]) {
            //             this.unitMemory[trackingId] = { frameToObserve: this.world.gameFrames + 1 }; // never observed this before
            //             console.log(`Memory Added! ${UnitAI.totalUnitMemories++}`);
            //         }
            //     }

            //     if (this.unitMemory[trackingId]) {
            //         this.unitMemory[trackingId].currentDistance = distance;

            if (distance < this.closestUnitDistance) {
                this.closestUnitDistance = distance;
                this.closestUnitTrackingId = trackingId;
                this.closestUnit = target as any;
            }
            //     }
            // }

            return;
        }
    }
    export interface IUnit extends IMovable, IAttackable {
        attack?: ISkill;
        vitals?: IVitals;
        defense?: IDefense;
        moveSpeed?: number;
        mass?: number;
        luminance?: number;
        world?: World;
    }
    export class Unit extends Movable implements PhysicalObject, Attackable {
        public facing: Momentum;
        trackingId: number;
        mass: number;
        luminance: number = 0;
        bathedLuminance: number = 0;
        illuminators = {};
        illuminatorsIdKeys = [];
        public currentVital: Vitals;
        public currentDefense: Defense;
        public baseVital: Vitals;
        public baseDefense: Defense;
        public commandList: Command[] = [];
        public ai: UnitAI;
        adjustLuminance: (asyncFeature: any) => void;
        constructor(paramObject: IUnit) {
            super(paramObject);
            this.constructorKey = paramObject.constructorKey || 'Unit';
            this.onTouch = PhysicalObject.prototype.onTouch;
            this.adjustLuminance = PhysicalObject.prototype.adjustLuminance;

            //Trackable.register(this, paramObject.world);

            this.currentVital = new Vitals(this.baseVital = new Vitals(paramObject.vitals || { maxHp: 100, maxMp: 35 }));

            this.currentDefense = new Defense(this.baseDefense = new Defense(paramObject.defense));

            this.moveSpeeds = { angle: paramObject.turnSpeed || 360, velocity: paramObject.moveSpeed || 5 };

            this.ai = new UnitAI(this);
            if (paramObject.world)
                this.ai.attach(paramObject.world);
            this.ai.aiFrameTicks = 100;
            this.facing = new Momentum();
            this.mass = paramObject.mass || 1;
            this.luminance = paramObject.luminance || 0;
            // this.adjustLuminance = (toLuminance: number) => {
            //     PhysicalObject.adjustSelfLuminance(toLuminance, this);
            // }
        }
        
        addSelf(nullPlaceholder, world: World) {
            world.addUnit(this);
        }

        export(self = this, child?: IUnit): IUnit {
            child = PhysicalObject.prototype.export(self, child || {});
            child = Movable.prototype.export(self, child || {});

            // Attackables
            child.vitals = self.baseVital.export();
            child.defense = self.baseDefense.export();
            child.constructorKey = 'Unit';
            return child;
            
        }
    }
    export interface ISkill extends IAttack {
        name?: string;

        range?: number;
        cooldown?: number;
        attack?: IAttack;
        defense?: IDefense;
        vitals?: IVitals;
    }
    export class Skill {
        public name: string;
        public range: number;
        public cooldown: number;
        public attack?: Attack;
        public defense?: Defense;
        public vitals?: IVitals;

        private skillFunc: Function;

        constructor(skillParam: ISkill) {
            this.range = skillParam.range || 100;
            this.cooldown = skillParam.cooldown || 75;
            this.attack = skillParam.attack ? new Attack(skillParam.attack) : null;
            this.defense = skillParam.defense ? new Defense(skillParam.defense) : null;
            this.vitals = skillParam.vitals || null;
            this.name = skillParam.name || "Basic Attack";
        }

        public use(): boolean {

            // spend potential mp for this skill!
            //this.skillUser;

            return true;
        }

        export(): ISkill {
            return {
                name: this.name,
                range: this.range,
                cooldown: this.cooldown,
                attack: this.attack ? this.attack.export() : null,
                defense: this.defense ? this.defense.export() : null
            }
        }
    }
    export interface SkillNode {
        skill: Skill;
        prereq: SkillNode[];
    }
    export class SkillsTree {
        // this class constructs a skills tree to be used in game
        public Nodes: SkillNode[] = [];

        constructor() {
        }

        addNode(theSkill: Skill, thePrereq: SkillNode[]) {
        }

        getNodes(forSkilled: Skilled): SkillNode[] {
            return [];
        }
    }
    export class SkilledAI extends UnitAI {
        static _gameFrame = UnitAI.prototype.gameFrame;
        static _calcDelta = Momentum.calcDelta;
        static AttackCommand = new Command((self: SkilledAI, commanding: Skilled, command: Command) => {
            let attackTarget;
            if (!(attackTarget = self.attackTarget)) {
                return true;
            }

            let tempDist;
            if ((tempDist = commanding.mapPos.distanceTo(attackTarget.mapPos)) > commanding.currentAttack.range + attackTarget.scaleSizeR) {
                commanding.attackTarget = null;
                self.setFacing(attackTarget.mapPos);
            }
            else {
                commanding.attackTarget = attackTarget;
                self.setFacing(commanding.mapPos);
                // Issue a basic attack!
            }
            if (attackTarget.currentVital.current['HP'] <= 0) {

                self.attackTarget = null;
                self.commanding.attackTarget = null;
                self.notify(command.notifiers);
                return true; // killed it! we're done
            }
            return false; // contune until its dead!
        },
            (self: SkilledAI, command: Command) => {

                self.attackTarget = null;
                self.commanding.attackTarget = null;
                self.notify(command.notifiers);
                return true;
            }, `Basic Attack`);

        constructor(public commanding: Skilled) {
            super(commanding);
        }

        gameFrame(self?: SkilledAI, frameFn?: () => any): boolean {
            if (!self)
                self = this;
            return SkilledAI._gameFrame(self, () => {
                if (frameFn)
                    frameFn();

                let unit = self.commanding;
                let unitAI = unit.ai;
                let unitMapPos = unit.mapPos;
                let calcDelta = SkilledAI._calcDelta;
                return true;
            });

        }
        attack(target: Attackable) {
            //let unit = this.commanding;
            // if we are line-of-sight just issue a command
            let notifiers = this.endCommands();
            let thisAttackCommand = this.addCommand(SkilledAI.AttackCommand, ` ID:${(target as any).trackingId}`, notifiers);
            this.attackTarget = target; // AI will take command of this
        }

    }
    export interface ISkilled extends IUnit {

    }
    export class Skilled extends Unit implements Attacker {
        public commandList: Command[];
        public baseAttack: Skill;
        public currentAttack: Skill;
        public attackTarget: Attackable;
        public turnSpeed: number;
        public ai: SkilledAI;
        static _attack = Attacker.prototype.attack;
        constructor(paramObject: ISkilled) {
            super(paramObject);

            this.baseAttack = new Skill(this.currentAttack = (new Skill({
                attack: new Attack({
                    rules: [],
                    damages: { melee: 1, ability: 0 }
                }),
                cooldown: 15,
                range: 25
            })));
        }

        attack(target?: Attackable): number {
            return Skilled._attack(target, this);
        }

        export(self = this, child?: ISkilled): ISkilled {
            child = Unit.prototype.export(self, child || {});

            child.attack = self.baseAttack.export();
            child.constructorKey = 'Skilled';

            return child;
            
        }
    }
//** MOBA
    export class MinionAI extends SkilledAI {
        static _gameFrame = SkilledAI.prototype.gameFrame;

        constructor(public commanding: Minion) {
            super(commanding);
        }
        gameFrame(self?: MinionAI, frameFn?: (any?) => any): boolean {
            if (!self)
                self = this;

            return MinionAI._gameFrame(self, () => {
                if (frameFn)
                    frameFn();

            });
        }
    }
    export interface IMinion extends ISkilled {
        skills?: Skill[];
    }
    export class Minion extends Skilled {

        public skills: Skill[];
        public ai: MinionAI;

        constructor(paramObject: IMinion) {
            super(paramObject);
            this.constructorKey = paramObject.constructorKey || 'Minion';
            this.skills = paramObject.skills || [];

            this.ai = new MinionAI(this);
            if (paramObject.world) {
                this.ai.attach(paramObject.world);
            }
        }
    }
    export class HeroAI extends SkilledAI {
        constructor(public commanding: Hero) {
            super(commanding);
        }
    }
    export interface IHero extends IMinion {
        name?: string;
    }
    export class Hero extends Skilled {

        public name: string;
        ai: HeroAI;
        public persistant: boolean = true;

        constructor(paramObject: IHero) {
            super(paramObject);
            this.constructorKey = paramObject.constructorKey || 'Hero';
            this.name = paramObject.name || "Hero";

            this.ai = new HeroAI(this);
            if (paramObject.world) {
                this.ai.attach(paramObject.world);
            }
        }

        remove() {
            this.ai.remove();
            return true;
        }
        attachHero(world: World) {
            if (world) {
                this.ai.attach(world);
                // Create a torch!
                world.getByTrackingId(this.trackingId, () => {

                });
                let torchLightSource = world.featureFactory.stampFeature('torch');
            }
            return true;
        }

        export(self: Hero = this, child?: IHero): IHero {
            child = Skilled.prototype.export(self, child || {});
            child.name = self.name;
            child.constructorKey = 'Hero';
            return child;
        }
    }
    export interface FeatureParam extends IAttackable {
        featureTypeIndex?: number;
        baseVital?: Vitals;
        baseDefense?: Defense;
    }
    export class Building extends Attackable {
        public rotation;
        public scale;
        constructor(paramObject: FeatureParam) {
            super(paramObject);
        }

    }
    export interface ITower extends IAttacker {
    }
    export class Tower extends Attacker implements Building {
        public rotation: number;
        public scale: number;
        constructor(paramObject: ITower) {
            super(paramObject);
        }
    }
    export interface Team {
        name: string;
    }
//** World/Game
    export interface WorldGrid {
        features: { [trackingId: number]: WorldGridFeature },
        touched?: string
    }
    export interface WorldGridFeature {
        occupied: boolean;
        touched?: boolean;
        feature?: Trackable;
        description?: string;
        lastQueried?: number; // game frame
    }
    export interface IActivity {
        unit?: MapFeature;
        target?: MapFeature;
        text?: string;
        active: boolean;
    }
    export class PhysicsDescription {
        unit1: Trackable;
        unit2: Trackable;
        distance: number;
        lineOfSight: boolean;
        calculatedFrame: number;
    }
    export class Physics {
        [index: string]: PhysicsDescription;
        [index: number]: PhysicsDescription;
    }
    export interface ISun extends ILightSource {
        lowLight?: number;
        highLight?: number;
        cycleDuration?: number;
        transitionDuration?: number;
        dayTimeAdjust?: number;
        frameCounter?: number;
    }
    export class Sun extends LightSource {
        lowLight: number;
        highLight: number;
        cycleDuration: number;
        transitionDuration: number;
        dayTimeAdjust: number;
        frameCounter: number;

        constructor (param: ISun) {
            super(param);
            this.factoryName = '';
            this.constructorKey = 'Sun';
            this.lowLight = param.lowLight || 5;
            this.highLight = param.highLight || 100;
            this.cycleDuration = param.cycleDuration || 1000;
            this.transitionDuration = param.transitionDuration || 15;
            this.dayTimeAdjust = param.dayTimeAdjust || 1;
            this.frameCounter = 0;
            this.illumination = this.lowLight;
            this.mapPos = undefined;
        }

        sunStatus(self = this): ISun {
            return {
                lowLight: self.lowLight,
                highLight: self.highLight,
                cycleDuration: self.cycleDuration,
                transitionDuration: self.transitionDuration,
                dayTimeAdjust: self.dayTimeAdjust,
                frameCounter: self.frameCounter,
                illumination: self.illumination
            }
        }
        applyStatus(status: ISun, self = this): Sun {
            self.lowLight = status.lowLight;
            self.highLight = status.highLight;
            self.cycleDuration = status.cycleDuration;
            self.transitionDuration = status.transitionDuration;
            self.dayTimeAdjust = status.dayTimeAdjust;
            self.frameCounter = status.frameCounter;
            self.illumination = status.illumination;
            return self;
        }

        export(self = this, child?: ISun): ISun {
            child = child || {};
            child = LightSource.prototype.export(self, child || {});
            child.lowLight = self.lowLight;
            child.highLight = self.highLight;
            child.cycleDuration = self.cycleDuration;
            child.transitionDuration = self.transitionDuration;
            child.dayTimeAdjust = self.dayTimeAdjust;
            child.frameCounter = self.frameCounter;
            child.illumination = self.illumination;
            child.drawablesName = self.drawablesName;
            child.constructorKey = 'Sun';
            return child;
        }
    }

    export class WorldPhysicsObject {
        [index: string]: Physics;
        [index: number]: Physics;

    }
    export interface IGameWorldData {
        [ worldNames: string ]: IWorldDataJson
    };

    export interface IWorldDataJson {
        name: string,
        description: string,
        drawables: string,
        size: ICoord,
        spawnPoint: ICoord,
        sunData: ISun,
        stampFeatures: {
            [ featureStampName: string ]: IMapFeature[]
        },
        uniqueFeatures: IMapFeature[],
        units: IUnit[]
    }
    export interface IWorld {
        featureFactory?: FeatureFactory;
    }
    export class World {
        name?: string;
        description?: string;
        drawablesName?: string;

        subWorlds?: World[];

        size: ICoord;
        spawnPoint: Coord;

        currentGridPos = new Coord();
        corners = { topLeft: new Coord(), topRight: new Coord(), bottomLeft: new Coord(), bottomRight: new Coord() };
        gridSize: ICoord;
        grid: WorldGrid[][];
        allGrid: { [index: string]: WorldGridFeature } = {};
        gridFeatures: { [index: string]: WorldGridFeature } = {};
        gridFeaturesKeys: string[] = [];
        gridFeaturesCounter = 0;
        eachGrid: WorldGrid;
        eachGridKeys: string[];
        index: number;

        sun: Sun;
        luminance: number = 100;
        setLuminance(toLuminance: number) {
            this.luminance = toLuminance;
        }
        dayTimeFn: (world: World, param?: { lowLight?: number, highLight?: number, cycleDuration?: number, transitionDuration?: number, dayTimeAdjust?: number, illumination?: number }) => any;
        ambients: Ambient[] = [];
        units: Unit[] = [];
        features: MapFeature[] = [];
        physics: WorldPhysicsObject;
        dataReference: { [ trackingId: number]: ControlData & any } = {};
        eachDataReferenceKey: string;
        asyncByTrackingId: { [ trackingId: number ]: ((feature: MapFeature, world: World) => any)[] } = { 0: [] };
        featuresByTrackingId: { [ trackingId: number ]: Trackable & any } = {};

        numberOfUnits: number;
        gameFrames: number;
        activities: IActivity[] = [];  // Communications to descendant classes

        controls: ControlSet;
        unitFactory: any;
        featureFactory: FeatureFactory;
        itemFactory: any;

        constructor(worldParam: IWorld) {
            this.physics = {};
            this.gameFrames = 0;
            this.featureFactory = worldParam.featureFactory;

            this.controls = new ControlSet({ controlledWorld: this });
        }
        create(worldData: IWorldDataJson, constructorModule = MobaIO_Base, self = this) {
            self.name = worldData.name;
            self.description = worldData.description;
            self.drawablesName = worldData.drawables;
            self.size = worldData.size;
            self.spawnPoint = new Coord(worldData.spawnPoint || { x: self.size.x / 2, y: self.size.y / 2 });
            self.gridSize = { x: 64, y: 64 };
            self.resetGrid();

            if (worldData.sunData) {
                self.sun = new Sun(worldData.sunData);
                Trackable.register(self.sun, self);
                let index = 0;
                let unit: PhysicalObject;
                let feature: PhysicalObject;
                self.sun.frameCounter = 10;
                self.dayTimeFn = (world: World, param?: { lowLight?: number, highLight?: number, cycleDuration?: number, transitionDuration?: number, dayTimeAdjust?: number, illumination?: number }) => {
                    let sun = world.sun;
                    if (param) {
                        sun.lowLight = param.lowLight || sun.lowLight;
                        sun.highLight = param.highLight || sun.highLight;
                        sun.cycleDuration = param.cycleDuration || sun.cycleDuration;
                        sun.transitionDuration = param.transitionDuration || sun.transitionDuration;
                        sun.dayTimeAdjust = param.dayTimeAdjust || sun.dayTimeAdjust;
                        sun.illumination = param.illumination || sun.illumination;
                    }
                    
                    if (sun.frameCounter > 0) {
                        sun.frameCounter--;
                        sun.changed = false;
                        if (!param) {
                            return;
                        }
                    }
                    sun.changed = true;
                    if (sun.illumination >= sun.lowLight && sun.illumination <= 100) {
                        for (index = 0; index < self.units.length; index++) {
                            unit = self.units[index] as any;
                            if (unit.active) {
                                if (unit.luminance >= 0) {
                                    self.sun.luminate(unit);
                                }
                            }
                        }
                        for (index = 0; index < self.features.length; index++) {
                            feature = self.features[index] as any;
                            if (feature.active) {
                                if (feature.luminance >= 0) {
                                    self.sun.luminate(feature);
                                }
                            }
                        }
                        world.setLuminance(sun.illumination);
                        sun.illumination += sun.dayTimeAdjust;

                        sun.frameCounter = sun.transitionDuration;
                    }
                    else {
                        sun.dayTimeAdjust = sun.dayTimeAdjust * -1;
                        sun.illumination = sun.illumination < sun.lowLight ? sun.lowLight : sun.highLight;
                        sun.frameCounter = sun.cycleDuration;
                    }
                };
            }
            // Stamp factory features
            for (let eachFeatureType in worldData.stampFeatures) {
                let features = worldData.stampFeatures[eachFeatureType];
                features.forEach((eachFeature) => {
                    let stampedFeature = self.featureFactory.stampFeature(eachFeatureType, eachFeature);
                    self.addFeature(stampedFeature);
                });
            }
            // Construct unique features
            for (let eachFeatureData of worldData.uniqueFeatures) {
                if ((eachFeatureData as any).absoluteMapPos) {
                    // Bump the mapPos to the center for the engine!
                    eachFeatureData.mapPos.x += eachFeatureData.size.x / 2;
                    eachFeatureData.mapPos.y += eachFeatureData.size.y;
                }
                self.addNewFeature(eachFeatureData, constructorModule);
            }
            // Construct units
            for (let eachUnitData of worldData.units) {
                self.addNewUnit(eachUnitData, constructorModule);
            }
            self.dayTimeFn(self);
        }
        export(perspectiveTrackingId?: number): IWorldDataJson {
            let uniqueFeatures: IMapFeature[] = [];
            let featureExport: IMapFeature;
            let factoryFeatures: { [featureName: string]: IMapFeature[] } = this.features.reduce((featuresByFactoryName, eachFeature) => {

                // Check scope from perspective

                if (eachFeature.factoryName) {
                    if (!featuresByFactoryName[eachFeature.factoryName]) {
                        featuresByFactoryName[eachFeature.factoryName] = [];
                    }
                    featuresByFactoryName[eachFeature.factoryName].push(eachFeature.export(eachFeature));
                }
                else {
                    uniqueFeatures.push(eachFeature.export());
                }
                return featuresByFactoryName
            }, {});
            let unitFeatures = this.units.map((eachUnit) => { 
                // Check scope from perspective
                return eachUnit.export();
            });
            return {
                name: this.name || 'World',
                description: this.description || null,
                size: { x: this.size.x, y: this.size.y },
                spawnPoint: { x: this.spawnPoint.x, y: this.spawnPoint.y },
                sunData: this.sun ? this.sun.sunStatus() : null,
                drawables: this.drawablesName || "world",
                stampFeatures: factoryFeatures,
                uniqueFeatures: uniqueFeatures,
                units: unitFeatures
            };
        }

        resetGrid(newGridSize?: ICoord) {
            this.grid = [];
            if (newGridSize)
                this.gridSize = newGridSize;

            for (let gridX = 0; gridX < Math.floor(this.size.x / this.gridSize.x); gridX++) {
                let gridCol = this.grid[gridX] = [];
                for (let gridY = 0; gridY < Math.floor(this.size.y / this.gridSize.y); gridY++) {
                    gridCol[gridY] = { features: {} };
                }
            }
        }
        copyDataReference(data: ControlData & any, reset?: boolean) {
            if (!this.dataReference[data.sourceTrackingId] || reset) {
                this.dataReference[data.sourceTrackingId] = {};
            }
            for (this.eachDataReferenceKey of Object.keys(data)) {
                this.dataReference[data.sourceTrackingId][this.eachDataReferenceKey] = data[this.eachDataReferenceKey];
            }
        }
        addAmbient(ambient: Ambient, attachTo?: Movable, self = this) {
            Trackable.register(ambient, self);
            self.pushAmbient(ambient);

            if (attachTo && attachTo.momentum)
                ambient.attachTo(attachTo);

            ambient.touchThem = true;
            ambient.beTouched = true;
            return ambient;
        }
        addFeature<T>(feature: T & MapFeature, self = this) {
            Trackable.register(feature, self);
            self.pushFeature(feature);
            if ((feature as any).lightSource) {
                self.addAmbient((feature as any).lightSource, feature as any);
            }
            if (feature.luminance >= 0) {
                self.sun.luminate(feature as any);
            }

            feature.touchThem = true;
            feature.beTouched = true;
            return feature;
        }
        addUnit<T>(unit: T & Unit, self = this) {
            Trackable.register(unit, self);
            self.pushUnit<T>(unit);
            self.sun.luminate(unit);
            unit.touchThem = true;
            unit.beTouched = true;
            return unit;
        }

        addNewFeature(featureParam: IMapFeature, constructorModule = MobaIO_Base): MapFeature {
            let newFeature: MapFeature = new constructorModule[featureParam.constructorKey || "MapFeature"](featureParam);
            this.addFeature(newFeature);
            if (featureParam.attachToId) {
                let attachToFeature = this.returnByTrackingId<Movable>(featureParam.attachToId);
                if (attachToFeature) {
                    newFeature.attachTo(attachToFeature);
                    if ((<PhysicalObject>newFeature).lightSource && !(<Movable>newFeature).momentum) {
                        // newFeature is not movable, but attached to something
                        // attach the lightsource to the Movable that newFeature is attached to
                        (<PhysicalObject>newFeature).lightSource.attachTo(attachToFeature);
                    }
                }
            }
            return newFeature;
        }
        addNewUnit(unitParam: IUnit, constructorModule = MobaIO_Base): Unit {
            // Consider adding functionality to this array!
            let newUnit: Unit = new constructorModule[unitParam.constructorKey || "Unit"](unitParam);
            this.addUnit(newUnit);
            return newUnit;
        }

        pushAmbient(ambient: LightSource | SoundSource | Ambient): Ambient {
            let ambients = this.ambients;
            let ambientsLength = ambients.length;
            for (let ambientsCounter = 0; ambientsCounter < ambientsLength; ambientsCounter++) {
                if (!ambients[ambientsCounter] || !ambients[ambientsCounter].active) {
                    return this.ambients[ambientsCounter] = ambient;
                }
            }
            ambient.active = ambient.active === false ? false : true;
            this.ambients.push(ambient);
            return ambient;
        }
        pushFeature(feature: MapFeature): MapFeature {
            let features = this.features;
            let featuresLength = features.length;
            for (let featuresCounter = 0; featuresCounter < featuresLength; featuresCounter++) {
                if (!features[featuresCounter] || !features[featuresCounter].active) {
                    return this.features[featuresCounter] = feature;
                }
            }
            feature.active = feature.active === false ? false : true;
            this.features.push(feature);
            return feature;
        }
        pushUnit<T>(unit: T & Unit): T & Unit {
            let units = this.units;
            let unitLength = units.length;
            for (let unitCounter = 0; unitCounter < unitLength; unitCounter++) {
                if (!units[unitCounter] || !units[unitCounter].active) {
                    return this.units[unitCounter] = unit;
                }
            }
            unit.active = unit.active === false ? false : true;
            this.units.push(unit);

            return unit;
        }

        getByTrackingId<T>(trackingId: number, actionFn: (unit: T & Trackable, world: World) => any, self: World = this) {
            if (!self.asyncByTrackingId[trackingId]) {
                self.asyncByTrackingId[trackingId] = [ actionFn ];
                return;
            }
            let eachAsync;
            for (let eachAsyncIndex = 0; eachAsyncIndex < self.asyncByTrackingId[trackingId].length; eachAsyncIndex++) {
                eachAsync = self.asyncByTrackingId[trackingId][eachAsyncIndex];
                if (!eachAsync || eachAsync === actionFn) {
                    self.asyncByTrackingId[trackingId][eachAsyncIndex] = actionFn;
                    return;
                }
            }
            self.asyncByTrackingId[trackingId].push(actionFn);
        }

        getPhysics(trackingId1: number, trackingId2: number): PhysicsDescription {
            let returnPhysics = trackingId1 < trackingId2 ? this.physics[trackingId1][trackingId2] : this.physics[trackingId2][trackingId1];
            if (!returnPhysics) {
                if (trackingId1 < trackingId2) {
                    return this.physics[trackingId1][trackingId2] = {} as any;
                }
                return this.physics[trackingId2][trackingId1] = {} as any;
            }
            return returnPhysics;
        }
        gameFrame(self = this) {
            let gameFrames = self.gameFrames++;

            let units = self.units;
            let unitsLength = units.length;
            let features = self.features;
            let ambients = self.ambients;
            let eachAmbient: Ambient;
            let eachFeature: MapFeature;
            let numberOfUnits = 0;
            let eachUnit: Unit;
            let unit2: Unit;
            let unit2Counter;
            let aTarget: Attackable
            let damage: number;            // do damages physics
            let distance: number;
            let physics: PhysicsDescription;
            let currentGridPos = self.currentGridPos;
            let corners = self.corners;
            let eachGrid = self.eachGrid;
            let eachGridKeys = self.eachGridKeys;
            let index: number;
            let asyncByTrackingId = self.asyncByTrackingId;
            let asyncIndex = 0;
            let theseAsyncs: ((eachFeature: MapFeature, world: World) => any)[];

            self.dayTimeFn(self);
            let sunLuminate = self.sun.frameCounter <= 0;
            // do ambient physics
            for (index = 0; index < ambients.length; index++) {
                eachAmbient = ambients[index];
                if (!eachAmbient || !eachAmbient.active) {
                    continue;
                }
                theseAsyncs = asyncByTrackingId[eachAmbient.trackingId];
                if (theseAsyncs && theseAsyncs.length) {
                    for (asyncIndex = 0; asyncIndex < theseAsyncs.length; asyncIndex++) {
                        if (theseAsyncs[asyncIndex]) {
                            if (theseAsyncs[asyncIndex] == VisibleMapFeature.adjustLuminanceAsync) {
                                debugger;
                            }
                            theseAsyncs[asyncIndex](eachAmbient, self);
                            theseAsyncs[asyncIndex] = null;
                        }
                    }
                }

                if (eachAmbient.attachedToId && !eachAmbient.attachedTo) {
                    eachAmbient.attachTo(self.returnByTrackingId<Movable>(eachAmbient.attachedToId));
                }

                if ((eachAmbient as DamageBox).cooldown) {
                    (eachAmbient as DamageBox).cooldownCounter--;
                    if ((eachAmbient as DamageBox).cooldownCounter < 0) {
                        (eachAmbient as DamageBox).cooldownCounter = (eachAmbient as DamageBox).cooldown;
                    }
                }

                if (eachAmbient.expires) {
                    eachAmbient.expires--;
                    if (eachAmbient.expires <= 0) {
                        eachAmbient.active = false;
                        Trackable.unRegister(eachAmbient, self);
                        continue;
                    }
                }
                if (eachAmbient.touchThem || eachAmbient.beTouched) {
                    corners.topLeft.x = Math.floor((eachAmbient.mapPos.x - eachAmbient.scaleSizeR) / self.gridSize.x);
                    corners.topLeft.y = Math.floor((eachAmbient.mapPos.y - eachAmbient.scaleSizeR) / self.gridSize.y);
                    corners.bottomRight.x = Math.floor((eachAmbient.mapPos.x + eachAmbient.scaleSizeR) / self.gridSize.x);
                    corners.bottomRight.y = Math.floor((eachAmbient.mapPos.y + eachAmbient.scaleSizeR) / self.gridSize.y);

                    self.queryGrid(corners);

                    if (eachAmbient.touchThem && eachAmbient.beTouched) {
                        self.pushActivities(eachAmbient.doTouches(self.gridFeatures, self.gridFeaturesCounter, self.gridFeaturesKeys));
                        eachAmbient.touchThem = false;
                        eachAmbient.beTouched = false;
                    }
                    else {
                        if (eachAmbient.touchThem) {
                            self.pushActivities(eachAmbient.castTouches(self.gridFeatures, self.gridFeaturesCounter, self.gridFeaturesKeys));
                            eachAmbient.touchThem = false;
                        }
                        if (eachAmbient.beTouched) {
                            self.pushActivities(eachAmbient.getTouched(self.gridFeatures, self.gridFeaturesCounter, self.gridFeaturesKeys));
                            eachAmbient.beTouched = false;
                        }
                    }
                }
            }
            // do feature physics
            for (index = 0; index < features.length; index++) {
                eachFeature = features[index];
                if (!eachFeature || !eachFeature.active)
                    continue;

                if (sunLuminate && eachFeature.luminance >= 0) {
                    self.sun.luminate(eachFeature as PhysicalObject);
                }

                theseAsyncs = (<any>eachFeature).trackingId ? asyncByTrackingId[(<any>eachFeature).trackingId] : null;
                if (theseAsyncs && theseAsyncs.length) {
                    for (asyncIndex = 0; asyncIndex < theseAsyncs.length; asyncIndex++) {
                        if (theseAsyncs[asyncIndex]) {
                            theseAsyncs[asyncIndex](eachFeature, self);
                            theseAsyncs[asyncIndex] = null;
                        }
                    }
                }

                if (eachFeature.attachedToId && !eachFeature.attachedTo) {
                    eachFeature.attachTo(self.returnByTrackingId<Movable>(eachFeature.attachedToId));
                }
    
                if (eachFeature.touchThem || eachFeature.getTouched) {
                    corners.topLeft.x = Math.floor((eachFeature.mapPos.x - eachFeature.scaleSizeR) / self.gridSize.x);
                    corners.topLeft.y = Math.floor((eachFeature.mapPos.y - eachFeature.scaleSizeR) / self.gridSize.y);
                    corners.bottomRight.x = Math.floor((eachFeature.mapPos.x + eachFeature.scaleSizeR) / self.gridSize.x);
                    corners.bottomRight.y = Math.floor((eachFeature.mapPos.y + eachFeature.scaleSizeR) / self.gridSize.y);

                    self.queryGrid(corners);
                    if (eachFeature.touchThem && eachFeature.beTouched) {
                        eachFeature.doTouches(self.gridFeatures, self.gridFeaturesCounter, self.gridFeaturesKeys);
                        eachFeature.touchThem = false;
                        eachFeature.beTouched = false;
                    }
                    else {
                        if (eachFeature.touchThem) {
                            eachFeature.castTouches(self.gridFeatures, self.gridFeaturesCounter, self.gridFeaturesKeys);
                            eachFeature.touchThem = false;
                        }
                        if (eachFeature.beTouched) {
                            eachFeature.getTouched(self.gridFeatures, self.gridFeaturesCounter, self.gridFeaturesKeys);
                            eachFeature.beTouched = false;
                        }
                    }
                }
            }
            // do unit physics
            for (index = 0; index < unitsLength; index++) {
                eachUnit = units[index]
                if (!eachUnit || !eachUnit.active)
                    continue;

                if (sunLuminate && eachUnit.luminance >= 0) {
                    self.sun.luminate(eachUnit);
                }
    
                theseAsyncs = asyncByTrackingId[eachUnit.trackingId];
                if (theseAsyncs && theseAsyncs.length) {
                    for (asyncIndex = 0; asyncIndex < theseAsyncs.length; asyncIndex++) {
                        if (theseAsyncs[asyncIndex]) {
                            theseAsyncs[asyncIndex](eachUnit, self);
                            theseAsyncs[asyncIndex] = null;
                        }
                    }
                }
                        
                if (eachUnit.active && (eachUnit.currentVital.current['HP'] > 0 || (eachUnit as Hero).persistant)) {
                    numberOfUnits++;

                    if (eachUnit.ai.gameFrame(eachUnit.ai)) {
                        //enter here if AI did something
                    }


                    // apply facing to momentum (presumably set by AI, player, or server input)
                    // check traction?
                    eachUnit.momentum = eachUnit.facing;

                    corners.topLeft.x = Math.floor((eachUnit.mapPos.x - eachUnit.scaleSizeR) / self.gridSize.x);
                    corners.topLeft.y = Math.floor((eachUnit.mapPos.y - eachUnit.scaleSizeR) / self.gridSize.y);
                    corners.bottomRight.x = Math.floor((eachUnit.mapPos.x + eachUnit.scaleSizeR) / self.gridSize.x);
                    corners.bottomRight.y = Math.floor((eachUnit.mapPos.y + eachUnit.scaleSizeR) / self.gridSize.y);
                    self.queryGrid(corners);
                    eachUnit.doMove(self.gridFeatures, self.gridFeaturesCounter, self.gridFeaturesKeys);

                    if ((aTarget = (eachUnit as any).attackTarget)) {
                        // if the AI (or player) wants a basic attack, do it!
                        if ((eachUnit as Skilled).currentAttack.cooldown <= gameFrames) {
                            // Attack is ready!
                            if (0 == 0) {
                                // Within range!
                                damage = (eachUnit as Skilled).attack(aTarget);
                                self.pushActivity({ unit: aTarget, text: `${damage}`, active: true });

                                (eachUnit as Skilled).currentAttack.cooldown = gameFrames + (eachUnit as Skilled).baseAttack.cooldown;

                                if (!aTarget.active || aTarget.currentVital.current['HP'] <= 0) {
                                    (eachUnit as any).attackTarget = undefined;
                                }
                            }
                            else {
                                // Not within range!
                            }
                        }
                        else {
                            // Attack not ready!
                        }

                    }
                    // Perform resets
                    // eachUnit.ai.closestUnitDistance = 1000000;
                    // eachUnit.ai.closestUnitTrackingId = null;
                    // eachUnit.ai.closestUnit = null;
                }
                else {
                    units[index].active = false;
                    Trackable.unRegister(units[index], self);
                }
            }
            // Do world scope asyncs
            theseAsyncs = self.asyncByTrackingId[0];
            if (theseAsyncs && theseAsyncs.length) {
                for (asyncIndex = 0; asyncIndex < theseAsyncs.length; asyncIndex++) {
                    if (theseAsyncs[asyncIndex]) {
                        theseAsyncs[asyncIndex](null, self);
                        theseAsyncs[asyncIndex] = null;
                    }
                }
            }

            self.numberOfUnits = numberOfUnits;

            if (self.subWorlds) {
                for (index = 0; index < self.subWorlds.length; index++) {
                    self.subWorlds[index].gameFrame(self.subWorlds[index]);
                }
            }
        }

        pushActivity(activity: IActivity) {
            let activityLength = this.activities.length;
            let eachActivity;
            for (let activityIndex = 0; activityIndex < activityLength; activityIndex++) {
                eachActivity = this.activities[activityIndex];
                if (!eachActivity || !eachActivity.active) {
                    this.activities[activityIndex] = activity;
                    return;
                }
            }
            //this.activities.push(activity);
            this.activities[this.activities.length] = activity;
        }

        pushActivities(activites: IActivity[]) {
            for (let i = 0; i < activites.length; i++) {
                this.pushActivity(activites[i]);
            }
        }

        setPerson(newPlayerUnit: Unit) {
        }

        allGridFeatures(): { [trackingId: number]: WorldGridFeature } {
            let returnGridFeatures: { [trackingId: number]: WorldGridFeature } = {};
            let eachGrid: WorldGrid;
            let eachGridKeys: string[];
            for (let x = 0; x < this.gridSize.x; x++) {
                for (let y = 0; y < this.gridSize.y; y++) {
                    eachGrid = this.grid[x][y];
                    eachGridKeys = Object.keys(eachGrid.features);
                    for (let index = 0; index < eachGridKeys.length; index++) {
                        if ((eachGrid.features[eachGridKeys[index]] as WorldGridFeature).occupied) {
                            returnGridFeatures[eachGridKeys[index]] = eachGrid.features[eachGridKeys[index]];
                        }
                    }
                }
            }
            return this.allGrid = returnGridFeatures;
        }

        queryGrid(corners?: { topLeft: Coord, topRight: Coord, bottomLeft: Coord, bottomRight: Coord }) {
            for (this.index = 0; this.index < this.gridFeaturesCounter; this.index++) {
                this.gridFeatures[this.gridFeaturesKeys[this.index]].lastQueried = 0;
            }
            this.gridFeaturesCounter = 0;
            let currentGridPos = this.currentGridPos;
            let indexTrackingId = '';
            for (currentGridPos.x = corners.topLeft.x; currentGridPos.x <= corners.bottomRight.x; currentGridPos.x++) {
                for (currentGridPos.y = corners.topLeft.y; currentGridPos.y <= corners.bottomRight.y; currentGridPos.y++) {
                    this.eachGrid = this.grid[currentGridPos.x][currentGridPos.y];
                    this.eachGridKeys = Object.keys(this.eachGrid.features);
                    for (this.index = 0; this.index < this.eachGridKeys.length; this.index++) {
                        indexTrackingId = this.eachGridKeys[this.index];
                        if ((this.eachGrid.features[indexTrackingId] as WorldGridFeature).occupied) {
                            if (!this.gridFeatures[indexTrackingId]) {
                                this.gridFeatures[indexTrackingId] = { lastQueried: 0 } as any;
                            }
                            let gridFeature = this.gridFeatures[indexTrackingId];
                            if (gridFeature.lastQueried >= this.gameFrames) {
                                continue;
                            }
                            gridFeature.lastQueried = this.gameFrames;
                            gridFeature.feature = this.eachGrid.features[indexTrackingId].feature;
                            gridFeature.occupied = true;
                            gridFeature.touched = this.eachGrid.features[indexTrackingId].touched;

                            this.gridFeaturesKeys[this.gridFeaturesCounter] = indexTrackingId;
                            this.gridFeaturesCounter++;
                        }
                    }
                }
            }
            // if (this.gridFeaturesCounter > 10) {
            //     console.log(this.gridFeaturesCounter);
            //     console.log(this.gridFeaturesKeys);
            //     console.log(this.gridFeatures);
            //     debugger;
            // }
        }

        eachFeature: any;
        returnByTrackingId<T>(trackingId: number): T {
            if (!this.featuresByTrackingId[trackingId]) {
                for (this.eachFeature of this.units) {
                    if (this.eachFeature.trackingId === trackingId) {
                        this.featuresByTrackingId[trackingId] = this.eachFeature;
                        return this.eachFeature;
                    }
                }
                for (this.eachFeature of this.features) {
                    if (this.eachFeature.trackingId === trackingId) {
                        this.featuresByTrackingId[trackingId] = this.eachFeature;
                        return this.eachFeature;
                    }
                }
                for (this.eachFeature of this.ambients) {
                    if (this.eachFeature.trackingId === trackingId) {
                        this.featuresByTrackingId[trackingId] = this.eachFeature;
                        return this.eachFeature;
                    }
                }
            }
            else {
                return this.featuresByTrackingId[trackingId];
            }
            return null;
        }

    }
    export interface InputSet {
        moveLeft: any;
        moveRight: any;
        moveDown: any;
        moveUp: any;
        rotateLeft: any;
        rotateRight: any;
        move: any;
        interact: any;
        ability1: any;
        ability2: any;
        ability3: any;
        heroic: any;
        trait: any;
        item: any;
        slot1: any;
        slot2: any;
        slot3: any;
        slot4: any;
        slot5: any;
        slot6: any;
        slot7: any;
        slot8: any;
        slot9: any;
        slot0: any;
    }
    export interface ControlData {
        name?: string;
        message?: string;
        commandGameFrame?: number;

        sourceTrackingId?: number;
        sourcePos?: ICoord;

        targetTrackingId?: number;
        targetPos?: ICoord;

    }
    export class ControlCode implements ControlData {
        name?: string;
        message?: string;
        commandGameFrame?: number;

        sourceTrackingId?: number;
        sourcePos?: ICoord;

        targetTrackingId?: number;
        targetPos?: ICoord;

        controlFn: (data: ControlData, world?: World) => any;
    }
    export interface SpawnAmbient extends ControlData {
        spawnStampIndex?: number;
        spawnStampName?: string;
        spawnAmbientInterface: MobaIO_Base.IAmbient
    }
    export interface SpawnUnit extends ControlData {
        spawnStampIndex?: number;
        spawnStampName?: string;
        spawnUnitInterface: MobaIO_Base.IUnit
    }
    export interface SpawnFeature extends ControlData {
        createFeatureStampIndex?: number;
        createFeatureStampName?: string;
        createFeatureInterface: IMapFeature
    }
    export interface UpdateFeature<T> extends ControlData {
        patchDataByKey?: T;
    }
    export class ControlSet implements InputSet {
        controlledWorld: World;
        constructorModule: any;

        spawn: ControlCode = {
            name: 'Spawn',
            controlFn: (data: SpawnUnit, world = this.controlledWorld, useModule = this.constructorModule) => {
                if (!data.spawnUnitInterface.trackingId) {
                    debugger;
                }
                data.spawnUnitInterface.world = world;
                world.copyDataReference(data, true);
                world.getByTrackingId(0, (nullReference, asyncWorld) => {
                    if (world.returnByTrackingId(data.sourceTrackingId) || world.physics[data.spawnUnitInterface.trackingId]) {
                        console.log('TRIED TO RESPAWN');
                        return;
                    }
                    asyncWorld.addNewUnit(asyncWorld.dataReference[data.sourceTrackingId].spawnUnitInterface, useModule);
                });
            }
        };
        create: ControlCode = {
            name: 'Create',
            controlFn: (data: SpawnFeature, world = this.controlledWorld, useModule = this.constructorModule) => {
                console.log('Creating a feature!');
                if (!data.createFeatureInterface.trackingId) {
                    debugger;
                }
                if (world.returnByTrackingId(data.createFeatureInterface.trackingId)) {
                    console.log('TRIED TO RECREATE');
                    return;
                }
                let createdFeature: MapFeature;
                world.getByTrackingId(0, (nullReference, asyncWorld) => {
                    if (data.createFeatureStampName) {
                        createdFeature = asyncWorld.addFeature(asyncWorld.featureFactory.stampFeature(data.createFeatureStampName, data.createFeatureInterface), asyncWorld);
                    }
                    else {
                        createdFeature = asyncWorld.addNewFeature(data.createFeatureInterface, useModule);
                    }
                });
            }
        };
        static despawnFn = (toDespawn, asyncWorld) => {
            toDespawn.active = false;
            Trackable.unRegister(toDespawn, asyncWorld);
        }
        deSpawn: ControlCode = {
            name: 'Despawn',
            controlFn: (data: ControlData, world = this.controlledWorld) => {
                if (!data.targetTrackingId) {
                    // Probably okay here
                }
                world.getByTrackingId(data.targetTrackingId, ControlSet.despawnFn);
            }
        };
        static applyUpdate = (toUpdate, data) => {
            for (let eachDataProperty in data) {
                if (typeof data[eachDataProperty] === 'object') {
                    ControlSet.applyUpdate(toUpdate[eachDataProperty], data[eachDataProperty])
                }
                else {
                    toUpdate[eachDataProperty] = data[eachDataProperty];
                }
            }
        }
        static update = (toUpdate, asyncWorld) => {
            let data = asyncWorld.dataReference[toUpdate.trackingId] as UpdateFeature<any>;
            ControlSet.applyUpdate(toUpdate, data.patchDataByKey);
        }
        update: ControlCode = {
            name: 'Update',
            controlFn: (data: ControlData, world = this.controlledWorld) => {
                if (!data.sourceTrackingId) {
                    debugger;
                }
                world.copyDataReference(data, true);
                world.getByTrackingId(data.sourceTrackingId, ControlSet.update);
            }
        };
        // Keyboard based commands
        moveLeft: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        moveRight: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        moveDown: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        moveUp: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        rotateLeft: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        rotateRight: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        ability1: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        ability2: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        ability3: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        heroic: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        trait: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        item: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot1: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot2: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot3: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot4: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };

        slot5: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot6: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot7: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot8: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot9: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        slot0: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };

        // Includes Mouse based commands
        static moveFn = (toMove: Movable, asyncWorld: World) => {
            let data = asyncWorld.dataReference[toMove.trackingId] as ControlData;
            if (data.sourcePos) {
                if (toMove.moveTo) {
                    toMove.moveTo(data.sourcePos);
                }
                else {
                    toMove.mapPos.x = data.sourcePos.x;
                    toMove.mapPos.y = data.sourcePos.y;
                    toMove.beTouched = true;
                    toMove.touchThem = true;
                }
            }
            if (data.targetPos) {
                toMove.ai.goTo(data.targetPos, 1);
            }
        };
        move: ControlCode = {
            name: 'Move To',
            controlFn: (data: ControlData, world = this.controlledWorld) => {
                if (!data.sourceTrackingId) {
                    debugger;
                }
                world.copyDataReference(data);
                world.getByTrackingId(data.sourceTrackingId, ControlSet.moveFn);
            }
        };
        interact: ControlCode = {
            name: '',
            controlFn: (data: ControlCode) => {

            }
        };
        

        messages: { [ messageCode: string ]: ControlCode } = {
            's': this.spawn,
            'c': this.create,
            'd': this.deSpawn,
            'u': this.update,
            'm': this.move
        }

        constructor (params: { controlledWorld: World, constructorModule?: any }) {
            this.controlledWorld = params.controlledWorld;
            this.constructorModule = params.constructorModule || MobaIO_Base;

            for (let eachMessage of Object.keys(this.messages)) {
                this.messages[eachMessage].message = eachMessage;
            }
        }
    }
    export interface IFeatureStampParam extends IHarvestable, IDestructable {
    }
    interface IFeatureStamp {
        name: string;
        drawablesName: string;
        drawablesSet?: string;
        constructorKey?: string;
        size: ICoord;
        sizeD: number;
        mass: number;
        harvestable: { types: string[], properTypes: string[], drops: number, chance: number }[];
        destructable: { types: string[], properTypes: string[], drops: number, chance: number }[];
        light: { sizeD: number, center: number, luminance: number };
        item: {};
    }        
    export interface IFeatureFactory {
        featureStamps: IFeatureStamp [];
    }
    export class FeatureFactory {
        static assign(theseParameters, defaultParameters) {
            for (let eachParameterKey of Object.keys(defaultParameters)) {
                if (typeof defaultParameters[eachParameterKey] === 'object') {
                    if (!theseParameters[eachParameterKey]) {
                        theseParameters[eachParameterKey] = {};
                    }
                    for (let eachParameterObjectKey of Object.keys(defaultParameters[eachParameterKey])) {
                        if (!theseParameters[eachParameterKey][eachParameterObjectKey]) {
                            theseParameters[eachParameterKey][eachParameterObjectKey] = defaultParameters[eachParameterKey][eachParameterObjectKey];
                        }
                    }
                }
                else {
                    if (!theseParameters[eachParameterKey]) {
                        theseParameters[eachParameterKey] = defaultParameters[eachParameterKey];
                    }
                }
            }
            return theseParameters;
        }

        featureStamps: { [mapFeatureName: string]: { featureParam: any, featureConstructor: (param: any) => void } };

        constructor(param: IFeatureFactory) {
            this.featureStamps = {};

            param.featureStamps.forEach((eachFeature) => {
                // Determine which constructor to use for eachFeature!
                let stamp = this.featureStamps[eachFeature.name] = {
                    featureParam: eachFeature,
                    featureConstructor: ((feature: any) => {
                        if (feature.constructorKey) {
                            return MobaIO_Base[feature.constructorKey];
                        }
                        else {
                            if (feature.mass) {
                                if (feature.harvestable)
                                    return Harvestable as any;

                                if (feature.destructable)
                                    return Destructable as any;

                                return PhysicalObject as any;
                            }
                        }
                        return MapFeature as any;
                    })(eachFeature)
                };
            });

            this.featureStamps['generic'] = {
                featureParam: {},
                featureConstructor: MapFeature as any
            }
        }
        getParam(mapFeatureName: string): IFeatureStampParam {
            let stamp = this.featureStamps[mapFeatureName];
            return stamp ? stamp.featureParam : {};
        }
        stampFeature(mapFeatureName: string, extraParams = {}, returnFeature?: MapFeature, self = this): MapFeature {
            let stamp = self.featureStamps[mapFeatureName];
            if (!returnFeature) {
                if (!stamp) {
                    returnFeature = new self.featureStamps['generic'].featureConstructor(extraParams);
                }
                else {

                    returnFeature = new stamp.featureConstructor(FeatureFactory.assign(extraParams, stamp.featureParam));
                    returnFeature.factoryName = mapFeatureName;
                }
            }
            else {
                // do some fancy re-animation thing to this feature!
            }

            return returnFeature;
        }
    }
    export interface MobaIO_GameData {
        graphics: {
            name: string,
            drawables: {
                drawablesCommand: "makeImage" | "makeCircle" | "makeCharacterSheet",
                params:
                    { fileName: string, size: number, frames: number, distanceMod: number, directions: number } |
                    { style: string, size: number, lineWidth: number },
                resolver: boolean
            }
        }[],
        items: IItemStamp[],
        features: IFeatureStamp[],
        units: (IHero | IUnit)[]

    }
    export interface IMobaIO_Game {
        gameFrames?: number;
        gameData: MobaIO_GameData;
    }
    export class MobaIO_Game {
        public worlds: World[] = [];

        public gameFrames: number = 0;
        public frameNumber: number = 0;
        public gameTimer: number = 0;
        public gameMilli: number = (1 / 60) * 1000;
        public overElapsed: boolean;
        public timerAlias: number;
        public activities: { unit: Unit, text: string }[];
        public running: boolean = false;
        worldParam: IGameWorldData;

        public featureFactory: FeatureFactory;
        public timerFn: () => number = () => { return (this.gameFrames + 1) * this.gameMilli; };

        constructor(paramObject: IMobaIO_Game) {
            this.featureFactory = new FeatureFactory({ featureStamps: paramObject.gameData.features });
        };

        determineFrameRun(self) {
            self.timerAlias = self.timerFn();
            self.overElapsed = (self.timerAlias - self.elapsedMilliTimer) > self.gameMilli;
            return (self.gameTimer + self.gameMilli < self.timerAlias) && !self.overElapsed;
        }

        public gameFrame(self?: MobaIO_Game, frameFn?: () => any): boolean {
            if (!self)
                return;
            //self = this;

            let elapsedMilliTimer = self.timerFn();

            let timerAlias: number;
            let overElapsed: boolean;
            let gameMilli = self.gameMilli;
            while (self.determineFrameRun(self)) {  //loop while the game is behind the clock  

                self.gameTimer += gameMilli;

                //self.worlds.forEach((thisWorld) => {
                self.worlds[0].gameFrame(self.worlds[0]);
                //});

                if (frameFn)
                    frameFn();

                self.gameFrames++;
                self.frameNumber++;  // total frames since game has started
            }

            // And now since we've caught up/overElapsed, get the time until the next frame and do the callback
            let nextMilli = self.gameTimer + gameMilli - self.timerAlias;
            if (nextMilli < 0)
                nextMilli = 0;

            setTimeout(() => {
                self.gameFrame(self);
            }, nextMilli + 1); // call our next frame

            if (overElapsed)
                console.log("Over elapsed");

            return overElapsed;
        }
        public renderFrame(self?: MobaIO_Game) {
            // anything under the hood or shared between client/server related to graphics in an abstract way


            return;
        }

        public export () {
            return this.worlds.reduce((worldDataObject, eachWorld) => {
                worldDataObject[eachWorld.name] = eachWorld.export();
                return worldDataObject;
            }, {});
        }
    }
    export interface MobaIO_GameStatus { 
        gameFrames: number;
        worldStatus:
        {
            sunStatus: ISun;
        }
    }

    export interface IPlayer {
        userID?: number;
        trackingId?: number;
        playerName?: string;
        heroReference?: IHero;
    }
    export class Player {
        userID?: number;
        active: boolean;
    
        playerName: string;
        trackingId?: number;
        currentWorld?: World;
        heroReference?: MobaIO_Base.Hero;
    
        privateInventory?: MobaIO_Base.Inventory;
    
        constructor (params?: IPlayer) {
            if (!params) {
                return;
            }
            this.userID = params.userID;
            this.playerName = params.playerName || this.playerName;
            this.heroReference = new MobaIO_Base.Hero(params.heroReference || {
                name: this.playerName,
                size: { x: 10, y: 24 },
                sizeD: 10,
                moveSpeed: 1,
                turnSpeed: 180,
                attack: new MobaIO_Base.Skill({
                            range: 10 * 1,
                            cooldown: 50,
                            attack: new MobaIO_Base.Attack({
                                rules: [
                                    new MobaIO_Base.AttackRule({
                                        bonusHpPercentDamages: { melee: 4, ability: 0 }
                                    })
                                ],
                                damages: { melee: 30, ability: 0 }
                            })
                }),
                defense: new MobaIO_Base.Defense({
                    rules: [
                        new MobaIO_Base.DefenseRule({ percentDamages: { melee: -50, ability: -90 } })
                    ]
                }),
                drawablesName: 'edgar',
                scale: 1,
            });
        }
        static newPlayerFromUser(user): Player {
            return new Player({
                userID: user.userID,
                playerName: `${user.userName} The Neophyte`,
                trackingId: null
            });
        }
    
        remove(): MobaIO_Base.Hero {
            if (this.currentWorld) {
                for (let eachUnitIndex in this.currentWorld.units) {
                    let eachUnit: MobaIO_Base.Hero = this.currentWorld.units[eachUnitIndex] as any;
                    if (eachUnit.trackingId === this.trackingId) {
                        eachUnit.remove();
                        return eachUnit;
                    }
                }
            }
            return this.heroReference;
        }
    
        attach(world?: World): boolean {
            if (!world) {
                return null;
            }
            if (!this.trackingId) {
                this.currentWorld = world;
                this.heroReference.mapPos = new Coord(Coord.randomTranslate(this.currentWorld.spawnPoint, 50));
                this.heroReference = this.currentWorld.addUnit(this.heroReference);
                if (this.heroReference.attachHero(this.currentWorld)) {
                    this.trackingId = this.heroReference.trackingId;
                };
                return true;
            }
            else if (this.currentWorld) {
                this.deactivate();
                // Remove from that world
                this.heroReference = this.remove();
            }
            // Attach to the provided world
            this.currentWorld = world;
            this.heroReference.attachHero(this.currentWorld);
            return true;
        }

        activate() {

        }
        deactivate() {

        }
    }        
}
var document;
if (document) {
    var require;
    if (!require) {
        let requires = { };
        (<any>window).require = (filePath) => {
            return requires[filePath] || {};
        };
        (<any>window).setRequire = (filePath, requiredObject) => {
            requires[filePath] = requiredObject || {};
        };
    }
    if ((<any>window).setRequire) {
        (<any>window).setRequire('./mobaIO_base_module', { MobaIO_Base: MobaIO_Base });
    }
}
