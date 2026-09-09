// Delegation survives console renders; native picker remains keyboard accessible.
export function bindFileDrop(root, {select, reject, blocked = () => false}) {
  const zone = event => event.target?.closest?.('[data-file-drop]');
  const isFile = event => Array.from(event.dataTransfer?.types || []).includes('Files');
  const clear = () => root.querySelectorAll('[data-file-drop]').forEach(el => el.classList.remove('is-dragging'));
  root.addEventListener('dragover', event => {
    if (!isFile(event)) return;
    event.preventDefault();
    const target = zone(event);
    event.dataTransfer.dropEffect = target && !blocked() ? 'copy' : 'none';
    clear();
    if (target && !blocked()) target.classList.add('is-dragging');
  });
  root.addEventListener('dragleave', event => {
    const target = zone(event);
    if (target && !target.contains(event.relatedTarget)) target.classList.remove('is-dragging');
  });
  root.addEventListener('drop', event => {
    if (!isFile(event)) return;
    event.preventDefault();
    clear();
    if (!zone(event) || blocked()) return;
    const transfer = event.dataTransfer;
    const directory = Array.from(transfer.items || []).some(item => item.webkitGetAsEntry?.()?.isDirectory);
    if (directory || transfer.files.length !== 1) {
      reject('Drop one file at a time, not a folder.');
      return;
    }
    select(transfer.files[0]);
  });
  root.addEventListener('dragend', clear);
}
