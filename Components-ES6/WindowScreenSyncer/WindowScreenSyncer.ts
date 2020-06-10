import { IWindowScreenSyncer } from "./IWindowScreenSyncer";

export class WindowScreenSyncer extends HTMLElement implements IWindowScreenSyncer {

    public isMobile: boolean;
    scaleTarget: HTMLElement;

    constructor () {
        super();
    }

    connectedCallback() {
        this.scaleTarget = this.hasAttribute('scale-target') ? document.getElementById(this.getAttribute('scale-target').valueOf()) : document.body;

        if (window.navigator.userAgent.match(/Mobile/i)
            || window.navigator.userAgent.match(/iPhone/i)
            || window.navigator.userAgent.match(/iPod/i)
            || window.navigator.userAgent.match(/IEMobile/i)
            || window.navigator.userAgent.match(/Windows Phone/i)
            || window.navigator.userAgent.match(/Android/i)
            || window.navigator.userAgent.match(/BlackBerry/i)
            || window.navigator.userAgent.match(/webOS/i)
            || this.hasAttribute('force-mobile')
        ) {
            this.isMobile = true;

            this.setAttribute('mobile', '');
            (new Function(`${this.getAttribute('mobile-status').valueOf()} = true;`))();

            if (this.hasAttribute('mobile-width')) {
                // Force screen width to attribute specified sizes
                window.resizeTo(parseInt(this.getAttribute('mobile-width').valueOf()), screen.availHeight);
                return;
            }
            if (this.hasAttribute('scale-device')) {
                let pixelRatio = parseFloat(this.getAttribute('scale-device').valueOf()) || window.devicePixelRatio;
                let overallIncreasePercentage = (pixelRatio - 1) * 100;
                let translationPercent = overallIncreasePercentage / 2;
                this.scaleTarget.style.transform = `translate(${translationPercent}%, ${translationPercent}%) scale(${pixelRatio})`;
                let visiblePercentage = 100 - (overallIncreasePercentage / pixelRatio);
                this.scaleTarget.style.width = `${visiblePercentage}%`;
            }
            return;
        }

        if (window.outerWidth > screen.availWidth) {
            window.resizeTo(screen.availWidth, screen.availHeight);
        }

        if (this.hasAttribute('mobile-status')) {
            (new Function(`${this.getAttribute('mobile-status').valueOf()} = false;`))();
        }
    }
}