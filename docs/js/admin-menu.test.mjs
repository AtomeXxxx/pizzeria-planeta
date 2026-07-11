import test from 'node:test';
import assert from 'node:assert/strict';

import { addCategoryToMenu, addItemToCategory, updateCategoryInMenu, updateItemInMenu } from './admin-menu.js';

test('updateCategoryInMenu updates category name and icon without losing items', () => {
  const menu = {
    categories: [
      {
        id: 'cat-1',
        name: 'Pizza',
        icon: '🍕',
        items: [{ id: 'item-1', name: 'Margherita', price: 30, tags: [] }]
      }
    ]
  };

  const updated = updateCategoryInMenu(menu, 'cat-1', { name: 'Pizza 40 cm', icon: '🔥' });

  assert.equal(updated.name, 'Pizza 40 cm');
  assert.equal(updated.icon, '🔥');
  assert.equal(updated.items.length, 1);
  assert.equal(updated.items[0].name, 'Margherita');
});

test('addItemToCategory appends a new item and addCategoryToMenu creates a new category', () => {
  const menu = {
    categories: [
      {
        id: 'cat-1',
        name: 'Pizza',
        icon: '🍕',
        items: []
      }
    ]
  };

  const item = addItemToCategory(menu, 'cat-1');
  const category = addCategoryToMenu(menu, 'Nowa kategoria', '🥗');

  assert.ok(item.id.startsWith('item-'));
  assert.equal(menu.categories[0].items.length, 1);
  assert.equal(category.name, 'Nowa kategoria');
  assert.equal(menu.categories.length, 2);
});

test('updateItemInMenu edits item fields and preserves the id', () => {
  const menu = {
    categories: [
      {
        id: 'cat-1',
        name: 'Pizza',
        icon: '🍕',
        items: [{ id: 'item-1', name: 'Margherita', description: '', price: 30, image: '', tags: [], sizes: [] }]
      }
    ]
  };

  const updated = updateItemInMenu(menu, 'item-1', {
    name: 'Capriciosa',
    description: 'Pyszna',
    price: 35,
    image: 'https://example.com/pizza.jpg',
    tags: ['bestseller'],
    sizes: [{ name: '30 cm', priceModifier: -5 }]
  });

  assert.equal(updated.id, 'item-1');
  assert.equal(updated.name, 'Capriciosa');
  assert.equal(updated.description, 'Pyszna');
  assert.equal(updated.price, 35);
  assert.deepEqual(updated.tags, ['bestseller']);
  assert.equal(updated.sizes[0].name, '30 cm');
});
