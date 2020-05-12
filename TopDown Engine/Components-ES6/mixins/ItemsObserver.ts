import { IItemsObserver } from "./IItemsObserver";

import { IProxy } from "./IProxy";

import { IProxyHandler } from "./IProxyHandler";

export class ItemsObserver {
    static _observers: IItemsObserver[];
    static _disableProxyHandler = false;

    static addObserver(self: IItemsObserver) {
        if (!ItemsObserver._observers) {
            ItemsObserver._observers = [];
        }
        for (let observer of ItemsObserver._observers) {
            if (self === observer) {
                return;
            }
        }
        ItemsObserver._observers.push(self);
    }

    static removeObserver(self: IItemsObserver) {
        for (let observerIndex = 0; observerIndex < ItemsObserver._observers.length; observerIndex++) {
            if (self === ItemsObserver._observers[observerIndex]) {
                ItemsObserver._observers.splice(observerIndex, 1);
            }
        }
    }

    static addReference(referencedName, addReferenceTo: IProxy<any>) {
        if (!addReferenceTo.__referencedToNames) {
            addReferenceTo.__referencedToNames = [referencedName];
        }
        else if ((() => {
            for (let eachRefencedName of addReferenceTo.__referencedToNames) {
                if (eachRefencedName === referencedName) {
                    return false;
                }
            }
            return true;
        })()) {
            addReferenceTo.__referencedToNames[addReferenceTo.__referencedToNames.length] = referencedName;
        }
    }

    static removeReference(referencedName, removeRefrenceFrom: IProxy<any>) {
        // This value is being removed could be a reference to another proxy
        // Ensure removing this reference from that proxy (since it still remains to be observed by others)
        removeRefrenceFrom.__referencedToNames = removeRefrenceFrom.__referencedToNames.filter((eachName) => {
            return eachName !== referencedName;
        });
    }

    /** Proxies the parent of qualifiedName and/or ensures all relevant observers are notified */
    static observe(qualifiedName: string) {
        let ptr = ItemsObserver.getParentTargetReference(qualifiedName);

        ItemsObserver._disableProxyHandler = true;
        // To get to target we need to proxy parent first
        if (ptr.parent) {
            if (ptr.target && !ptr.target.__proxyValue && Array.isArray(ptr.target)) {
                // We'll need to proxy the array for changes also
                let observed = new Proxy(ptr.grand[ptr.parentName][ptr.targetName], ItemsObserver.objectProxyHandler);
                observed.__proxyValue = ptr.grand[ptr.parentName][ptr.targetName];
                observed.__proxyName = ptr.parentQualified + `.${ptr.targetName}`;
                ptr.grand[ptr.parentName][ptr.targetName] = observed;
            }
            if (!ptr.parent.__proxyValue) {
                let observed = new Proxy(ptr.grand[ptr.parentName], ItemsObserver.objectProxyHandler);
                observed.__proxyValue = ptr.grand[ptr.parentName];
                observed.__proxyName = ptr.parentQualified;
                ptr.grand[ptr.parentName] = observed;
            }
        }
        ItemsObserver._disableProxyHandler = false;
    }

    static objectProxyHandler: IProxyHandler = {
        set: (parent: IProxy<any>, property: string, value: any) => {
            if (ItemsObserver._disableProxyHandler) {
                parent[property] = value;
                return true;
            }
            let parentDependantsKeys = ItemsObserver.getDependantObserverKeys(parent.__proxyName);
            if (parentDependantsKeys) {
                let thisProxyName = `${parent.__proxyName}.${property}`;
                let parentHasDependant = false;
                for (let eachParentDependantKey of Object.keys(parentDependantsKeys)) {
                    let eachParentDependantPtr = ItemsObserver.getParentTargetReference(eachParentDependantKey);
                    if (eachParentDependantPtr.targetName === property) {
                        parentHasDependant = true;
                        break;
                    }
                }

                if (parentHasDependant) {
                    let dependantKeys = ItemsObserver.getDependantObserverKeys(thisProxyName);
                    let dependantKeysArray = Object.keys(dependantKeys);
                    if (value && (typeof value === 'object') && dependantKeys && (Array.isArray(value) || dependantKeysArray.length > 1)) {
                        // Any values with dependants will require their parents (this current value) to be proxied
                        if (!value.__proxyValue) {
                            // Create original proxy of value
                            let itemProxy = new Proxy(value, ItemsObserver.objectProxyHandler);
                            // Save the value
                            itemProxy.__proxyValue = value;
                            // Retain property name
                            itemProxy.__proxyName = thisProxyName;
                            // Overwrite with proxy to use it
                            value = parent[property] = itemProxy;
                        }
                        else {
                            if (thisProxyName !== value.__proxyName) {
                                // Already proxied, so lets register this observation target on it
                                ItemsObserver.addReference(thisProxyName, value);
                            }
                            parent[property] = value;
                        }
                    }
                    else {
                        value = parent[property] = value;
                    }

                    if (dependantKeys) {
                        // We must notify dependant observers of the changes to this value
                        for (let eachDependantKey of dependantKeysArray) {
                            let dependandPtr = ItemsObserver.getParentTargetReference(eachDependantKey);
                            ItemsObserver.updateObservers(eachDependantKey, dependandPtr.parent, dependandPtr.targetName, dependandPtr.target);
                        }
                    }
                }
                else {
                    value = parent[property] = value;
                }

                // Check to see if this value is being removed from a referenced proxy
                if (!value && parent[property] && thisProxyName !== parent[property].__proxyName && parent[property].__referencedToNames) {
                    ItemsObserver.removeReference(thisProxyName, parent[property]);
                }

                // // Update those who are observing an array for changes to its index
                if (Array.isArray(parent) && parseInt(property) !== NaN) {
                    // value is the value of a numeric index to this array
                    ItemsObserver.updateObservers(parent.__proxyName, parent, property, value);
                }

            }
            else {
                parent[property] = value;
            }
            return true;
        }
    };

    static updateObservers(thisProxyName: string, parent: IProxy<any>, property: string, value: any, updatedCallback?: (updatedObserver: IItemsObserver) => void) {
        if (!thisProxyName) {
            return;
        }
        let matched = false;
        for (let eachObserver of ItemsObserver._observers) {
            for (let eachObservedTargetKey of eachObserver.observedTargetKeys) {
                matched = ItemsObserver.keysMatch(thisProxyName, eachObservedTargetKey);
                if (matched) {
                    break;
                }
            }
            if (!matched) {
                if (value && (typeof value === 'object') && value.__referencedToNames) {
                    for (let eachReferenceProxyName of value.__referencedToNames) {
                        for (let eachObservedTargetKey of eachObserver.observedTargetKeys) {
                            // Check to see if the value refers to eachObserver
                            matched = ItemsObserver.keysMatch(eachReferenceProxyName, eachObservedTargetKey);
                            if (matched) {
                                break;
                            }
                        }
                        if (matched) {
                            break;
                        }
                    }
                }
                if (!matched && parent && (typeof parent === 'object') && parent.__referencedToNames && !value) {
                    for (let eachParentReferenceProxyName of parent.__referencedToNames) {
                        for (let eachObservedTargetKey of eachObserver.observedTargetKeys) {
                            matched = ItemsObserver.keysMatch(`${eachParentReferenceProxyName}.${property}`, eachObservedTargetKey);
                            if (matched) {
                                break;
                            }
                        }
                        if (matched) {
                            break;
                        }
                    }
                }
            }
            if (matched) {
                if (updatedCallback) {
                    updatedCallback(eachObserver);
                }
                // Add a console.log here to monitor whose getting updated
                eachObserver.update(parent, property, parent ? parent[property] : value);
            }
        }
    }

    static keysMatch(key1: string, key2: string) {
        return ItemsObserver.returnQualifiedByPeriod(key1 || '-') === ItemsObserver.returnQualifiedByPeriod(key2 || '!');
    }

    static getDependantObserverKeys(thisProxyName: string) {
        if (!thisProxyName) {
            return;
        }
        let uniqueKeys;
        let thisProxyPtr = ItemsObserver.getParentTargetReference(thisProxyName);
        let allReferences = [thisProxyName];
        if (thisProxyPtr.target && Array.isArray(thisProxyPtr.target.__referencedToNames)) {
            allReferences = allReferences.concat(thisProxyPtr.target.__referencedToNames);
        }
        else if (thisProxyPtr.parent && Array.isArray(thisProxyPtr.parent.__referencedToNames)) {
            for (let eachReferencedToName of thisProxyPtr.parent.__referencedToNames) {
                allReferences.push(`${eachReferencedToName}.${thisProxyPtr.targetName}`);
            }
        }
        for (let eachObserver of ItemsObserver._observers) {
            for (let eachObservedTargetKey of eachObserver.observedTargetKeys) {
                for (let eachProxyName of allReferences) {
                    if (eachObservedTargetKey.indexOf(`${eachProxyName}.`) === 0 || eachObservedTargetKey === eachProxyName) {
                        if (!uniqueKeys) {
                            uniqueKeys = {};
                        }
                        uniqueKeys[eachObservedTargetKey] = true;
                    }
                }
            }
        }
        return uniqueKeys;
    }

    static getParentTargetReference(itemsKey: string, initialTarget = window): { grand: any, parent: any, parentName: string, parentQualified: string, target: any, targetName: string } {
        let grand, parent, target = initialTarget, targetPropertyName: string, parentPropertyName: string;
        let qualifiedByPeriod = ItemsObserver.returnQualifiedByPeriod(itemsKey);
        qualifiedByPeriod.split('.').forEach((eachKey) => {
            if (!target) {
                if (!parent) {
                    debugger;
                }
                return;
            }
            grand = parent;
            parent = target;
            parentPropertyName = targetPropertyName;
            target = target[eachKey];
            targetPropertyName = eachKey;
        });
        return {
            grand: grand,
            parent: parent,
            parentName: parentPropertyName,
            parentQualified: qualifiedByPeriod.substr(0, qualifiedByPeriod.lastIndexOf('.')),
            target: target,
            targetName: targetPropertyName
        };
    }

    static returnQualifiedByPeriod(itemskey: string): string {
        return (itemskey.split('[').join('.')).split(']').join('');
    }

    static getKeyProperty(itemsKey: string): string {
        return ItemsObserver.getParentTargetReference(itemsKey).targetName;
    }

    static deepCopy<T>(toCopy: T | IProxy<any>): T {
        if (!toCopy) {
            return;
        }
        let toCopyObject: any = <IProxy<any>>(toCopy as any).__proxyValue || toCopy;

        if (Array.isArray(toCopyObject)) {
            let copied: T = [] as any;
            for (let index = 0; index < toCopyObject.length; index++) {
                copied[index] = this.deepCopy(toCopyObject[index]);
            }
            return copied as any;
        }
        if (typeof toCopyObject === 'object') {
            let copied: T = {} as any;
            for (let property of Object.keys(toCopyObject)) {
                if (toCopyObject[property] && property.indexOf('__') === -1) {
                    copied[property] = this.deepCopy(toCopyObject[property]);
                }
            }
            return copied;
        }
        if (typeof toCopyObject === 'function') {
            return null;
        }
        return toCopyObject;
    }

    static connectedCallback() {
        let self: IItemsObserver & HTMLElement = <any>this;
        if (!self.observedTargetKeys || !Array.isArray(self.observedTargetKeys)) {
            self.observedTargetKeys = [];
        }
        ItemsObserver.addObserver(self);
        let itemAttributeName = self.collectionAttribute || (self.hasAttribute('items') ? 'items' : self.hasAttribute('item') ? 'item' : null);
        if (itemAttributeName && self.hasAttribute(itemAttributeName)) {
            self.literalTargetKey = `${self.getAttribute(itemAttributeName).valueOf()}`;
            self.defaultTargetKey = self.observedTargetKey = ItemsObserver.returnQualifiedByPeriod(self.literalTargetKey);
            if (self.semanticTargetKey) {
                self.observedTargetKey = `${self.observedTargetKey}.${self.semanticTargetKey}`;
            }
            self.defaultTargetProperty = ItemsObserver.getKeyProperty(self.defaultTargetKey);
            self.addObservedKey(self.observedTargetKey);
        }
    }

    static disconnectedCallback() {
        let self: IItemsObserver & HTMLElement = <any>this;
        ItemsObserver.removeObserver(self);
    }

    static extends = (superclass) => class extends superclass implements IItemsObserver {
        itemsProxies: any[];
        observedTargetKey?: string;
        observedTargetKeys: string[];

        /** Adds target to observers, Returns extracted target key's object property for reference  */
        addObservedKey(observedTargetKey: string, observe = true): string {
            for (let eachObservedTargetKey of this.observedTargetKeys) {
                if (ItemsObserver.keysMatch(observedTargetKey, eachObservedTargetKey)) {
                    return;
                }
            }
            this.observedTargetKeys.push(observedTargetKey);
            ItemsObserver.observe(observedTargetKey);
            let parentTargetReference = ItemsObserver.getParentTargetReference(observedTargetKey);
            if (observe) {
                this.observe(observedTargetKey, parentTargetReference);
            }
            return parentTargetReference.targetName;
        }

        observe(observedTargetKey?: string, parentTargetReference?) {
            for (let eachObservedTargetKey of observedTargetKey ? [ observedTargetKey ] : this.observedTargetKeys) {
                parentTargetReference = parentTargetReference || ItemsObserver.getParentTargetReference(eachObservedTargetKey);
                ItemsObserver.updateObservers(eachObservedTargetKey, parentTargetReference.parent, parentTargetReference.targetName, parentTargetReference.target);
            }
        }

        update(updated: {}, key: string, value: any) {
        }
    }
}
