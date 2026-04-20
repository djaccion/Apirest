import { toggleNode, activateOverdrive, deactivateOverdrive } from './state.js';
import { recalculateAndAnimate } from './kpi-engine.js';

function handleNodeClick(event) {
  const nodeId = event.currentTarget.getAttribute('data-node-id');
  const isActive = toggleNode(nodeId);

  if (isActive === true) {
    event.currentTarget.classList.add('node--active');
    event.currentTarget.classList.remove('node--inactive');
  } else {
    event.currentTarget.classList.add('node--inactive');
    event.currentTarget.classList.remove('node--active');
  }

  recalculateAndAnimate();
}

function handleOverdriveClick() {
  activateOverdrive();
  document.body.classList.add('overdrive-active');
  recalculateAndAnimate();

  setTimeout(() => {
    deactivateOverdrive();
    document.body.classList.remove('overdrive-active');
    recalculateAndAnimate();
  }, 2000);
}

export function initUIController() {
  const nodeGitlab   = document.getElementById('node-gitlab');
  const nodeCI       = document.getElementById('node-ci');
  const nodeXray     = document.getElementById('node-xray');
  const nodeDatadog  = document.getElementById('node-datadog');
  const nodeRovo     = document.getElementById('node-rovo');
  const overdriveBtn = document.getElementById('overdrive-overlay');

  if (!nodeGitlab)   throw new Error('initUIController: elemento DOM no encontrado con ID "node-gitlab"');
  if (!nodeCI)       throw new Error('initUIController: elemento DOM no encontrado con ID "node-ci"');
  if (!nodeXray)     throw new Error('initUIController: elemento DOM no encontrado con ID "node-xray"');
  if (!nodeDatadog)  throw new Error('initUIController: elemento DOM no encontrado con ID "node-datadog"');
  if (!nodeRovo)     throw new Error('initUIController: elemento DOM no encontrado con ID "node-rovo"');
  if (!overdriveBtn) throw new Error('initUIController: elemento DOM no encontrado con ID "overdrive-overlay"');

  const nodes = [nodeGitlab, nodeCI, nodeXray, nodeDatadog, nodeRovo];

  nodes.forEach((node) => {
    node.addEventListener('click', handleNodeClick);
  });

  overdriveBtn.addEventListener('click', handleOverdriveClick);
}

export function teardownUIController() {
  const nodeGitlab   = document.getElementById('node-gitlab');
  const nodeCI       = document.getElementById('node-ci');
  const nodeXray     = document.getElementById('node-xray');
  const nodeDatadog  = document.getElementById('node-datadog');
  const nodeRovo     = document.getElementById('node-rovo');
  const overdriveBtn = document.getElementById('overdrive-overlay');

  if (nodeGitlab)   nodeGitlab.removeEventListener('click', handleNodeClick);
  if (nodeCI)       nodeCI.removeEventListener('click', handleNodeClick);
  if (nodeXray)     nodeXray.removeEventListener('click', handleNodeClick);
  if (nodeDatadog)  nodeDatadog.removeEventListener('click', handleNodeClick);
  if (nodeRovo)     nodeRovo.removeEventListener('click', handleNodeClick);
  if (overdriveBtn) overdriveBtn.removeEventListener('click', handleOverdriveClick);
}