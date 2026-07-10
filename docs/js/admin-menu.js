import { getMenu, setConfigOverrides } from './config.js';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1604382894740-747abb3801bb?w=600&q=80';

export function initAdminMenuEditor() {
  const container = document.getElementById('admin-menu-editor');
  if (!container) return;

  const menu = getMenu();
  renderEditor(container, menu);

  container.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-action="add-item"]');
    if (addBtn) {
      const categoryId = addBtn.dataset.categoryId;
      addItemToCategory(categoryId);
      return;
    }

    const editBtn = e.target.closest('[data-action="edit-item"]');
    if (editBtn) {
      const itemId = editBtn.dataset.itemId;
      openItemEditor(itemId);
      return;
    }

    const removeBtn = e.target.closest('[data-action="remove-item"]');
    if (removeBtn) {
      const itemId = removeBtn.dataset.itemId;
      removeItem(itemId);
      return;
    }
  });

  container.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-editor-form="item"]');
    if (!form) return;
    e.preventDefault();
    saveItemForm(form);
  });
}

function renderEditor(container, menu) {
  const html = `
    <div class="admin-menu-editor__toolbar">
      <h3>Edytor menu</h3>
      <p>Dodawaj pozycje, edytuj nazwę, cenę, opis i zdjęcie.</p>
    </div>
    ${menu.categories.map(category => `
      <section class="admin-menu-category">
        <div class="admin-menu-category__header">
          <strong>${category.name}</strong>
          <button class="btn btn-sm" data-action="add-item" data-category-id="${category.id}">+ Dodaj pozycję</button>
        </div>
        <div class="admin-menu-category__items">
          ${(category.items || []).map(item => `
            <div class="admin-menu-item-card">
              <img src="${item.image || DEFAULT_IMAGE}" alt="${item.name}" />
              <div>
                <div class="admin-menu-item-card__title">${item.name}</div>
                <div class="admin-menu-item-card__price">${item.price} zł</div>
              </div>
              <div class="admin-menu-item-card__actions">
                <button class="btn btn-sm" data-action="edit-item" data-item-id="${item.id}">✎</button>
                <button class="btn btn-sm btn-secondary" data-action="remove-item" data-item-id="${item.id}">🗑</button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `).join('')}
  `;

  container.innerHTML = html;
}

function addItemToCategory(categoryId) {
  const menu = getMenu();
  const category = menu.categories.find(c => c.id === categoryId);
  if (!category) return;

  const newItem = {
    id: `item-${Date.now()}`,
    name: 'Nowa pozycja',
    description: 'Opis pozycji',
    price: 0,
    image: DEFAULT_IMAGE,
    tags: []
  };

  category.items.push(newItem);
  persistMenu(menu);
  rerender();
  openItemEditor(newItem.id);
}

function openItemEditor(itemId) {
  const menu = getMenu();
  const item = findItem(menu, itemId);
  if (!item) return;

  const panel = document.getElementById('admin-item-editor');
  if (!panel) return;

  const imageOptions = [
    DEFAULT_IMAGE,
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
    'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&q=80',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80'
  ];

  panel.innerHTML = `
    <form data-editor-form="item">
      <input type="hidden" name="itemId" value="${item.id}">
      <div class="admin-item-editor__grid">
        <label>
          <span>Nazwa pozycji</span>
          <input name="name" value="${escapeHtml(item.name)}" required>
        </label>
        <label>
          <span>Cena</span>
          <input name="price" type="number" step="0.01" value="${item.price}">
        </label>
        <label>
          <span>Opis</span>
          <textarea name="description">${escapeHtml(item.description || '')}</textarea>
        </label>
        <label>
          <span>Zdjęcie</span>
          <input name="image" value="${escapeHtml(item.image || DEFAULT_IMAGE)}" placeholder="https://..."><br>
          <select name="imagePreset">
            ${imageOptions.map(url => `<option value="${url}" ${url === (item.image || DEFAULT_IMAGE) ? 'selected' : ''}>${url}</option>`).join('')}
          </select>
        </label>
      </div>
      <div class="admin-item-editor__actions">
        <button class="btn btn-primary" type="submit">Zapisz pozycję</button>
        <button class="btn btn-secondary" type="button" onclick="this.closest('#admin-item-editor').innerHTML=''">Anuluj</button>
      </div>
    </form>
  `;
}

function saveItemForm(form) {
  const menu = getMenu();
  const id = form.elements.itemId.value;
  const item = findItem(menu, id);
  if (!item) return;

  item.name = form.elements.name.value.trim() || 'Nowa pozycja';
  item.description = form.elements.description.value.trim();
  item.price = Number(form.elements.price.value) || 0;
  const preset = form.elements.imagePreset.value;
  item.image = form.elements.image.value.trim() || preset || DEFAULT_IMAGE;

  persistMenu(menu);
  rerender();
  document.getElementById('admin-item-editor').innerHTML = '';
}

function removeItem(itemId) {
  const menu = getMenu();
  let removed = false;
  menu.categories.forEach(category => {
    const before = category.items.length;
    category.items = (category.items || []).filter(item => item.id !== itemId);
    removed = removed || category.items.length !== before;
  });
  if (!removed) return;
  persistMenu(menu);
  rerender();
}

function findItem(menu, itemId) {
  for (const category of menu.categories || []) {
    const found = (category.items || []).find(item => item.id === itemId);
    if (found) return found;
  }
  return null;
}

function persistMenu(menu) {
  setConfigOverrides({ menu });
}

function rerender() {
  const container = document.getElementById('admin-menu-editor');
  if (!container) return;
  renderEditor(container, getMenu());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
