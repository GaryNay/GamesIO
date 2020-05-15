import { ItemsObserver } from "../Mixins/ItemsObserver";
import { IProgressCanvas } from "./IProgressCanvas";

export class ProgressCanvas extends ItemsObserver.extends(HTMLElement) {

    constructor() {
        super();
    }

    set label(value: string) {
        let self: IProgressCanvas = <any>this;
        if (!self.labelElement || !self.labelElement.isConnected) {
            self.labelElement = self.labelElement || self.sourceDocument.createElement('span');
            if (self.containerSpan && self.canvas) {
                self.containerSpan.insertBefore(self.labelElement, self.canvas);
            }
        }
        self.labelValue = value;
        self.labelElement.innerText = `${value}`;

    }
    get label(): string {
        return this.labelValue;
    }

    connectedCallback() {
        let self: IProgressCanvas = <any>this;

        self.sourceDocument = self.sourceDocument || document;
        self.containerSpan = self.sourceDocument.createElement('span');
        self.appendChild(self.containerSpan);
        self.canvas = self.sourceDocument.createElement('canvas');
        self.containerSpan.appendChild(self.canvas);

        if (self.hasAttribute('on-click')) {
            let onclickAttribute = self.getAttribute('on-click').valueOf();
            let passThisValue = self.hasAttribute('pass-on-click') ? self.getAttribute('pass-on-click').valueOf() : null;
            self.clicked = () => {
                let clickPTR = ItemsObserver.getParentTargetReference(onclickAttribute);
                if (typeof clickPTR.target === 'function') {
                    let itemPTR = ItemsObserver.getParentTargetReference(self.defaultTargetKey);
                    clickPTR.target.apply(clickPTR.parent, [ passThisValue || itemPTR.target ]);
                }
            };
            self.containerSpan.addEventListener('click', (e) => {
                self.clicked();
            });
        }

        if (self.hasAttribute('label-value')) {
            self.label = self.getAttribute('label-value').valueOf();
        }

        self.resolution = 100;
        if (self.hasAttribute('resolution')) {
            self.resolution = parseInt(self.getAttribute('resolution').valueOf()) || 100;
        }

        if (self.hasAttribute('guage-ticks')) {
            self.guageTicks = parseInt(self.getAttribute('guage-ticks').valueOf()) || 10;
        }

        self.collectionAttribute = 'guage-value';
        ItemsObserver.connectedCallback.apply(self);

        self.guageMax = self.guageValue > 100 ? self.guageValue : 100;
        if (self.hasAttribute('guage-max')) {
            let guageMaxAttribute = self.getAttribute('guage-max').valueOf();
            if (parseInt(guageMaxAttribute) > 0) {
                self.guageMax = parseInt(guageMaxAttribute) || 100;
            }
            else {
                self.guageMaxProperty = self.addObservedKey(guageMaxAttribute);
            }
        }
        if (self.hasAttribute('label-property')) {
            self.labelProperty = self.addObservedKey(self.getAttribute('label-property').valueOf());
        }

    }

    disconnectedCallback() {
        let self: IProgressCanvas = <any>this;
        ItemsObserver.disconnectedCallback.apply(self);
    }

    oncompleted(callbackFn?: (self?: IProgressCanvas) => void): Promise<void> {
        let self: IProgressCanvas = <any>this;
        if (callbackFn) {
            self.completedCallback = callbackFn;
        }
        return new Promise((resolve, reject) => {
            self.resolveCompleted = () => {
                return resolve();
            };
        });
    }


    update(updated?: any, key?: string | number, value?: any) {
        let self: IProgressCanvas = <any>this;
        if (self.containerSpan) {
            if (key === self.labelProperty) {
                self.label = `${value}`;
            }
            if (key === self.defaultTargetProperty) {
                self.guageValue = parseInt(value) || 0;
                self.readjust();
            }
            if (key === self.guageMaxProperty) {
                self.guageMax = parseInt(value) || 100;
                self.readjust();
            }
        }
    }

    readjust() {
        let self: IProgressCanvas = <any>this;

        let w = self.canvas.width;
        let h = self.canvas.height;
        let toPercent = self.guageValue / self.guageMax;
        let resolution = self.resolution / 100;
        let modPercent = ((toPercent % (resolution + .001)) / resolution);
        if (!self.context) {
            self.context = self.canvas.getContext('2d');
        }
        let ctx = self.context;
        // Adjust guage to percent
        let guageX = modPercent * w;
        ctx.fillStyle = self.containerSpan.style.color || '#00f000';
        ctx.fillRect(0, 0, guageX, h);
        ctx.fillStyle = self.containerSpan.style.backgroundColor || '#a0a0a0';
        ctx.fillRect(guageX, 0, w - guageX, h);
        ctx.fillStyle = self.containerSpan.style.borderColor || '#1010a0';
        for (let tick = Math.floor(modPercent * self.guageTicks); tick <= self.guageTicks; tick += 1) {
            let tickX = (tick / self.guageTicks) * w;
            ctx.fillRect(tickX, 0, 1, h);
        }

        if (toPercent >= 100) {
            // Completed
            self.completed();
        }
    }
    completed() {
        let self: IProgressCanvas = <any>this;
        if (self.completedCallback) {
            self.completedCallback(self);
        }
        if (self.resolveCompleted) {
            self.resolveCompleted();
        }
        self.complete = true;
    }
}
