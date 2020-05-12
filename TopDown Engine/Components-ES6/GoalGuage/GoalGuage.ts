import { ItemsObserver } from "../Mixins/ItemsObserver";

export class GoalGuage extends ItemsObserver.extends(HTMLElement) {
    souceDocument: Document;
    containerSpan: HTMLSpanElement;
    private canvas: HTMLCanvasElement;
    public guageType: 'guage' | 'bar' | 'ring' | string;
    public total: number;
    public forcasted: number;
    public goal: number;
    public needles: Needle[];
    public tickSpacing: number;
    public tickWidth: number;
    public tickHeight: number;
    public tickStyle: string;
    private renderCallback: (total: number, goal: number, forcasted?: number) => void;
    constructor() {
        super();
    }

    connectedCallback() {
        let self: (GoalGuage & HTMLElement) = this as any;

        self.guageType = 'bar';
        if (self.hasAttribute('guage')) {
            self.guageType = 'guage';
        }
        if (self.hasAttribute('ring')) {
            self.guageType = 'altRing';
        }

        if (self.hasAttribute('color-callback')) {
            self.getGoalColorStyle = ItemsObserver.getParentTargetReference(self.getAttribute('color-callback')).target || self.getGoalColorStyle;
        }

        self.collectionAttribute = 'value';
        ItemsObserver.connectedCallback.apply(self);

        if (self.hasAttribute('value2')) {
            let key = self.getAttribute('value2');
            self.altValueProperty = self.addObservedKey(key, false);
            self.observe(key);
        }
        if (self.hasAttribute('goal')) {
            let key = self.getAttribute('goal');
            self.goalProperty = self.addObservedKey(key, false);
            self.observe(key);
        }

        self.containerSpan = document.createElement('span');
        self.canvas = document.createElement('canvas');
        let cStyle = getComputedStyle(self);
        self.canvas.width = parseInt(cStyle.width) || 250;
        self.canvas.height = parseInt(cStyle.height) || 200;
        self.containerSpan.appendChild(self.canvas);
        self.appendChild(self.containerSpan);

        self.render();
    }

    private getGoalColorStyle: (percent: number) => string = (percent) => {
        let fixedPercent = percent < 0 ? 0 : percent > 1 ? 1 : percent;
        let cVal = 255 * fixedPercent;
        return `rgb(${cVal},${cVal},${cVal})`;
    }

    public addCustomRender(renderCallbackName: string, renderFn: (total: number, goal: number) => void) {
        if (renderCallbackName && renderFn) {
            this.renderingCallbacks[renderCallbackName] = renderFn;
        }
    }

    update(updated: any, key: string, value: any) {
        let self: GoalGuage = this as any;

        if (key === (self.defaultTargetProperty || key)) {
            self.total = value || 0;
        }
        else if (key === self.altValueProperty) {
            self.forcasted = value || 0;
        }
        else if (key === self.goalProperty) {
            self.goal = value || 0;
        }

        if (self.canvas) {
            self.render();
        }
    }

    private lastRenderedType: string;
    render(total: number = this.total, goal: number = this.goal, forcasted: number = this.forcasted) {
        if (!this.renderCallback || this.guageType !== this.lastRenderedType) {
            this.guageType = this.lastRenderedType = this.guageType || 'guage';
            this.renderCallback = this.renderingCallbacks[this.guageType];
            if (!this.renderCallback) {
                return;
            }
        }
        this.renderCallback(total, goal, forcasted);
    }

    private renderingCallbacks: { [renderer: string]: (total: number, goal: number, forcasted?: number) => void } = {
        guage: (total: number, goal: number) => {
            let canvasWidth = this.canvas.width;
            let canvasHeight = this.canvas.height;
            let centerX = canvasWidth * .5;
            let centerY = canvasHeight * .75;
            let defaultGuageSize = canvasHeight * .625;

            let guageAngleSweep = 150;
            let guageAngleOffset = 285;
            let baseNeedleAngle = goal && typeof (goal) === 'number' ? ((total || 0) / goal) * guageAngleSweep : 0;

            let guagePrecision = .25;                       // draw every angle
            let guageBottom = canvasHeight * .375;          // ~75px
            let guageHeight = canvasHeight * .25;           // ~50px
            let ticksSpacing = this.tickSpacing || 12.5;    // percent of goal
            let tickWidth = this.tickWidth || .5;           // angle
            let tickHeight = this.tickHeight || (canvasHeight * .05); // px
            let tickStyle = this.tickStyle || 'rgba(0,0,0,.5)';

            let goalEndAngle = guageAngleSweep;
            if (total >= goal) {
                baseNeedleAngle = guageAngleSweep;
                goalEndAngle = (goal / total) * guageAngleSweep;
            }
            let anglePerTick = goalEndAngle * (ticksSpacing / 100);

            let context = this.canvas.getContext('2d');
            context.save();
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            // Render Guage Background
            for (let angle = 0; angle < guageAngleSweep; angle += guagePrecision) {
                let radians = GoalGuage.radians((guageAngleOffset - 90) + angle);

                let percentOfGoal = angle / goalEndAngle;
                let bottomX = Math.cos(radians) * guageBottom + centerX;
                let bottomY = Math.sin(radians) * guageBottom + centerY;
                let topX = Math.cos(radians) * (guageHeight + guageBottom) + centerX;
                let topY = Math.sin(radians) * (guageHeight + guageBottom) + centerY;

                context.globalCompositeOperation = 'source-over';
                context.beginPath();
                context.moveTo(bottomX, bottomY);
                context.lineWidth = 1.5;
                let style = this.getGoalColorStyle(percentOfGoal);
                context.strokeStyle = style;
                context.globalAlpha = angle < baseNeedleAngle ? 1 : .2;
                context.lineTo(topX, topY);
                context.stroke();
            }
            context.globalAlpha = 1;
            // Render Guage Ticks
            for (let angle = 0; angle < guageAngleSweep; angle += guagePrecision) {
                let radians = GoalGuage.radians((guageAngleOffset - 90) + angle);

                let angleMod = angle % anglePerTick;
                if ((angleMod > anglePerTick - tickWidth) || (angleMod < tickWidth)) {

                    let tickSizeModifier = Math.round(angle / anglePerTick) !== Math.round(goalEndAngle / anglePerTick)
                        ? (Math.round(angle / anglePerTick) % 2) + 1
                        : .5;
                    let topX = Math.cos(radians) * (guageHeight + guageBottom) + centerX;
                    let topY = Math.sin(radians) * (guageHeight + guageBottom) + centerY;
                    let tickX = Math.cos(radians) * (guageHeight + guageBottom - (tickHeight / tickSizeModifier)) + centerX;
                    let tickY = Math.sin(radians) * (guageHeight + guageBottom - (tickHeight / tickSizeModifier)) + centerY;
                    context.beginPath();
                    context.moveTo(topX, topY);
                    context.lineWidth = 1;
                    context.strokeStyle = tickStyle;
                    context.lineTo(tickX, tickY);
                    context.stroke();
                }

            }
            // Create needleSet with base needle
            let needleSet = [{
                angle: baseNeedleAngle,
                style: 'rgba(0,0,0,.65)',
                text: `${Math.floor((total / goal) * 100) || 0}%`,
                textStyle: 'rgb(0,0,0)',
                textCenterDiameter: 35,
                textBgFillStyle: 'rgb(255,255,255)',
                textBgStrokeStyle: 'rgb(0,0,0)',
                textBottom: 0,
                textFont: 'bold 12px arial',
                order: 0
            } as Needle].concat(this.needles || []);
            // Render Needles
            for (let eachNeedle of needleSet.sort((sortNeedle, compareNeedle) => { return sortNeedle.order - compareNeedle.order; })) {
                let needleWidth = eachNeedle.width || 20;
                let needleHeight = eachNeedle.height || 125;

                let needleAngle = eachNeedle.angle;

                if (!needleAngle && needleAngle !== 0) {
                    if (!eachNeedle.percent) {
                        eachNeedle.percent = (eachNeedle.total || 0) / goal;
                    }
                    needleAngle = ((eachNeedle.percent / goalEndAngle) * goalEndAngle) / guageAngleSweep;
                }
                context.translate(centerX, centerY);
                context.rotate(GoalGuage.radians(guageAngleOffset + needleAngle));
                context.beginPath();
                context.moveTo(-needleWidth / 2, 0);
                context.lineWidth = 1;
                context.strokeStyle = eachNeedle.lineStyle || eachNeedle.style || 'rgb(0,0,0,.65)';
                context.lineTo(0, -needleHeight);
                context.lineTo(needleWidth / 2, 0);
                context.arc(0, 0, needleWidth / 2, 0, Math.PI);
                context.stroke();
                context.fillStyle = eachNeedle.fillStyle || eachNeedle.style || 'rgb(0,0,0,.65)';
                context.fill();
                if (eachNeedle.text) {
                    context.beginPath();
                    context.translate(0, -eachNeedle.textBottom);
                    context.arc(0, 0, eachNeedle.textCenterDiameter / 2, 0, 2 * Math.PI);
                    context.fillStyle = eachNeedle.textBgFillStyle || 'rgb(255,255,255)';
                    context.fill();
                    context.strokeStyle = eachNeedle.textBgStrokeStyle || 'rgb(0,0,0)';
                    context.lineWidth = 2;
                    context.stroke();
                    context.beginPath();
                    context.strokeStyle = eachNeedle.textStyle || eachNeedle.lineStyle || eachNeedle.style || 'rgb(0,0,0,1)';
                    context.fillStyle = eachNeedle.textStyle || eachNeedle.fillStyle || eachNeedle.style || 'rgb(0,0,0,1)';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.rotate(-GoalGuage.radians(guageAngleOffset + needleAngle));
                    context.font = eachNeedle.textFont || 'bold 12px arial';
                    context.fillText(eachNeedle.text, 0, 0);
                }
            }
            context.restore();
        },
        bar: (total: number, goal: number) => {
            let canvasWidth = this.canvas.width;
            let canvasHeight = this.canvas.height;
            let centerX = canvasWidth * .5;
            let centerY = canvasHeight * .5;

            let guagePrecision = 1;
            let guageHeight = canvasHeight * .8;
            let heightOffset = canvasHeight * .1;
            let guageWidth = guageHeight * .25;
            let ticksSpacing = this.tickSpacing || 12.5;    // percent of goal
            let tickWidth = this.tickWidth || 1;           // px
            let tickHeight = this.tickHeight || (guageHeight * .05); // px
            let tickStyle = this.tickStyle || 'rgba(0,0,0,.5)';

            let baseNeedleHeight = goal && typeof (goal) === 'number' ? ((total || 0) / goal) * guageHeight : 0;
            let goalEndHeight = guageHeight;
            if (total >= goal) {
                baseNeedleHeight = guageHeight;
                goalEndHeight = (goal / total) * guageHeight;
            }
            let heightPerTick = goalEndHeight * (ticksSpacing / 100);

            let context = this.canvas.getContext('2d');
            context.save();
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            // Render Guage Background
            for (let hCounter = 0; hCounter < guageHeight; hCounter += guagePrecision) {
                let percentOfGoal = hCounter / goalEndHeight;
                let height = guageHeight - hCounter + heightOffset;

                context.globalCompositeOperation = 'source-over';
                context.beginPath();
                context.moveTo(centerX - guageWidth / 2, height);
                context.lineWidth = 1.5;
                let style = this.getGoalColorStyle(percentOfGoal);
                context.strokeStyle = style;
                context.globalAlpha = hCounter > baseNeedleHeight ? .5 : 1;
                context.lineTo(centerX + guageWidth / 2, height);
                context.stroke();
            }
            context.globalAlpha = 1;
            // Render Guage Ticks
            for (let hCounter = 0; hCounter < guageHeight; hCounter += guagePrecision) {
                let height = guageHeight - hCounter + heightOffset;
                let heightMod = hCounter % heightPerTick;
                if ((heightMod > heightPerTick - tickWidth) || (heightMod < tickWidth)) {

                    let tickSizeModifier = Math.round(hCounter / heightPerTick) !== Math.round(goalEndHeight / heightPerTick)
                        ? (1 - (Math.round(hCounter / heightPerTick) % 2)) + .5
                        : 2.5;
                    context.beginPath();
                    let tickX = centerX - guageWidth / 2;
                    context.moveTo(tickX, height);
                    context.lineWidth = 1.5;
                    context.strokeStyle = tickStyle;
                    context.lineTo(tickX + (tickSizeModifier * tickHeight), height);
                    context.stroke();
                }

            }
            // Create needleSet with base needle
            let needleSet = [{
                bottom: baseNeedleHeight,
                style: 'rgba(0,0,0,.65)',
                text: `${Math.floor((total / goal) * 100) || 0}%`,
                textStyle: 'rgb(0,0,0)',
                textFont: 'bold 12px arial',
                textBottom: 60,
                order: 0
            } as Needle].concat(this.needles || []);
            // Render Needles
            for (let eachNeedle of needleSet.sort((sortNeedle, compareNeedle) => { return sortNeedle.order - compareNeedle.order; })) {
                let needleWidth = eachNeedle.width || guageWidth;
                let needleHeight = eachNeedle.height || tickWidth;
                let needleBottom = heightOffset + guageHeight - eachNeedle.bottom;
                let needleTop = needleBottom - needleHeight;
                let needleLeft = centerX - (needleWidth / 2);
                let needleRight = centerX + (needleWidth / 2);
                let arrowLength = needleWidth * .1;

                if (!needleBottom && needleBottom !== 0) {
                    if (!eachNeedle.percent) {
                        eachNeedle.percent = (eachNeedle.total || 0) / goal;
                    }
                    needleBottom = ((eachNeedle.percent / goalEndHeight) * goalEndHeight) / guageHeight;
                }
                context.beginPath();
                context.lineWidth = .5;
                context.strokeStyle = eachNeedle.lineStyle || eachNeedle.style || 'rgb(0,0,0,.65)';
                context.fillStyle = eachNeedle.fillStyle || eachNeedle.style || 'rgb(0,0,0,.65)';
                // Draw triangles at needle ends
                context.moveTo(needleLeft, needleBottom + arrowLength);
                context.lineTo(needleLeft, needleBottom - arrowLength);
                context.lineTo(needleLeft + arrowLength, needleTop);
                context.lineTo(needleRight - arrowLength, needleTop);
                context.lineTo(needleRight, needleTop - arrowLength);
                context.lineTo(needleRight, needleBottom + arrowLength);
                context.lineTo(needleRight - arrowLength, needleBottom);
                context.lineTo(needleLeft + arrowLength, needleBottom);
                context.moveTo(needleLeft, needleBottom + arrowLength);

                context.stroke();
                context.fill();
                if (eachNeedle.text) {
                    context.beginPath();
                    context.arc(centerX - (needleWidth / 2) + eachNeedle.textBottom, needleBottom - (needleHeight / 2), eachNeedle.textCenterDiameter / 2, 0, 2 * Math.PI);
                    context.fillStyle = eachNeedle.textBgFillStyle || 'rgb(255,255,255)';
                    context.fill();
                    context.strokeStyle = eachNeedle.textBgStrokeStyle || 'rgb(0,0,0)';
                    context.lineWidth = 2;
                    context.stroke();
                    context.beginPath();
                    context.strokeStyle = eachNeedle.textStyle || eachNeedle.lineStyle || eachNeedle.style || 'rgb(0,0,0,1)';
                    context.fillStyle = eachNeedle.textStyle || eachNeedle.fillStyle || eachNeedle.style || 'rgb(0,0,0,1)';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.font = eachNeedle.textFont || 'bold 12px arial';
                    context.fillText(eachNeedle.text, centerX - (needleWidth / 2) + eachNeedle.textBottom, needleBottom - (needleHeight / 2));
                }
            }
            context.restore();
        },
        ring: (total: number, goal: number) => {

            let canvasWidth = this.canvas.width;
            let canvasHeight = this.canvas.height;
            let centerX = canvasWidth * .5;
            let centerY = canvasHeight * .5;
            let ringHeight = 10;
            let ringBottom = 75;
            // let defaultGuageSize = canvasHeight * .625;

            let ringPrecision = .25;                       // draw every angle

            let style = this.getGoalColorStyle(total / goal);
            let goalEndAngle = 360;
            let totalEndAngle = 0;
            if (total >= goal) {
                goalEndAngle = (goal / total) * 360;
                totalEndAngle = 360;
            }
            else {
                totalEndAngle = (total / goal) * 360;
            }

            let context = this.canvas.getContext('2d');
            context.save();
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            // Render Ring
            for (let angle = 0; angle < 360; angle += ringPrecision) {
                let radians = GoalGuage.radians(angle + 90);

                let bottomX = Math.cos(radians) * ringBottom + centerX;
                let bottomY = Math.sin(radians) * ringBottom + centerY;
                let topX = Math.cos(radians) * (ringHeight + ringBottom) + centerX;
                let topY = Math.sin(radians) * (ringHeight + ringBottom) + centerY;

                context.globalCompositeOperation = 'source-over';
                context.beginPath();
                context.moveTo(bottomX, bottomY);
                context.lineWidth = 1.5;
                if (angle <= totalEndAngle) {
                    context.strokeStyle = style;
                }
                else {
                    context.strokeStyle = '#eee';
                }
                context.lineTo(topX, topY);
                context.stroke();
                if (total > goal && angle >= goalEndAngle - (ringPrecision * 2) && angle <= goalEndAngle + (ringPrecision * 2)) {
                    context.beginPath();
                    context.moveTo(topX, topY);
                    context.strokeStyle = '#000';
                    let tipX = Math.cos(radians) * ((ringHeight * 1.4) + ringBottom) + centerX;
                    let tipY = Math.sin(radians) * ((ringHeight * 1.4) + ringBottom) + centerY;
                    context.lineTo(tipX, tipY);
                    context.stroke();
                }
            }
            context.globalAlpha = 1;
            context.restore();
        },
        altRing: (total: number, goal: number, forcasted: number) => {
            let self: GoalGuage & HTMLElement = <any>this;
            let computedStyle = getComputedStyle(self);

            let writtenStyle = computedStyle.getPropertyValue(`--written-color`);
            let forcastedStyle = computedStyle.getPropertyValue(`--forcasted-color`);
            let goalStyle = computedStyle.getPropertyValue(`--goal-ring-color`);

            let antialiasScale = 3;

            let canvasWidth = this.canvas.width * antialiasScale;
            let canvasHeight = this.canvas.height * antialiasScale;
            let centerX = canvasWidth * .5;
            let centerY = canvasHeight * .5;
            let ringThickness = (parseInt(computedStyle.getPropertyValue(`--goal-ring-thickness`)) || 10) * (antialiasScale * 1.1);
            let ringBottom = ((parseInt(computedStyle.getPropertyValue(`--goal-ring-height`)) || 75) - ringThickness) * (antialiasScale * 1.5);

            let ringPrecision = .25;

            let totalEndAngle = 0;
            let forcastedEndAngle = 0;
            if (total >= goal) {
                totalEndAngle = 360;
            }
            else {
                totalEndAngle = (total / goal) * 360;
                if (forcasted >= goal) {
                    forcastedEndAngle = 360;
                }
                else {
                    forcastedEndAngle = (forcasted / goal) * 360;
                }
            }

            let canvas = document.createElement('canvas');
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            let context = canvas.getContext('2d');
            context.filter = 'blur(1px)';
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            // Render Ring
            for (let angle = 360; angle > 0; angle -= ringPrecision) {
                let radians = GoalGuage.radians(angle - 90);

                let bottomX = Math.cos(radians) * ringBottom + centerX;
                let bottomY = Math.sin(radians) * ringBottom + centerY;
                let topX = Math.cos(radians) * (ringThickness + ringBottom) + centerX;
                let topY = Math.sin(radians) * (ringThickness + ringBottom) + centerY;

                context.globalCompositeOperation = 'source-over';
                context.beginPath();
                context.moveTo(bottomX, bottomY);
                context.lineWidth = 1.5;
                if (angle <= totalEndAngle) {
                    context.strokeStyle = writtenStyle;
                }
                else if (angle <= forcastedEndAngle) {
                    context.strokeStyle = forcastedStyle;
                }
                else {
                    context.strokeStyle = goalStyle || '#eee';
                }
                context.lineTo(topX, topY);
                context.stroke();
            }

            this.canvas.getContext('2d').drawImage(canvas, 0, 0, this.canvas.width, this.canvas.height);
        }
    };

    static radians(angle): number {
        return angle * Math.PI / 180;
    }
}
interface GoalGuageOptions {
    guageType?: 'guage' | 'bar';
    canvas: HTMLCanvasElement;
    goalColorStyleCallback: (percent: number) => string;
    tickEveryPercent?: number;
    tickStyle?: string;
    needles?: Needle[];

    total?: number;
    goal?: number;
}
interface Needle {
    width?: number;
    height?: number;
    style?: string;
    lineStyle: string;
    fillStyle: string;
    order?: number;                 // Stacking order
    angle?: number;                 // DEG angle of needle (guage only)
    bottom?: number;                // PX bottom of needle (bar only)
    total?: number;                 // Used to calculate a percent from the goal render() parameter
    percent?: number;               // Percent of guage swath
    text?: string;                  // Individual needle text
    textStyle?: string;
    textBottom?: number;            // How far in PX to go up(guage)/across(bar) the needle to draw the text
    textFont?: string;              // font CSS string for text
    textCenterDiameter?: number;    // circular text background size
    textBgStrokeStyle?: string;
    textBgFillStyle?: string;
}
