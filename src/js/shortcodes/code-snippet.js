import { onLoad } from '../utils/on-load';

const CONTROLS_SELECTOR = '.code-snippet__controls button';

const CONTROLS_HANDLERS = {
  wrap(event) {
    let btn = event.target;
    let codeBlock = getCodeBlock(btn);
    let state = btn.getAttribute('data-word-wrap') === 'false' ? false : true;
    state = !state;
    console.log('state', state);
    btn.setAttribute('data-word-wrap', state);
    console.log(codeBlock);
  }
};

function getHandler(ctrl) {
  let handler = ctrl.getAttribute('data-control');
  return CONTROLS_HANDLERS[handler];
}

function getCodeBlock(ctrl) {
  return ctrl.parentElement.parentElement.querySelector('.code-snippet__code');
}

onLoad(function() {
  let controls = document.querySelectorAll(CONTROLS_SELECTOR);
  controls.forEach(ctrl => ctrl.addEventListener('click', getHandler(ctrl), null));
});
