let onLoadCache = {
  done: false,
  fns: []
};

window.onload = function() {
  onLoadCache.fns.forEach(fn => setTimeout(fn, 0));
  onLoadCache.done = true;
};

export function onLoad(fn) {
  if (onLoadCache.done) return fn();
  onLoadCache.fns.push(fn);
}
