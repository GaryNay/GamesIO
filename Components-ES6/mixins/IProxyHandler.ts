export interface IProxyHandler {
    ['set']?: (target, property, value) => boolean;
}
