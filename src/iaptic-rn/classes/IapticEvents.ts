import { IapticEventType, IapticEventMap, IapticEventListener } from '../types';
import { logger } from './IapticLogger';

export type IapticRegisteredEventListener = {
  type: IapticEventType;
  callback: Function;
  remove: () => void;
};

export class IapticEvents {

  private eventListeners: IapticRegisteredEventListener[] = [];

  /**
   * Add an event listener
   */
  addEventListener<T extends IapticEventType>(
    eventType: T,
    listener: IapticEventListener<T>
  ): IapticRegisteredEventListener {
    const _that = this;
    const wrapper = {
      type: eventType,
      callback: listener,
      remove: () => _that.removeEventListener(eventType, listener)
    };
    this.eventListeners.push(wrapper);
    return wrapper;
  }

  /**
   * Remove an event listener
   */
  removeEventListener<T extends IapticEventType>(
    eventType: T,
    listener: IapticEventListener<T>
  ): void {
    this.eventListeners = this.eventListeners.filter(wrapper => wrapper.type !== eventType || wrapper.callback !== listener);
  }

  /**
   * Remove all event listeners for a specific event type
   * If no event type is specified, removes all listeners for all events
   */
  removeAllEventListeners(eventType?: IapticEventType): void {
    if (eventType) {
      this.eventListeners = this.eventListeners.filter(wrapper => wrapper.type !== eventType);
    } else {
      this.eventListeners = [];
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  public emit<T extends IapticEventType>(
    eventType: T,
    ...args: IapticEventMap[T]
  ): void {
    // setTimeout is used to ensure that the event listeners are called after the event has been fully processed
    setTimeout(() => {
      this.eventListeners.forEach(wrapper => {
        try {
          wrapper.callback(eventType, ...args);
      } catch (error) {
          logger.error(`Error in ${eventType} listener: ${error}`);
        }
      });
    }, 0);
  }
} 
