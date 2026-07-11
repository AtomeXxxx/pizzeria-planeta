import { getMenu, setConfigOverrides } from './config.js';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1604382894740-747abb3801bb?w=600&q=80';

export async function initAdminMenuEditor() {
  const container = document.getElementById('admin-menu-editor');
  if (!container) return;

  if (container.dataset.adminEditorInitialized === '1') {
    await refreshAdminMenuEditor();
    return;
  }

  container.dataset.adminEditorInitialized = '1';
  await refreshAdminMenuEditor();

  container.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-action="add-item"]');
    if (addBtn) {
      const categoryId = addBtn.dataset.categoryId;
      addItemToCategory(getMenu(), categoryId);
      rerender();
      return;
    }

    const addCategoryBtn = e.target.closest('[data-action="add-category"]');
    if (addCategoryBtn) {
      addCategoryToMenu(getMenu());
      rerender();
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

    const removeCategoryBtn = e.target.closest('[data-action="remove-category"]');
    if (removeCategoryBtn) {
      const categoryId = removeCategoryBtn.dataset.categoryId;
      removeCategory(categoryId);
      return;
    }
  });

  container.addEventListener('submit', (e) => {
    const categoryForm = e.target.closest('form[data-editor-form="category"]');
    if (categoryForm) {
      e.preventDefault();
      saveCategoryForm(categoryForm);
      return;
    }

    const form = e.target.closest('form[data-editor-form="item"]');
    if (!form) return;
    e.preventDefault();
    saveItemForm(form);
  });
}

function renderEditor(container, menu) {
  const safeMenu = normalizeMenu(menu);
  const html = `
    <div class="admin-menu-editor__toolbar">
      <h3>Edytor menu graficznego</h3>
      <p>Dodawaj, usuwaj i edytuj kategorie oraz pozycje. Zmiany są od razu podglądane, a zapis następuje jednym przyciskiem.</p>
      <button class="btn btn-primary" type="button" data-action="add-category">+ Dodaj kategorię</button>
    </div>
    ${safeMenu.categories.map(category => `
      <section class="admin-menu-category">
        <form data-editor-form="category" data-category-id="${category.id}">
          <div class="admin-menu-category__header">
            <div class="admin-menu-category__title-group">
              <label class="admin-menu-category__field">
                <span>Nazwa kategorii</span>
                <input name="categoryName" value="${escapeHtml(category.name)}" required>
              </label>
              <label class="admin-menu-category__field">
                <span>Ikona</span>
                <input name="categoryIcon" value="${escapeHtml(category.icon || '🍕')}">
              </label>
            </div>
            <div class="admin-menu-category__actions">
              <button class="btn btn-sm btn-primary" type="submit">💾</button>
              <button class="btn btn-sm" type="button" data-action="add-item" data-category-id="${category.id}">+ Pozycja</button>
              <button class="btn btn-sm btn-secondary" type="button" data-action="remove-category" data-category-id="${category.id}">🗑</button>
            </div>
          </div>
          <div class="admin-menu-category__items">
            ${(category.items || []).map(item => `
              <div class="admin-menu-item-card">
                <img src="${item.image || DEFAULT_IMAGE}" alt="${item.name}" />
                <div>
                  <div class="admin-menu-item-card__title">${escapeHtml(item.name)}</div>
                  <div class="admin-menu-item-card__price">${Number(item.price || 0).toFixed(2).replace('.', ',')} zł</div>
                </div>
                <div class="admin-menu-item-card__actions">
                  <button class="btn btn-sm" type="button" data-action="edit-item" data-item-id="${item.id}">✎ Edytuj</button>
                  <button class="btn btn-sm btn-secondary" type="button" data-action="remove-item" data-item-id="${item.id}">🗑</button>
                </div>
              </div>
            `).join('')}
          </div>
        </form>
      </section>
    `).join('')}
  `;

  container.innerHTML = html;
  syncMenuTextarea();
}

export function addCategoryToMenu(menu, name = 'Nowa kategoria', icon = '📋') {
  const category = {
    id: `category-${Date.now()}`,
    name,
    icon,
    items: []
  };
  menu.categories.push(category);
  persistMenu(menu);
  return category;
}

export function addItemToCategory(menu, categoryId, defaults = {}) {
  const category = menu.categories.find(c => c.id === categoryId);
  if (!category) return null;

  const newItem = {
    id: defaults.id || `item-${Date.now()}`,
    name: defaults.name || 'Nowa pozycja',
    description: defaults.description || 'Opis pozycji',
    price: Number(defaults.price ?? 0),
    image: defaults.image || DEFAULT_IMAGE,
    tags: Array.isArray(defaults.tags) ? defaults.tags : [],
    sizes: Array.isArray(defaults.sizes) ? defaults.sizes : []
  };

  category.items.push(newItem);
  persistMenu(menu);
  return newItem;
}

export function updateCategoryInMenu(menu, categoryId, updates) {
  const category = menu.categories.find(c => c.id === categoryId);
  if (!category) return null;

  if (typeof updates?.name === 'string') category.name = updates.name.trim() || category.name;
  if (typeof updates?.icon === 'string') category.icon = updates.icon.trim() || category.icon;

  persistMenu(menu);
  return category;
}

export function updateItemInMenu(menu, itemId, updates) {
  const item = findItem(menu, itemId);
  if (!item) return null;

  if (typeof updates?.name === 'string') item.name = updates.name.trim() || 'Nowa pozycja';
  if (typeof updates?.description === 'string') item.description = updates.description;
  if (typeof updates?.price !== 'undefined') item.price = Number(updates.price) || 0;
  if (typeof updates?.image === 'string') item.image = updates.image.trim() || DEFAULT_IMAGE;
  if (Array.isArray(updates?.tags)) item.tags = updates.tags;
  if (Array.isArray(updates?.sizes)) item.sizes = updates.sizes;

  persistMenu(menu);
  return item;
}

function saveCategoryForm(form) {
  const menu = getMenu();
  const categoryId = form.dataset.categoryId;
  const category = updateCategoryInMenu(menu, categoryId, {
    name: form.elements.categoryName.value,
    icon: form.elements.categoryIcon.value
  });
  if (category) {
    rerender();
  }
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

  const tagsValue = (item.tags || []).join(', ');
  const sizesValue = (item.sizes || []).map(size => `${size.name}:${size.priceModifier ?? 0}`).join('\n');

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
        <label>
          <span>Tagi (oddziel przecinkami)</span>
          <input name="tags" value="${escapeHtml(tagsValue)}" placeholder="bestseller, pikantna">
        </label>
        <label>
          <span>Rozmiary (jedna pozycja na linię, format: nazwa:modifikator)</span>
          <textarea name="sizes" placeholder="30 cm:-5\n40 cm:0">${escapeHtml(sizesValue)}</textarea>
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

  const tags = form.elements.tags.value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);

  const sizes = form.elements.sizes.value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [name, modifier] = line.split(':');
      return {
        name: name?.trim() || 'Rozmiar',
        priceModifier: Number(modifier ?? 0)
      };
    });

  updateItemInMenu(menu, id, {
    name: form.elements.name.value,
    description: form.elements.description.value,
    price: form.elements.price.value,
    image: form.elements.image.value || form.elements.imagePreset.value,
    tags,
    sizes
  });

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

function removeCategory(categoryId) {
  const menu = getMenu();
  const before = menu.categories.length;
  menu.categories = (menu.categories || []).filter(category => category.id !== categoryId);
  if (menu.categories.length === before) return;
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
  syncMenuTextarea();
}

function rerender() {
  refreshAdminMenuEditor();
}

export async function refreshAdminMenuEditor() {
  const container = document.getElementById('admin-menu-editor');
  if (!container) return;

  const menu = await loadMenuFromServer();
  renderEditor(container, menu);
}

async function loadMenuFromServer() {
  const menuArea = typeof document !== 'undefined' ? document.getElementById('menu-json') : null;

  if (menuArea?.value) {
    try {
      const parsed = JSON.parse(menuArea.value);
      if (parsed && Array.isArray(parsed.categories)) {
        return normalizeMenu(parsed);
      }
    } catch (err) {
      console.warn('Nie udało się sparsować menu z pola edycji:', err);
    }
  }

  try {
    const res = await fetch('data/menu.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data.categories)) {
      setConfigOverrides({ menu: data });
      return normalizeMenu(data);
    }
  } catch (err) {
    console.warn('Nie udało się pobrać menu z pliku, używam aktualnego stanu:', err);
  }

  return normalizeMenu(getMenu());
}

function normalizeMenu(menu) {
  const categories = Array.isArray(menu?.categories)
    ? menu.categories.map(category => ({
        ...category,
        items: Array.isArray(category?.items) ? category.items : []
      }))
    : [];
  return { ...(menu || {}), categories };
}

function syncMenuTextarea() {
  if (typeof document === 'undefined') return;
  const menuArea = document.getElementById('menu-json');
  if (menuArea) {
    menuArea.value = JSON.stringify(getMenu(), null, 2);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
