import { TemplateRenderer } from '../Components-ES6/mixins/TemplateRenderer.js';
import { AutoSelector } from '../Components-ES6/AutoSelector/AutoSelector.js';
import { CollapseSelector } from '../Components-ES6/CollapseSelector/CollapseSelector.js';
import { InlineRepeat } from '../Components-ES6/InlineRepeat/InlineRepeat.js';
import { InlineToaster } from '../Components-ES6/InlineToaster/InlineToaster.js';
import { ItemDiv } from '../Components-ES6/ItemDiv/ItemDiv.js';
import { InlineAjax } from '../Components-ES6/InlineAjax/InlineAjax.js';
import { ClickDiv } from '../Components-ES6/ClickDiv/ClickDiv.js';
import { ItemTextInput } from '../Components-ES6/ItemTextInput/ItemTextInput.js';
import { ItemDateInput } from '../Components-ES6/ItemDateInput/ItemDateInput.js';
import { TrashConfirmation } from '../Components-ES6/TrashConfirmation/TrashConfirmation.js';
import { TrashSelector } from '../Components-ES6/TrashSelector/TrashSelector.js';
import { MenuSelector } from '../Components-ES6/MenuSelector/MenuSelector.js';
import { SmartSelect } from '../Components-ES6/SmartSelect/SmartSelect.js';
import { TransitionObserver } from '../Components-ES6/TransitionObserver/TransitionObserver.js';
import { WindowScreenSyncer } from '../Components-ES6/WindowScreenSyncer/WindowScreenSyncer.js';

class ServerGamesWebApp {
    sourceWindow: Window;
    sourceDocument: Document;

    pageReady(sourceWindow: Window, renderTemplateId: string = 'appTemplate') {
        this.sourceWindow = sourceWindow;
        this.sourceDocument = sourceWindow.document;

        this.registerComponents();

        TemplateRenderer.RenderTemplate(this.sourceDocument.getElementById(renderTemplateId) as HTMLTemplateElement, this.sourceDocument.body, null, this.sourceDocument);
    }

    registerComponents(sourceWindow = this.sourceWindow) {
        sourceWindow.customElements.define('smart-select', SmartSelect);
        sourceWindow.customElements.define('inline-repeat', InlineRepeat);
        sourceWindow.customElements.define('item-div', ItemDiv);
        sourceWindow.customElements.define('inline-ajax', InlineAjax);
        sourceWindow.customElements.define('click-div', ClickDiv);
        sourceWindow.customElements.define('item-text-input', ItemTextInput);
        sourceWindow.customElements.define('item-date-input', ItemDateInput);
        sourceWindow.customElements.define('collapse-selector', CollapseSelector);
        sourceWindow.customElements.define('auto-selector', AutoSelector);
        sourceWindow.customElements.define('trash-selector', TrashSelector);
        sourceWindow.customElements.define('trash-confirmation', TrashConfirmation);
        sourceWindow.customElements.define('menu-selector', MenuSelector);
        sourceWindow.customElements.define('inline-toaster', InlineToaster);
        sourceWindow.customElements.define('transition-observer', TransitionObserver);
        sourceWindow.customElements.define('window-screen-syncer', WindowScreenSyncer);
    }
}

(<any>window).app = new ServerGamesWebApp();