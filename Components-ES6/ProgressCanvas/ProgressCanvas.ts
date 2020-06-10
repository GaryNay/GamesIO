import { ItemsObserver } from "../mixins/ItemsObserver.js";
import { IProgressCanvas } from "./IProgressCanvas";

export class ProgressCanvas extends ItemsObserver.extends(HTMLElement) implements IProgressCanvas {
    sourceDocument: HTMLDocument;

    containerSpan: HTMLSpanElement;
    labelElement?: HTMLSpanElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    labelValue: string;
    labelProperty?: string;
    guageMaxProperty?: string;
    guageMax: number;
    guageValue: number;
    guageTicks: number;
    resolution: number;

    complete: boolean;
    clicked?: () => void;
    completedCallback?: (self?: ProgressCanvas) => any;
    resolveCompleted?: () => void;

    constructor() {
        super();
    }

    set label(value: string) {
        if (!this.labelElement || !this.labelElement.isConnected) {
            this.labelElement = this.labelElement || this.sourceDocument.createElement('span');
            if (this.containerSpan && this.canvas) {
                this.containerSpan.insertBefore(this.labelElement, this.canvas);
            }
        }
        this.labelValue = value;
        this.labelElement.innerText = `${value}`;

    }
    get label(): string {
        return (<IProgressCanvas & this>this).labelValue;
    }

    connectedCallback() {
        this.sourceDocument = this.sourceDocument || document;
        this.containerSpan = this.sourceDocument.createElement('span');
        this.appendChild(this.containerSpan);
        this.canvas = this.sourceDocument.createElement('canvas');
        this.containerSpan.appendChild(this.canvas);

        if (this.hasAttribute('on-click')) {
            let onclickAttribute = this.getAttribute('on-click').valueOf();
            let passThisValue = this.hasAttribute('pass-on-click') ? this.getAttribute('pass-on-click').valueOf() : null;
            this.clicked = () => {
                let clickPTR = ItemsObserver.GetParentTargetReference(onclickAttribute);
                if (typeof clickPTR.target === 'function') {
                    let itemPTR = ItemsObserver.GetParentTargetReference(this.defaultTargetKey);
                    clickPTR.target.apply(clickPTR.parent, [ passThisValue || itemPTR.target ]);
                }
            };
            this.containerSpan.addEventListener('click', (e) => {
                this.clicked();
            });
        }

        if (this.hasAttribute('label-value')) {
            this.label = this.getAttribute('label-value').valueOf();
        }

        this.resolution = 100;
        if (this.hasAttribute('resolution')) {
            this.resolution = parseInt(this.getAttribute('resolution').valueOf()) || 100;
        }

        if (this.hasAttribute('guage-ticks')) {
            this.guageTicks = parseInt(this.getAttribute('guage-ticks').valueOf()) || 10;
        }

        this.collectionAttribute = 'guage-value';

        super.connectedCallback();

        this.guageMax = this.guageValue > 100 ? this.guageValue : 100;
        if (this.hasAttribute('guage-max')) {
            let guageMaxAttribute = this.getAttribute('guage-max').valueOf();
            if (parseInt(guageMaxAttribute) > 0) {
                this.guageMax = parseInt(guageMaxAttribute) || 100;
            }
            else {
                this.guageMaxProperty = this.addObservedKey(guageMaxAttribute);
            }
        }
        if (this.hasAttribute('label-property')) {
            this.labelProperty = this.addObservedKey(this.getAttribute('label-property').valueOf());
        }

    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    oncompleted(callbackFn?: (self?: ProgressCanvas) => void): Promise<void> {
        if (callbackFn) {
            this.completedCallback = callbackFn;
        }
        return new Promise((resolve, reject) => {
            this.resolveCompleted = () => {
                return resolve();
            };
        });
    }


    update(updated?: any, key?: string | number, value?: any) {
        if (this.containerSpan) {
            if (key === this.labelProperty) {
                this.label = `${value}`;
            }
            if (key === this.defaultTargetProperty) {
                this.guageValue = parseInt(value) || 0;
                this.readjust();
            }
            if (key === this.guageMaxProperty) {
                this.guageMax = parseInt(value) || 100;
                this.readjust();
            }
        }
    }

    readjust() {
        let w = this.canvas.width;
        let h = this.canvas.height;
        let toPercent = this.guageValue / this.guageMax;
        let resolution = this.resolution / 100;
        let modPercent = ((toPercent % (resolution + .001)) / resolution);
        if (!this.context) {
            this.context = this.canvas.getContext('2d');
        }
        let ctx = this.context;
        // Adjust guage to percent
        let guageX = modPercent * w;
        ctx.fillStyle = this.containerSpan.style.color || '#00f000';
        ctx.fillRect(0, 0, guageX, h);
        ctx.fillStyle = this.containerSpan.style.backgroundColor || '#a0a0a0';
        ctx.fillRect(guageX, 0, w - guageX, h);
        ctx.fillStyle = this.containerSpan.style.borderColor || '#1010a0';
        for (let tick = Math.floor(modPercent * this.guageTicks); tick <= this.guageTicks; tick += 1) {
            let tickX = (tick / this.guageTicks) * w;
            ctx.fillRect(tickX, 0, 1, h);
        }

        if (toPercent >= 100) {
            // Completed
            this.completed();
        }
    }
    completed() {
        if (this.completedCallback) {
            this.completedCallback(this);
        }
        if (this.resolveCompleted) {
            this.resolveCompleted();
        }
        this.complete = true;
    }
}
