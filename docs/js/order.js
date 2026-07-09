import { formatPrice } from './config.js';

export async function sendOrder(orderData, config) {
  const emailConfig = config?.email;

  if (!emailConfig?.serviceId || emailConfig.serviceId === 'TWOJ_SERVICE_ID') {
    return sendOrderFallback(orderData, config);
  }

  return sendOrderEmailJS(orderData, config, emailConfig);
}

async function sendOrderEmailJS(orderData, config, emailConfig) {
  if (typeof emailjs === 'undefined') {
    throw new Error('EmailJS nie załadowany. Sprawdź połączenie z internetem.');
  }

  const itemsList = orderData.items.map(item => {
    const size = item.size ? ` (${item.size})` : '';
    return `${item.quantity}x ${item.name}${size} - ${formatPrice(item.price * item.quantity)}`;
  }).join('\n');

  const templateParams = {
    to_email: emailConfig.ownerEmail,
    customer_name: orderData.name,
    customer_phone: orderData.phone,
    customer_email: orderData.email || 'brak',
    order_type: orderData.type === 'delivery' ? 'Dostawa' : 'Odbiór osobisty',
    delivery_address: orderData.address,
    order_items: itemsList,
    order_subtotal: formatPrice(orderData.totals.subtotal),
    order_delivery: orderData.totals.deliveryFee > 0
      ? formatPrice(orderData.totals.deliveryFee)
      : 'Gratis',
    order_total: formatPrice(orderData.totals.total),
    order_notes: orderData.notes || 'Brak uwag',
    restaurant_name: config.restaurant.name
  };

  await emailjs.send(
    emailConfig.serviceId,
    emailConfig.templateId,
    templateParams,
    emailConfig.publicKey
  );
}

async function sendOrderFallback(orderData, config) {
  const itemsList = orderData.items.map(item => {
    const size = item.size ? ` (${item.size})` : '';
    return `  ${item.quantity}x ${item.name}${size} - ${formatPrice(item.price * item.quantity)}`;
  }).join('\n');

  const body = `
NOWE ZAMÓWIENIE - ${config.restaurant.name}
==========================================

Klient: ${orderData.name}
Telefon: ${orderData.phone}
Email: ${orderData.email || 'brak'}
Typ: ${orderData.type === 'delivery' ? 'Dostawa' : 'Odbiór osobisty'}
Adres: ${orderData.address}

POZYCJE:
${itemsList}

Suma: ${formatPrice(orderData.totals.subtotal)}
Dostawa: ${orderData.totals.deliveryFee > 0 ? formatPrice(orderData.totals.deliveryFee) : 'Gratis'}
RAZEM: ${formatPrice(orderData.totals.total)}

Uwagi: ${orderData.notes || 'Brak'}
`.trim();

  const ownerEmail = config?.email?.ownerEmail || config?.restaurant?.email;

  const mailtoLink = `mailto:${ownerEmail}?subject=${encodeURIComponent('Nowe zamówienie - ' + orderData.name)}&body=${encodeURIComponent(body)}`;

  window.open(mailtoLink, '_blank');

  await new Promise(resolve => setTimeout(resolve, 500));
}
