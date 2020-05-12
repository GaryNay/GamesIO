export module TopDownEngine {
    //** Vectors
    export class Nums {
        static mathPIover180: number = Math.PI / 180;
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
        constructor(x: number = 0, y: number = 0) {
            this.x = x;
            this.y = y;
        }

        static FromCoord(fromCoord: Coord | ICoord): Coord {
            return new Coord(fromCoord.x, fromCoord.y);
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
            return new Coord(this.x + trans.x, this.y + trans.y);
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
        static randomTranslate(coord: Coord, radius?: number): Coord {
            return coord.translate(Momentum.CalcDelta(Math.random() * 360, Math.random() * (radius || 50)));
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

        constructor(x1: number = 0, y1: number = 0, x2: number = 0, y2: number = 0) {
            this.p1 = new Coord(x1, y1);
            this.p2 = new Coord(x2, y2);
            this.size.x = Math.abs(x1 - x2);
            this.size.y = Math.abs(y1 - y2);
        }

        static FromRect(fromRect: Rect | IRect): Rect {
            return new Rect(fromRect.p1.x, fromRect.p1.y, fromRect.p2.x, fromRect.p2.y);
        }

        static AreaP(x1: number, y1: number, x2: number, y2: number): number {
            return Math.sqrt(Math.abs(x1 - x2) ^ 2 + Math.abs(y1 - y2) ^ 2);
        }

        static Area(c1: Coord, c2: Coord): number {
            return Math.sqrt(Math.abs(c1.x - c2.x) ^ 2 + Math.abs(c1.y - c2.y) ^ 2);
        }

        setCoords(x1, y1, x2, y2) {
            this.p1.x = x1;
            this.p1.y = y1;
            this.p2.x = x2;
            this.p2.y = y2;
        }

        area(): number {
            return Math.sqrt(this.size.x ^ 2 + this.size.y ^ 2);
        }

        containsCoord(coord: Coord | ICoord) {
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
    export interface IMomentum {
        delta?: ICoord;
        angle?: number;
        velocity?: number
    }
    export class Momentum {
        public angle: number = 0;
        public velocity: number = 0;
        public delta: ICoord = { x: 0, y: 0 };
        public terminalVelocity?: number;
        static returnDelta: ICoord = { x: 0, y: 0 };

        constructor(angle: number = 0, velocity: number = 0) {
            this.adjustAngle(angle || 0);
            this.velocity = velocity || 0;
            this.setDeltaFromMomentum();
        }

        static FromMomentum(fromMomentum: IMomentum | Momentum): Momentum {
            return new Momentum(fromMomentum.angle, fromMomentum.velocity);
        }

        static FromDelta(fromDelta: ICoord): Momentum {
            let returnMomentum = new Momentum();
            returnMomentum.setMomentumFromDelta(fromDelta);
            return returnMomentum;
        }

        static CalcDelta(angle: number, velocity: number): ICoord {
            Momentum.returnDelta.x = Math.cos(Nums.mathPIover180 * angle) * velocity;
            Momentum.returnDelta.y = Math.sin(Nums.mathPIover180 * angle) * velocity;
            return Momentum.returnDelta;
        }

        calcDelta() {
            this.delta.x = Math.cos(Nums.mathPIover180 * this.angle) * this.velocity;
            this.delta.y = Math.sin(Nums.mathPIover180 * this.angle) * this.velocity;
        }

        setDelta(angle: number, velocity: number) {
            this.angle = this.adjustAngle(angle);
            this.velocity = velocity;
            this.calcDelta();
        }
        setDeltaFromMomentum(values?: Momentum | IMomentum) {
            if (values) {
                this.setDelta(values.angle, values.velocity);
            }
        }
        calcMomentum() {
            this.angle = Coord.getAngle(this.delta);
            this.velocity = Coord.getDistance(this.delta);

            if (this.velocity > (this.terminalVelocity || 10000)) {
                this.velocity = this.terminalVelocity || 10000;
            }
        }
        setMomentum(x: number, y: number) {
            this.delta.x = x;
            this.delta.y = y;
            this.calcMomentum();
        }
        setMomentumFromDelta(delta?: ICoord) {
            if (delta) {
                this.setMomentum(delta.x, delta.y);
            }
        }
        applyMomentum(momentum?: Momentum, averageAngle?: boolean, averageDelta?: boolean) {
            // Mix the momentums!
            if (!momentum) {
                return;
            }
            if (averageAngle) {
                let angleDif = this.angleDiff(momentum.angle) / 2;
                let velocity = momentum.velocity;
                momentum.setDeltaFromMomentum({ angle: this.angle + angleDif, velocity: velocity || this.velocity });
            }

            if (averageDelta) {
                this.setMomentumFromDelta({
                    x: (this.delta.x + momentum.delta.x) / 2,
                    y: (this.delta.y + momentum.delta.y) / 2
                });
                return;
            }
            this.setMomentumFromDelta({
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

    export class BasicFeature {
        index: number = NaN;
        pos: Coord;
        size: Coord;
        sizeD: number;
        sizeR: number;
        angle: number;
        scale: number;
        type: string;

        constructor(posX?: number, posY?: number, sizeX?: number, sizeY?: number, angle?: number, scale?: number, type?: string) {
            this.pos = new Coord(posX, posY);
            this.angle = (angle || 0) % 360;
            this.scale = scale || 1;
            this.size = new Coord(sizeX, sizeY);
            this.sizeD = this.size.distance();
            this.sizeR = this.sizeD / 2;

            this.type = type || 'rect';
        }
    }

    export class MovableFeature extends BasicFeature {
        momentum: Momentum;
        facing: Momentum;

        constructor(facing?: Momentum | IMomentum, posX?: number, posY?: number, sizeX?: number, sizeY?: number, angle?: number, scale?: number, type?: string) {
            super(posX, posY, sizeX, sizeY, angle, scale, type);

            this.momentum = new Momentum(this.angle, 0);
            this.facing = Momentum.FromMomentum(facing || this.momentum);
        }
    }

    export class Scene {
        features: BasicFeature[] = [];

        constructor() {

        }

        gameFrame() {

        }
    }

    export interface QueryNode {
        active: boolean;
        bounds: Rect;
        union: Rect;
        child1node: boolean;
        child1: number;
        child1Cost: number;
        child2node: boolean;
        child2: number;
        child2Cost: number;
        parent: number;
        cost: number;
        inheritedCost: number;
    };

    export class QueryTree {
        currentRoot: number;
        nodes: QueryNode[];

        totalObjects = 0;

        constructor() {
            this.nodes = [ QueryTree.NewNode(0,0,0,0, true) ];
            this.currentRoot = 0;
        }

        static NewNode(b1x: number, b1y: number, b2x: number, b2y: number, isActive = false): QueryNode {
            return {
                active: isActive,
                bounds: new Rect(b1x, b1y, b2x, b2y),
                union: new Rect(),
                child1node: null, // Since these are null they wont be considered as objects or nodes
                child1: null,
                child1Cost: null,
                child2node: null, // Since these are null they wont be considered as objects or nodes
                child2: null,
                child2Cost: null,
                parent: null,
                cost: Rect.AreaP(b1x, b1y, b2x, b2y),
                inheritedCost: 0
            };
        }

        query(q1x: number, q1y: number, q2x: number, q2y: number, queryObject = { results: [] as number[], counter: 0 }): { results: number[], counter: number } {
            queryObject.counter = 0;
            queryObject = this.queryNode(0, q1x, q1y, q2x, q2y, queryObject);

            return queryObject;
        }

        queryNode(nodeIndex: number, q1x: number, q1y: number, q2x: number, q2y: number, queryObject: { results: number[], counter: number }): { results: number[], counter: number } {
            let thisNode = this.nodes[nodeIndex];
            if (q1x > thisNode.bounds.p1.x && q2x < thisNode.bounds.p2.x) {
                if (q1y > thisNode.bounds.p1.y && q2y < thisNode.bounds.p2.y) {
                    if (thisNode.child1node) {
                        this.queryNode(thisNode.child1, q1x, q1y, q2x, q2y, queryObject);
                    }
                    else if (thisNode.child1node === false) { // Must be explicitly false to be considered an object index!
                        // Since this is NOT a node, add the value to the results as an object index
                        queryObject.results[queryObject.counter] = thisNode.child1;
                        queryObject.counter++;
                    }

                    if (thisNode.child2node) {
                        this.queryNode(thisNode.child2, q1x, q1y, q2x, q2y, queryObject);
                    }
                    else if (thisNode.child2node === false) { // Must be explicitly false to be considered an object index!
                        // Since this is NOT a node, add the value to the results as an object index
                        queryObject.results[queryObject.counter] = thisNode.child2;
                        queryObject.counter++;
                    }
                }
            }

            return queryObject;
        }

        getNodeIndex(): number {
            for (let index=0; index++; index < this.nodes.length) {
                if (!this.nodes[index].active) {
                    return index;
                }
            }
            this.nodes.push(QueryTree.NewNode(0,0,0,0));
            return this.nodes.length - 1;
        }

        insert(feature: BasicFeature & { objectNode?: number }): number {
            if (this.totalObjects > 1) {
                let bestSiblingIndex = this.findSibling(feature);
                let bestSibling = this.nodes[bestSiblingIndex];

                let siblingParentIndex = this.nodes[bestSiblingIndex].parent;
                let siblingParent = this.nodes[siblingParentIndex];

                let newIndex = this.getNodeIndex();
                let newNode = this.nodes[newIndex];
                newNode.parent = siblingParentIndex;
                feature.objectNode = newIndex;

                if (siblingParent.child1 === bestSiblingIndex) {
                    siblingParent.child1 = newIndex;
                    siblingParent.child1node = true;
                }
                else {
                    siblingParent.child2 = newIndex;
                    siblingParent.child2node = true;
                }

                this.totalObjects++;

                newNode.child1node = true;
                newNode.child1 = bestSiblingIndex;
                newNode.child1Cost = bestSibling.cost;
                newNode.child2node = false;
                newNode.child2 = feature.index;
                newNode.child2Cost = Rect.AreaP(feature.pos.x - feature.size.x, feature.pos.y - feature.size.y, feature.pos.x + feature.size.x, feature.pos.y + feature.size.y);

                bestSibling.parent = newIndex;
                feature.objectNode = newIndex;

                this.calculateUnions(newIndex, bestSiblingIndex, feature);
            }
            else {
                if (this.totalObjects < 1) {
                    this.nodes[0].child1node = false;
                    this.nodes[0].child1 = feature.index;
                }
                else {
                    this.nodes[0].child2node = false;
                    this.nodes[0].child2 = feature.index;
                }
                this.totalObjects++;
                return 0;
            }


        }

        calculateUnions(nodeIndex: number, growingIndex: number, feature?: BasicFeature) {
            let thisNode = this.nodes[nodeIndex];

            if (!feature) {
                thisNode.bounds = this.union(thisNode.bounds, this.nodes[growingIndex].bounds);
            }
            else {
                thisNode.union.setCoords(feature.pos.x - feature.sizeR, feature.pos.y - feature.sizeR, feature.pos.x + feature.sizeR, feature.pos.y + feature.sizeR);
                thisNode.bounds = this.union(thisNode.bounds, thisNode.union);
            }

            thisNode.cost = thisNode.bounds.area();

            this.tryRotations(nodeIndex);

            if (this.currentRoot !== nodeIndex) {
                this.calculateUnions(this.nodes[nodeIndex].parent, nodeIndex);
            }
        }

        tryRotations(grandParentIndex: number) {
            let grandParent = this.nodes[grandParentIndex];

            if (grandParent.child1node) {
                // Check parent children for possible swap with uncle
                let bestIndex = this.checkRotate(this.nodes[grandParent.child1], this.nodes[grandParent.child2].cost);

                if (bestIndex !== null) {
                    this.swapChildren(grandParent.child1, bestIndex);
                }
            }
            if (grandParent.child2node) {
                // Check parent children for possible swap with uncle
                let bestIndex = this.checkRotate(this.nodes[grandParent.child2], this.nodes[grandParent.child1].cost);

                if (bestIndex !== null) {
                    this.swapChildren(grandParent.child2, bestIndex);
                }
            }
        }

        swapChildren(child1: number, child2: number) {
            let child1Parent = this.nodes[child1].parent;
            this.nodes[child1].parent = this.nodes[child2].parent;
            this.nodes[child2].parent = child1Parent;
        }

        checkRotate(parent: QueryNode, bestCost: number) {
            let grandChild1 = this.nodes[parent.child1];
            let grandChild2 = this.nodes[parent.child2];

            if (grandChild1.cost < bestCost) {
                // Can rotate
                return parent.child1;
            }
            else if (grandChild2.cost < bestCost) {
                // Can rotate
                return parent.child2;
            }
            return null;
        }

        union(bound1: Rect, bound2: Rect, unionResult: Rect = bound1): Rect {
            unionResult.p1.x = bound1.p1.x < bound2.p1.x ? bound1.p1.x : bound2.p1.x;
            unionResult.p1.y = bound1.p1.y < bound2.p1.y ? bound1.p1.y : bound2.p1.y;
            unionResult.p2.x = bound1.p2.x > bound2.p2.x ? bound1.p2.x : bound2.p2.x;
            unionResult.p2.y = bound1.p2.y > bound2.p2.y ? bound1.p2.y : bound2.p2.y;
            return unionResult;
        }

        findSibling(feature: BasicFeature & { featureCost?: number, bestSibling?: number, bestCost?: number }, nodeIndex: number = this.currentRoot): number {
            // Measure feature bounds
            this.nodes[nodeIndex].union.setCoords(feature.pos.x - feature.sizeR, feature.pos.y - feature.sizeR, feature.pos.x + feature.sizeR, feature.pos.y + feature.sizeR);
            feature.featureCost = this.nodes[nodeIndex].union.area();
            // Union to get current best cost (area)
            this.nodes[nodeIndex].union = this.union(this.nodes[nodeIndex].union, this.nodes[nodeIndex].bounds);
            feature.bestCost = this.nodes[nodeIndex].union.area() + 5;
            feature.bestSibling = nodeIndex;
            this.bAndB (feature, nodeIndex, 0);
            return feature.bestSibling;
        }

        bAndB (feature: BasicFeature & { featureCost?: number, bestSibling?: number, bestCost?: number }, nodeIndex: number, inheritedCost: number) {
            let thisNode = this.nodes[nodeIndex];

            // Measure feature bounds
            thisNode.union.setCoords(feature.pos.x - feature.sizeR, feature.pos.y - feature.sizeR, feature.pos.x + feature.sizeR, feature.pos.y + feature.sizeR);
            
            thisNode.union = this.union(thisNode.union, thisNode.bounds);
            let directCost = thisNode.union.area();
            if (directCost + inheritedCost < feature.bestCost) {
                feature.bestSibling = nodeIndex;
                feature.bestCost = directCost + inheritedCost;
                thisNode.inheritedCost = (directCost - thisNode.bounds.area()) + inheritedCost;
                if (feature.featureCost + thisNode.inheritedCost < feature.bestCost) {
                    if (thisNode.child1node) {
                        this.bAndB(feature, thisNode.child1, thisNode.inheritedCost);
                    }
                    if (thisNode.child2node) {
                        this.bAndB(feature, thisNode.child2, thisNode.inheritedCost);
                    }
                }
            }

            return feature.bestSibling;
        }

        remove() {

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
        (<any>window).setRequire('./Engine.js', { TopDownEngine: TopDownEngine });
    }
}
