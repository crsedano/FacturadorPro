import mitt from 'mitt'

const emitter = mitt()

const eventHub = {
    $emit: (event, ...args) => emitter.emit(event, ...args),
    $on:   (event, fn)      => emitter.on(event, fn),
    $off:  (event, fn)      => emitter.off(event, fn),
    $once: (event, fn) => {
        const wrapper = (...args) => { fn(...args); emitter.off(event, wrapper) }
        emitter.on(event, wrapper)
    },
    emit: (event, ...args) => emitter.emit(event, ...args),
    on:   (event, fn)      => emitter.on(event, fn),
    off:  (event, fn)      => emitter.off(event, fn),
}

export default eventHub
