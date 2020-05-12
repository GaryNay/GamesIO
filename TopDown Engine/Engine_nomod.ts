    //** Vectors
    class Nums {
        static mathPIover180: number = Math.PI / 180;
        static sign(num: number): number {
            return num ? num > 0 ? 1 : -1 : 0;
        }
    }
    interface ICoord {
        x?: number;
        y?: number;
    }
    class Coord {
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
    interface IRect {
        p1?: Coord;
        size?: ICoord;
        p2?: Coord;
    }
    class Rect {
        p1: Coord;
        p2: Coord;
        size: ICoord = { x: 0, y: 0 };

        angle?: number;

        constructor(x1: number = 0, y1: number = 0, x2: number = 0, y2: number = 0) {
            this.p1 = new Coord(x1, y1);
            this.p2 = new Coord(x2, y2);
            this.resetSize();
        }

        static FromRect(fromRect: Rect | IRect): Rect {
            return new Rect(fromRect.p1.x, fromRect.p1.y, fromRect.p2.x, fromRect.p2.y);
        }

        static AreaP(x1: number, y1: number, x2: number, y2: number): number {
            return Math.abs(x1 - x2) * Math.abs(y1 - y2);
        }

        static Area(c1: Coord, c2: Coord): number {
            return Math.abs(c1.x - c2.x) * Math.abs(c1.y - c2.y);
        }

        resetSize() {
            this.size.x = Math.abs(this.p1.x - this.p2.x);
            this.size.y = Math.abs(this.p1.y - this.p2.y);
        }
        setCoords(x1, y1, x2, y2) {
            this.p1.x = x1;
            this.p1.y = y1;
            this.p2.x = x2;
            this.p2.y = y2;
            this.resetSize();
        }
        setRect(fromRect: Rect) {
            this.p1.x = fromRect.p1.x;
            this.p1.y = fromRect.p1.y;
            this.p2.x = fromRect.p2.x;
            this.p2.y = fromRect.p2.y;
            this.resetSize();
        }

        setRectPad(fromRect: Rect, padding = 0) {
            this.p1.x = fromRect.p1.x - padding;
            this.p1.y = fromRect.p1.y - padding;
            this.p2.x = fromRect.p2.x + padding;
            this.p2.y = fromRect.p2.y + padding;
            this.resetSize();
        }

        area(): number {
            return this.size.x * this.size.y;
        }

        containsCoord(coord: Coord | ICoord) {
            return (coord.x > this.p1.x)
                && (coord.x < this.p2.x)
                && (coord.y > this.p1.y)
                && (coord.y < this.p2.y);
        }
        containsCoordAndSize(coord: ICoord, size: ICoord) {
            return (coord.x + size.x / 2 > this.p1.x)
                && (coord.x - size.x / 2 < this.p2.x)
                && (coord.y + size.y / 2 > this.p1.y)
                && (coord.y - size.y / 2 < this.p2.y);
        }
        containsRect(rect: Rect) {
            return (this.p1.x < rect.p2.x)
                && (this.p2.x > rect.p1.x)
                && (this.p1.y < rect.p2.y)
                && (this.p2.y > rect.p1.y)
        }
        containsRectCoords(p1x: number, p1y: number, p2x: number, p2y: number) {
            return (this.p1.x < p2x)
                && (this.p2.x > p1x)
                && (this.p1.y < p2y)
                && (this.p2.y > p1y)
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

        fix() {
            let o;
            if (this.p2.x < this.p1.x) {
                o = this.p1.x;
                this.p1.x = this.p2.x;
                this.p2.x = o;
            };
            if (this.p2.y < this.p1.y) {
                o = this.p1.y;
                this.p1.y = this.p2.y;
                this.p2.y = o;
            };
        }

    }
    interface IMomentum {
        delta?: ICoord;
        angle?: number;
        velocity?: number
    }
    class Momentum {
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

    interface TouchResponse {
        touchedIndex?: number;
        collide?: boolean;
    }

    class BasicFeature {
        index: number = null;
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

        gameFrame(scene: Scene) {
        }

        whenTouched(toucher: BasicFeature, response: TouchResponse = { }): TouchResponse {
            response.touchedIndex = this.index;
            return response;
        }
    }

    class MovableFeature extends BasicFeature {
        targetPos = new Coord();
        checkPos = new Coord();
        lastQuery = new Rect();
        queryResults: QueryTreeResult; 
        momentum: Momentum;
        facing: Momentum;
        touchResponse: TouchResponse = {};

        constructor(facing?: Momentum | IMomentum, posX?: number, posY?: number, sizeX?: number, sizeY?: number, angle?: number, scale?: number, type?: string) {
            super(posX, posY, sizeX, sizeY, angle, scale, type);

            this.momentum = new Momentum(this.angle, 0);
            this.facing = Momentum.FromMomentum(facing || this.momentum);

            this.queryResults = { results: [], resultNumber: 0, stack: [] };
        }

        gameFrame(scene: Scene) {
            super.gameFrame(scene);
            // Validate query results
            if (!this.lastQuery.containsCoordAndSize(this.pos, this.size)) {
                this.lastQuery.setCoords(this.pos.x - 100, this.pos.y - 100, this.pos.x + 100, this.pos.y + 100);
                this.queryResults = scene.queryTree.query(this.lastQuery.p1.x, this.lastQuery.p1.y, this.lastQuery.p2.x, this.lastQuery.p2.y, this.queryResults);
            }
        }

        touch(feature: BasicFeature, response: TouchResponse = { }): TouchResponse {
            feature.whenTouched(feature, response);
            // Examine Response
            return response;
        }
    }

    class Scene {
        queryTree = new QueryTree();
        features: BasicFeature[] = [];

        constructor() {

        }

        registerFeature<T>(feature: T & BasicFeature) {
            this.features.push(feature);
            feature.index = this.features.length - 1;
            this.queryTree.insert(feature);
        }

        gameFrame() {

        }
    }

    interface QueryNode {
        active: boolean;
        nodeIndex: number;
        isFeature: boolean;
        featureIndex?: number;
        bounds: Rect;
        union: Rect;
        child1: number;
        child2: number;
        parent: number;
        cost: number;
        inheritedCost: number;
        bestSibling?: number;
        bestCost?: number;
    };

    interface QueryTreeResult {
        results: number[],
        stack: number[],
        resultNumber: number
    }

    class QueryTree {
        currentRoot: number;
        nodes: QueryNode[];
        padding = 5;
        queryStack: number[] = [];

        totalFeatures = 0;

        constructor() {
            this.nodes = [ QueryTree.NewNode(0,0,0,0, true, false) ];
            this.nodes[0].nodeIndex = 0;
            this.currentRoot = 0;
        }

        static NewNode(b1x: number, b1y: number, b2x: number, b2y: number, isActive = false, isFeature = false): QueryNode {
            return {
                active: isActive,
                nodeIndex: null,
                isFeature: isFeature,
                featureIndex: null,
                bounds: new Rect(b1x, b1y, b2x, b2y),
                union: new Rect(),
                child1: null,
                child2: null,
                parent: null,
                cost: Rect.AreaP(b1x, b1y, b2x, b2y),
                inheritedCost: 0
            };
        }

        getNodeIndex(): number {
            for (let index=0; index < this.nodes.length; index++) {
                if (!this.nodes[index].active) {
                    return index;
                }
            }
            this.nodes.push(QueryTree.NewNode(0,0,0,0));
            this.nodes[this.nodes.length - 1].nodeIndex = this.nodes.length - 1;
            return this.nodes.length - 1;
        }

        insert(feature: BasicFeature & { featureNode?: number }): number {
            let featureNodeIndex = this.getNodeIndex();
            let featureNode = this.nodes[featureNodeIndex];
            featureNode.active = true;
            featureNode.isFeature = true;
            featureNode.featureIndex = feature.index;
            featureNode.bounds.setCoords(
                feature.pos.x - feature.sizeR - this.padding,
                feature.pos.y - feature.sizeR - this.padding,
                feature.pos.x + feature.sizeR + this.padding,
                feature.pos.y + feature.sizeR + this.padding);
            featureNode.cost = featureNode.bounds.area();

            if (this.totalFeatures > 1) {
                let bestSiblingIndex = this.findSibling(featureNode);
                let bestSibling = this.nodes[bestSiblingIndex];

                let newIndex = this.getNodeIndex();
                let newNode = this.nodes[newIndex];
                newNode.active = true;
                
                // newNode.bounds.setRect(bestSibling.bounds);
                // newNode.bounds = this.union(bestSibling.bounds, featureNode.bounds, newNode.bounds, this.padding);
                // newNode.cost = newNode.bounds.area();
                feature.featureNode = featureNodeIndex;

                if (bestSiblingIndex === this.currentRoot) {
                    this.currentRoot = newIndex;    
                    newNode.parent = null;                
                }
                else {
                    let siblingParentIndex = this.nodes[bestSiblingIndex].parent;
                    let siblingParent = this.nodes[siblingParentIndex];
                    newNode.parent = siblingParentIndex;
        
                    if (siblingParent.child1 === bestSiblingIndex) {
                        siblingParent.child1 = newIndex;
                    }
                    else {
                        siblingParent.child2 = newIndex;
                    }
                }

                this.totalFeatures++;

                newNode.child1 = bestSiblingIndex;
                newNode.child2 = featureNodeIndex;

                featureNode.parent = newIndex;
                bestSibling.parent = newIndex;

                this.calculateUnions(newIndex);
            }
            else {
                let rootNode = this.nodes[this.currentRoot];
                if (this.totalFeatures === 1) {
                    rootNode.child2 = featureNodeIndex;
                    rootNode.bounds = this.union(this.nodes[rootNode.child1].bounds, featureNode.bounds, rootNode.bounds, this.padding);
                    this.totalFeatures = 2;
                }
                else {
                    rootNode.child1 = featureNodeIndex;
                    rootNode.bounds.setRectPad(featureNode.bounds, this.padding);
                    this.totalFeatures = 1;
                }
                rootNode.cost = rootNode.bounds.area();
                featureNode.parent = this.currentRoot;
                feature.featureNode = featureNode.nodeIndex;
                return this.currentRoot;
            }
        }

        calculateUnions(nodeIndex: number) {
            let thisNode = this.nodes[nodeIndex];
            let child1 = this.nodes[thisNode.child1];
            let child2 = this.nodes[thisNode.child2];

            thisNode.bounds = this.union(child1.bounds, child2.bounds, thisNode.bounds, this.padding);

            thisNode.cost = thisNode.bounds.area();
            this.tryRotations(thisNode);

            if (this.currentRoot !== nodeIndex) {
                this.calculateUnions(this.nodes[nodeIndex].parent);
            }
        }

        /*  Grand- O
                 /   \
                /     \                 
               /       \                
        Uncle-o  Parent-o
                      /   \
             GChld#1-c  #2-c

        */
        tryRotations(grandParent:QueryNode) {
            let testCost: number;
            let bestCost = grandParent.cost;
            let bestRotation: number = null;
            let bestUncleIndex: number = null;
            let bestChildIndex: number = null;
            let bestParentIndex: number = null;

            if (!this.nodes[ grandParent.child1 ].isFeature) {
                let parent = this.nodes[grandParent.child1];
                let child1 = this.nodes[parent.child1];
                let child2 = this.nodes[parent.child2];

                let uncle = this.nodes[grandParent.child2];

                parent.union = this.union(uncle.bounds, child1.bounds, parent.union, this.padding);
                grandParent.union = this.union(child2.bounds, parent.union, grandParent.union, this.padding);
                testCost = grandParent.union.area();
                if (testCost < bestCost) {
                    bestCost = testCost;
                    bestRotation = 1;
                    bestUncleIndex = uncle.nodeIndex;
                    bestChildIndex = child2.nodeIndex;
                    bestParentIndex = parent.nodeIndex;
                }
                parent.union = this.union(uncle.bounds, child2.bounds, parent.union, this.padding);
                grandParent.union = this.union(child1.bounds, parent.union, grandParent.union, this.padding);
                testCost = grandParent.union.area();
                if (testCost < bestCost) {
                    bestCost = testCost;
                    bestRotation = 2;
                    bestUncleIndex = uncle.nodeIndex;
                    bestChildIndex = child1.nodeIndex;
                    bestParentIndex = parent.nodeIndex;
                }

            }
            if (!this.nodes[ grandParent.child2 ].isFeature) {
                let uncle = this.nodes[grandParent.child1];
                let parent = this.nodes[grandParent.child2];
                let child1 = this.nodes[parent.child1];
                let child2 = this.nodes[parent.child2];

                parent.union = this.union(uncle.bounds, child1.bounds, parent.union, this.padding);
                grandParent.union = this.union(child2.bounds, parent.union, grandParent.union, this.padding);
                testCost = grandParent.union.area();
                if (testCost < bestCost) {
                    bestCost = testCost;
                    bestRotation = 3;
                    bestCost = testCost;
                    bestUncleIndex = uncle.nodeIndex;
                    bestChildIndex = child2.nodeIndex;
                    bestParentIndex = parent.nodeIndex;
                }
                parent.union = this.union(uncle.bounds, child2.bounds, parent.union, this.padding);
                grandParent.union = this.union(child1.bounds, parent.union, grandParent.union, this.padding);
                testCost = grandParent.union.area();
                if (testCost < bestCost) {
                    bestCost = testCost;
                    bestRotation = 4;
                    bestUncleIndex = uncle.nodeIndex;
                    bestChildIndex = child1.nodeIndex;
                    bestParentIndex = parent.nodeIndex;
                }
            }

            if (bestRotation) {
                this.swapNodes(grandParent, this.nodes[ bestUncleIndex ], this.nodes[ bestParentIndex ], this.nodes[ bestChildIndex ], bestRotation);
            }
        }

        swapNodes(grandParent: QueryNode, uncle: QueryNode, parent: QueryNode, child: QueryNode, rotationType: number) {
            // console.log(`Swapping gp# ${ grandParent.nodeIndex } w/ rotation type: ${ rotationType }`);
            // if (grandParent.nodeIndex === this.currentRoot) {
            //     console.log(`Grandparent is root!`);
            // }
            let otherChild: QueryNode;
            if (rotationType === 1 || rotationType === 3) {
                parent.child2 = uncle.nodeIndex;
                otherChild = this.nodes[parent.child1];
            }
            else {
                parent.child1 = uncle.nodeIndex;
                otherChild = this.nodes[parent.child2];
            }
            uncle.parent = parent.nodeIndex;

            if (rotationType === 1 || rotationType === 2) {
                grandParent.child2 = child.nodeIndex;
            }
            else {
                grandParent.child1 = child.nodeIndex;
            }
            child.parent = grandParent.nodeIndex;

            parent.bounds = this.union(uncle.bounds, otherChild.bounds, parent.bounds, this.padding);
            parent.cost = parent.bounds.area();
            grandParent.bounds = this.union(parent.bounds, child.bounds, grandParent.bounds, this.padding);
            grandParent.cost = grandParent.bounds.area();
        }

        /*        O
                 / \
                /   \                 
               /     \                
            1-o       o
                     / \
                  2-c   c

        */

        union(bound1: Rect, bound2: Rect, unionResult: Rect = bound1, padding = 0): Rect {
            unionResult.p1.x = (bound1.p1.x < bound2.p1.x ? bound1.p1.x: bound2.p1.x) - padding;
            unionResult.p1.y = (bound1.p1.y < bound2.p1.y ? bound1.p1.y: bound2.p1.y) - padding;
            unionResult.p2.x = (bound1.p2.x > bound2.p2.x ? bound1.p2.x: bound2.p2.x) + padding;
            unionResult.p2.y = (bound1.p2.y > bound2.p2.y ? bound1.p2.y: bound2.p2.y) + padding;
            unionResult.resetSize();
            return unionResult;
        }

        findSibling(featureNode: QueryNode, nodeIndex: number = this.currentRoot): number {
            // Union to get current best cost (area)
            this.nodes[nodeIndex].union = this.union(featureNode.bounds, this.nodes[nodeIndex].bounds, this.nodes[nodeIndex].union);
            featureNode.bestCost = this.nodes[nodeIndex].union.area() + 5;
            featureNode.bestSibling = nodeIndex;
            this.bAndB (featureNode, nodeIndex, 0);
            return featureNode.bestSibling;
        }

        bAndB (featureNode: QueryNode, nodeIndex: number, inheritedCost: number) {
            let thisNode = this.nodes[nodeIndex];

            // Measure feature bounds
            // thisNode.union.setCoords(featureNode.pos.x - featureNode.sizeR, featureNode.pos.y - featureNode.sizeR, featureNode.pos.x + featureNode.sizeR, featureNode.pos.y + featureNode.sizeR);
            
            thisNode.union = this.union(featureNode.bounds, thisNode.bounds, thisNode.union);
            let directCost = thisNode.union.area();
            if (directCost + inheritedCost < featureNode.bestCost) {
                featureNode.bestSibling = nodeIndex;
                featureNode.bestCost = directCost + inheritedCost;
                thisNode.inheritedCost = (directCost - thisNode.bounds.area()) + inheritedCost;
                if (featureNode.cost  + thisNode.inheritedCost < featureNode.bestCost) {
                    if (!thisNode.isFeature) {
                        this.bAndB(featureNode, thisNode.child1, thisNode.inheritedCost);
                    }
                    if (!thisNode.isFeature) {
                        this.bAndB(featureNode, thisNode.child2, thisNode.inheritedCost);
                    }
                }
            }

            return featureNode.bestSibling;
        }

        reInsert(feature) {
            this.remove(feature);
            this.insert(feature);
        }

        remove(feature: BasicFeature & { featureNode?: number }) {
            if (this.totalFeatures > 2) {
                let featureNode = this.nodes[feature.featureNode];

                let oldParent = this.nodes[featureNode.parent];
                let newParent: QueryNode;

                // Get the sibling
                if (oldParent.child1 === feature.featureNode) {
                    newParent = this.nodes[oldParent.child2];
                }
                else {
                    newParent = this.nodes[oldParent.child1];
                }

                if (oldParent.nodeIndex !== this.currentRoot) {
                    let grandParent = this.nodes[oldParent.parent];
                    if (grandParent.child1 === oldParent.nodeIndex) {
                        grandParent.child1 = newParent.nodeIndex;
                    }
                    else {
                        grandParent.child2 = newParent.nodeIndex;
                    }
                    newParent.parent = grandParent.nodeIndex;
                }
                else {
                    // console.log(`Removed old root!`);
                    this.currentRoot = newParent.nodeIndex;
                }

                featureNode.active = false;
                oldParent.active = false;
                feature.featureNode = null;

                this.totalFeatures--;

                if (!newParent.isFeature) {
                    this.calculateUnions(newParent.nodeIndex);
                }
            }
            else {
                let rootNode = this.nodes[this.currentRoot];
                let featureNode = this.nodes[ feature.featureNode ];
                if (this.totalFeatures === 2) {
                    if (rootNode.child1 === featureNode.nodeIndex) {
                        rootNode.child1 = rootNode.child2;
                    }
                    rootNode.child2 = null;
                    rootNode.bounds.setRectPad(this.nodes[ rootNode.child1 ].bounds, this.padding);
                    rootNode.cost = rootNode.bounds.area();
                    this.totalFeatures = 1;
                }
                else {
                    rootNode.child1 = null;
                    rootNode.child2 = null;
                    rootNode.bounds.setCoords(0,0,0,0);
                    rootNode.cost = 0;
                    this.totalFeatures = 0;
                }
                featureNode.active = false;
            }
        }

        renderVisually(canvas: HTMLCanvasElement) {
            let ctx = canvas.getContext('2d');
            ctx.clearRect(0,0,1000, 400);
            for (let eachNode of this.nodes) {
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = eachNode.isFeature ? 'red' : 'blue';
                ctx.rect(
                    Math.round(eachNode.bounds.p1.x),
                    Math.round(eachNode.bounds.p1.y),
                    Math.round(eachNode.bounds.width()),
                    Math.round(eachNode.bounds.height())
                );
                ctx.stroke();
            }
        }

        auditTree() {
            let foundObjects = 0;
            let nodeStack: number[] = [ this.currentRoot ];
            
            while (nodeStack.length) {
                // Pop node
                let nextNodeIndex = nodeStack.pop();
                let nextNode = this.nodes[nextNodeIndex];

                if (nextNode.isFeature) {
                    foundObjects++;
                }
                else {
                    nodeStack.push(nextNode.child1, nextNode.child2);
                }
            }

            console.log(`Found ${ foundObjects } of ${ this.totalFeatures }`);
        }

        query(q1x: number, q1y: number, q2x: number, q2y: number, queryObject: QueryTreeResult = { results: [], stack: [], resultNumber: 0 }): QueryTreeResult {
            queryObject.resultNumber = 0;
            queryObject.stack.push(this.currentRoot);

            while (queryObject.stack.length) {
                let nextNodeIndex = queryObject.stack.pop();
                let thisNode = this.nodes[nextNodeIndex];

                if (!thisNode || !thisNode.active) {
                    continue;
                }

                if (thisNode.bounds.containsRectCoords(q1x, q1y, q2x, q2y)) {
                    if (thisNode.isFeature) {
                        queryObject.results[queryObject.resultNumber] = thisNode.featureIndex;
                        queryObject.resultNumber++;
                    }
                    else {
                        queryObject.stack.push(thisNode.child1, thisNode.child2);
                    }
                }
            }
            return queryObject;
        }

    }

    class Mouse {
        point = new Coord();
        dragStart = new Coord();
        dragBounds: Rect = new Rect();
        scaleX: number = 1;
        scaleY: number = 1;
        down: number;
        dragging: boolean;
        clicked: boolean;
        wheel: any;
        wheelVec: any;

        onClick: (point: Coord) => void;
        onDrag: (dragBounds: Rect) => void;
        onMove: (point: Coord, dragStart?: Coord) => void;
        onWheel: (wheel: number, wheelDelta: number) => void;
        
        constructor (private mouseElement: HTMLCanvasElement) {
            mouseElement.addEventListener('mousemove', (e) => { this.mouseListener("move", e); }, false);
            mouseElement.addEventListener('mousedown', (e) => { this.mouseListener("down", e); }, false);
            mouseElement.addEventListener('mouseup'  , (e) => { this.mouseListener("up",   e); }, false);
            mouseElement.addEventListener('mouseout' , (e) => { this.mouseListener("out",  e); }, false);
            mouseElement.addEventListener('wheel',     (e) => { this.mouseListener("wheel",e); }, false);
        }

        mouseListener (doing, theEvent) {
            switch (doing) {
                case 'move':
                    if (this.down && !this.dragging) {
                        this.dragStart.x = this.point.x;
                        this.dragStart.y = this.point.y;
                        this.dragging = true;
                    }

                    this.point.x = (theEvent.clientX - this.mouseElement.offsetLeft) * this.scaleX; //.left;
                    this.point.y = (theEvent.clientY - this.mouseElement.offsetTop) * this.scaleY; //.top;

                    this.onMove && this.onMove(this.point, this.down ? this.dragStart : null);
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
                    this.wheel += theEvent.deltaY;

                    this.wheelVec = theEvent.deltaY;
                    //theMouse.wz += theEvent.deltaZ;
                    this.onWheel && this.onWheel(this.wheel, this.wheelVec);
                    break;
                case 'out': break;
                default:
                    break;
            }
        }
       
    }

    class FeatureClicker extends Mouse {

        constructor (private ourCanvas: HTMLCanvasElement, private objectArray: BasicFeature[], private tree: QueryTree) {
            super(ourCanvas);

            this.onClick = (point: Coord) => {
                let feature = new BasicFeature(this.point.x, this.point.y, 5 + Math.random() * 20, 5 + Math.random() * 5);

                this.objectArray.push(feature);
                feature.index = this.objectArray.length - 1;
                this.tree.insert(feature);
                this.tree.renderVisually(this.ourCanvas);
            };

            this.onDrag = (qBounds: Rect) => {
                setTimeout(() => {

                    console.log(`Querying (${ qBounds.p1.x }, ${ qBounds.p1.y })-(${ qBounds.p2.x }, ${ qBounds.p2.y })!`);
                    let results = this.tree.query(qBounds.p1.x, qBounds.p1.y, qBounds.p2.x, qBounds.p2.y);
                    
                    if (results.resultNumber) {
                        console.log(`Showing ${ results.resultNumber } features from query!`);
                        console.log(results);

                        this.tree.renderVisually(this.ourCanvas);

                        let ctx = this.ourCanvas.getContext('2d');
                        for (let eachIndex = 0; eachIndex < results.resultNumber; eachIndex++) {
                            let ftr = this.objectArray[ results.results[ eachIndex ] ];
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