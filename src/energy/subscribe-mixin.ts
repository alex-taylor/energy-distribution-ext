/*
  Copied from https://github.com/home-assistant/frontend/blob/master/src/mixins/subscribe-mixin.ts
*/
import { HomeAssistant } from "custom-card-helpers";
import { UnsubscribeFunc } from "home-assistant-js-websocket";
import { PropertyValues, ReactiveElement } from "lit";
import { property } from "lit/decorators.js";


//================================================================================================================================================================================//
// noinspection JSUnusedGlobalSymbols
export interface HassSubscribeElement {
  hassSubscribe(): UnsubscribeFunc[];
}

export type Constructor<T = any> = new (...args: any[]) => T;

//================================================================================================================================================================================//

export function SubscribeMixin<T extends Constructor<ReactiveElement>>(superClass: T) {
  class SubscribeClass extends superClass {
    @property({ attribute: false }) public hass?: HomeAssistant;
    private __unsubs?: Array<UnsubscribeFunc | Promise<UnsubscribeFunc>>;

    // noinspection JSUnusedGlobalSymbols
    public connectedCallback() {
      super.connectedCallback();
      this.__checkSubscribed();
    }

    // noinspection JSUnusedGlobalSymbols
    public disconnectedCallback() {
      super.disconnectedCallback();
      this.hassUnsubscribe();
    }

    protected updated(changedProps: PropertyValues) {
      super.updated(changedProps);

      if (changedProps.has("hass")) {
        this.__checkSubscribed();
      }
    }

    public resetSubscriptions(): void {
      this.hassUnsubscribe();
      this.__checkSubscribed();
    }

    protected hassSubscribe(): Array<UnsubscribeFunc | Promise<UnsubscribeFunc>> {
      return [];
    }

    protected hassUnsubscribe() {
      if (this.__unsubs) {
        while (this.__unsubs.length) {
          const unsub = this.__unsubs.pop()!;

          if (unsub instanceof Promise) {
            unsub.then((unsubFunc) => unsubFunc());
          } else {
            unsub();
          }
        }

        this.__unsubs = undefined;
      }
    }

    private __checkSubscribed(): void {
      if (this.__unsubs !== undefined || !(this as unknown as Element).isConnected || this.hass === undefined) {
        return;
      }

      this.__unsubs = this.hassSubscribe();
    }
  }

  return SubscribeClass;
}

//================================================================================================================================================================================//
