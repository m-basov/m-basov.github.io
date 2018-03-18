import { onLoad } from '../utils/on-load';

const CONTROLS_SELECTOR = '.code-snippet__controls button';

const CONTROLS_HANDLERS = {
  wrap(event) {
    let codeBlock = getCodeBlock(event.target);
    codeBlock.classList.toggle('code-snippet__code--word-wrap');
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
