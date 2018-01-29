
import {
    reRender
} from './MayDom'

//mayQueue 保存render过程中的各种事件队列 
export var mayQueue = {
    dirtyComponentsQueue: [], //setState 需要diff的component队列
    callbackQueue: [], //回调队列 setState 中的事件回调
    lifeCycleQueue: [], //生命周期过程中的回调队列 DidUpdate DidMount ref回调
    isInEvent: false, //是否在触发事件 回调事件中的setstate合并触发
    clearQueue: clearQueue,
    flushUpdates: flushUpdates,
}
/**
 * 清空回调队列
 * @param {*} mayQueue 
 */
function clearQueue() {
    //ComponentDidMount
    clearLifeCycleQueue();
    //如有有dirty Component diff
    flushUpdates();
    //setState传入的回调函数
    clearCallbackQueue();
}

function flushUpdates() {
    var c;
    //如果在当前生命周期的DidMount调用setState 放到下一生命周期处理
    mayQueue.dirtyComponentsQueue = mayQueue.dirtyComponentsQueue.sort(sortComponent);
    while (c = mayQueue.dirtyComponentsQueue.shift()) {
        reRender(c);
        if (c) {
            c._lifeState = 'reRenderComplete';
        }
    }
    //ComponentDidUpdate
    clearLifeCycleQueue();
}

function clearLifeCycleQueue() {
    //先清空 生命周期 ref 的回调函数
    if (mayQueue.lifeCycleQueue && mayQueue.lifeCycleQueue.length > 0) {
        var lifeCallback;
        // mayQueue.lifeCycleQueue = mayQueue.lifeCycleQueue.sort(sortComponent);
        while (lifeCallback = mayQueue.lifeCycleQueue.shift()) {
            lifeCallback();
        }
    }
}

function clearCallbackQueue() {
    //再清空 setState传入的回调函数
    if (mayQueue.callbackQueue && mayQueue.callbackQueue.length > 0) {
        var callback;
        mayQueue.callbackQueue = mayQueue.callbackQueue.sort(sortComponent);
        while (callback = mayQueue.callbackQueue.shift()) {
            callback();
        }
    }
}

function sortComponent(a, b) {
    return a._mountOrder - b._mountOrder;
}

export function mergeState(instance) {
    var newState;
    var prevState = instance.state;
    if (instance._mergeStateQueue && instance._mergeStateQueue.length > 0) {
        var queue = instance._mergeStateQueue;
        var newState = extend({}, prevState);
        for (var i = 0; i < queue.length; i++) {
            var s = queue[i];
            if (s && s.call) {
                s = s.call(instance, newState, instance.props);
            }
            newState = extend(newState, s);
        }
        instance._mergeStateQueue.length = 0;
    } else {
        newState = prevState;
    }
    return newState;
}


// export function eventProxy(e) {
//     return this._listener[e.type](e);
// }
export function extend(target, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            target[key] = src[key];
        }
    }
    return target;
}
/**
 * 寄生组合式继承
 * @param {*} target 
 * @param {*} superClass 
 */
export function inherits(target, superClass) {
    function b() { };
    b.prototype = superClass.prototype;
    var fn = target.prototype = new b();
    fn.constructor = target;
    return fn;
}
