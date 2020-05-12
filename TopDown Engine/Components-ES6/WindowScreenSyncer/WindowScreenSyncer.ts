import { IWindowScreenSyncer } from "./IWindowScreenSyncer";

export class WindowScreenSyncer extends HTMLElement {

    public isMobile: boolean;
    scaleTarget: HTMLElement;

    constructor () {
        super();
    }

    connectedCallback() {
        let self = this as IWindowScreenSyncer;

        self.scaleTarget = self.hasAttribute('scale-target') ? document.getElementById(self.getAttribute('scale-target').valueOf()) : document.body;

        if (window.navigator.userAgent.match(/Mobile/i)
            || window.navigator.userAgent.match(/iPhone/i)
            || window.navigator.userAgent.match(/iPod/i)
            || window.navigator.userAgent.match(/IEMobile/i)
            || window.navigator.userAgent.match(/Windows Phone/i)
            || window.navigator.userAgent.match(/Android/i)
            || window.navigator.userAgent.match(/BlackBerry/i)
            || window.navigator.userAgent.match(/webOS/i)
            || self.hasAttribute('force-mobile')
        ) {
            self.isMobile = true;

            self.setAttribute('mobile', '');
            (new Function(`${self.getAttribute('mobile-status').valueOf()} = true;`))();

            if (self.hasAttribute('mobile-width')) {
                // Force screen width to attribute specified sizes
                window.resizeTo(parseInt(self.getAttribute('mobile-width').valueOf()), screen.availHeight);
                return;
            }
            if (self.hasAttribute('scale-device')) {
                let pixelRatio = parseFloat(self.getAttribute('scale-device').valueOf()) || window.devicePixelRatio;
                let overallIncreasePercentage = (pixelRatio - 1) * 100;
                let translationPercent = overallIncreasePercentage / 2;
                self.scaleTarget.style.transform = `translate(${translationPercent}%, ${translationPercent}%) scale(${pixelRatio})`;
                let visiblePercentage = 100 - (overallIncreasePercentage / pixelRatio);
                self.scaleTarget.style.width = `${visiblePercentage}%`;
            }
            return;
        }

        if (window.outerWidth > screen.availWidth) {
            window.resizeTo(screen.availWidth, screen.availHeight);
        }

        if (self.hasAttribute('mobile-status')) {
            (new Function(`${self.getAttribute('mobile-status').valueOf()} = false;`))();
        }
    }
}